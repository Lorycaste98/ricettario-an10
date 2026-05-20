/**
 * Seed script — popola il DB Supabase a partire da prisma/data/ricettario.json
 *
 * Come eseguire:
 *   pnpm seed
 *
 * Incongruenze gestite:
 *  • cat (stringa) vs cats (array) → si usa cats quando disponibile, altrimenti [cat]
 *  • HTML nei nomi ingredienti (<b>80</b> gr) → rimossi con stripHtml()
 *  • qty: 0 → null (significa "q.b. / a piacere")
 *  • unit: "" → null
 *  • mins: 0 in steps → null
 *  • notes: "" / links: "" → null
 *  • cook: 0 / prep: 0 → null
 *  • cookCount → ignorato (non in schema)
 *  • ID stringa (r_xxxxx) → ignorato (autoincrement nel DB)
 *  • ingTags → Tag records; recipe.tags può contenere nomi non in ingTags → creati comunque
 *  • photos[] → RecipePhoto records
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// DB client
// ---------------------------------------------------------------------------
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Tipi JSON sorgente
// ---------------------------------------------------------------------------
interface JsonIngredient {
  name: string;
  qty: number;
  unit: string;
}

interface JsonStep {
  text: string;
  mins: number;
}

interface JsonRecipe {
  id: string;
  name: string;
  servings?: number;
  prep?: number;
  cook?: number;
  notes?: string;
  links?: string;
  photo?: string | null;
  photos?: string[];
  cat?: string;
  cats?: string[];
  tags?: string[];
  ingredients?: JsonIngredient[];
  steps?: JsonStep[];
  createdAt?: string;
  cookCount?: number;
}

interface JsonData {
  categories: { name: string; color: string }[];
  ingTags: string[];
  recipes: JsonRecipe[];
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Rimuove tag HTML e normalizza spazi */
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/** Converte stringa vuota / null / undefined in null */
function nullIfEmpty(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value.trim() === "" ? null : value.trim();
}

/**
 * qty: 0 in origine significa quasi sempre "quanto basta" → null.
 * qty positivo viene mantenuto.
 */
function normalizeQty(qty: number): number | null {
  return qty === 0 ? null : qty;
}

/** mins: 0 nei passi → null */
function normalizeMins(mins: number): number | null {
  return mins === 0 ? null : mins;
}

/** Minuti 0 per prep/cook → null */
function normalizePrepCook(val: number | undefined): number | null {
  if (val === undefined || val === null) return null;
  return val === 0 ? null : val;
}

/**
 * Risolve l'elenco di categorie di una ricetta.
 * Preferisce `cats` (array), poi `cat` (stringa), deduplicando.
 */
function resolveCategories(recipe: JsonRecipe): string[] {
  const cats = recipe.cats && recipe.cats.length > 0
    ? recipe.cats
    : recipe.cat
    ? [recipe.cat]
    : [];
  // dedup case-insensitive (mantiene il primo trovato)
  const seen = new Set<string>();
  return cats.filter((c) => {
    const key = c.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const dataPath = path.join(__dirname, "data", "ricettario.json");

  if (!fs.existsSync(dataPath)) {
    throw new Error(`File non trovato: ${dataPath}`);
  }

  const raw: JsonData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  console.log("─────────────────────────────────────────");
  console.log(`Categorie  : ${raw.categories.length}`);
  console.log(`Tag (pool) : ${raw.ingTags.length}`);
  console.log(`Ricette    : ${raw.recipes.length}`);
  console.log("─────────────────────────────────────────\n");

  // ── 1. Categorie ──────────────────────────────────────────────────────────
  console.log("1/4 Inserimento categorie…");
  for (const cat of raw.categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { color: cat.color },
      create: { name: cat.name, color: cat.color },
    });
  }
  console.log(`    ✓ ${raw.categories.length} categorie\n`);

  // ── 2. Tag ────────────────────────────────────────────────────────────────
  // Unione di ingTags + tutti i tag usati nelle ricette
  console.log("2/4 Inserimento tag…");
  const allTagNames = new Set<string>(raw.ingTags);
  for (const recipe of raw.recipes) {
    for (const t of recipe.tags ?? []) {
      if (t && t.trim()) allTagNames.add(t.trim());
    }
  }
  for (const tagName of allTagNames) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
  }
  console.log(`    ✓ ${allTagNames.size} tag\n`);

  // ── 3. Ricette ────────────────────────────────────────────────────────────
  console.log("3/4 Inserimento ricette…");
  let recipeCount = 0;

  for (const recipe of raw.recipes) {
    const categoryNames = resolveCategories(recipe);
    const tagNames = (recipe.tags ?? []).map((t) => t.trim()).filter(Boolean);

    // Recupera ID categorie e tag già inseriti
    const categories = categoryNames.length
      ? await prisma.category.findMany({ where: { name: { in: categoryNames } } })
      : [];

    const tags = tagNames.length
      ? await prisma.tag.findMany({ where: { name: { in: tagNames } } })
      : [];

    // Ingredienti normalizzati
    const ingredients = (recipe.ingredients ?? []).map((ing, idx) => ({
      name: stripHtml(ing.name),
      qty: normalizeQty(ing.qty),
      unit: nullIfEmpty(ing.unit),
      order: idx,
    }));

    // Passi normalizzati
    const steps = (recipe.steps ?? []).map((step, idx) => ({
      text: step.text,
      mins: normalizeMins(step.mins),
      order: idx,
    }));

    // Foto (array) → RecipePhoto
    const photos = (recipe.photos ?? [])
      .filter((url) => url && url.trim() !== "")
      .map((url, idx) => ({ url, order: idx }));

    await prisma.recipe.create({
      data: {
        name: recipe.name,
        servings: recipe.servings ?? null,
        prep: normalizePrepCook(recipe.prep),
        cook: normalizePrepCook(recipe.cook),
        notes: nullIfEmpty(recipe.notes),
        links: nullIfEmpty(recipe.links),
        photo: recipe.photo ?? null,
        // Preserva il timestamp originale se disponibile
        ...(recipe.createdAt ? { createdAt: new Date(recipe.createdAt) } : {}),

        categories: {
          create: categories.map((c: { id: number }) => ({ categoryId: c.id })),
        },
        tags: {
          create: tags.map((t: { id: number }) => ({ tagId: t.id })),
        },
        ingredients: {
          create: ingredients,
        },
        steps: {
          create: steps,
        },
        photos: {
          create: photos,
        },
      },
    });

    recipeCount++;
    process.stdout.write(`\r    Ricette inserite: ${recipeCount}/${raw.recipes.length}`);
  }

  console.log(`\n    ✓ ${recipeCount} ricette\n`);

  // ── 4. Riepilogo ──────────────────────────────────────────────────────────
  console.log("4/4 Riepilogo finale…");
  const [totCategories, totTags, totRecipes, totIngredients, totSteps, totPhotos] =
    await Promise.all([
      prisma.category.count(),
      prisma.tag.count(),
      prisma.recipe.count(),
      prisma.ingredient.count(),
      prisma.step.count(),
      prisma.recipePhoto.count(),
    ]);

  console.log("─────────────────────────────────────────");
  console.log(`Categorie  : ${totCategories}`);
  console.log(`Tag        : ${totTags}`);
  console.log(`Ricette    : ${totRecipes}`);
  console.log(`Ingredienti: ${totIngredients}`);
  console.log(`Passi      : ${totSteps}`);
  console.log(`Foto       : ${totPhotos}`);
  console.log("─────────────────────────────────────────");
  console.log("\n✅ Seed completato!");
}

main()
  .catch((e) => {
    console.error("\n❌ Errore durante il seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

