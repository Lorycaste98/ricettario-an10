/**
 * POST /api/admin/import
 *
 * Riceve un JSON con la struttura { categories, ingTags, recipes }
 * e sostituisce tutti i dati del ricettario (ricette, categorie, tag, menù).
 * Gli Admin non vengono toccati.
 *
 * Il body deve essere application/json con la struttura del file ricettario.json
 */

import { requireAdmin } from "@/lib/session";
import { ok, err } from "@/lib/api";
import { db } from "@/lib/db";
import { revalidateRecipes } from "@/lib/queries";

// ---------------------------------------------------------------------------
// Tipi JSON sorgente (identici a seed.ts)
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
  id?: string;
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
// Utility (identiche a seed.ts)
// ---------------------------------------------------------------------------
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function nullIfEmpty(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value.trim() === "" ? null : value.trim();
}

function normalizeQty(qty: number): number | null {
  return qty === 0 ? null : qty;
}

function normalizeMins(mins: number): number | null {
  return mins === 0 ? null : mins;
}

function normalizePrepCook(val: number | undefined): number | null {
  if (val === undefined || val === null) return null;
  return val === 0 ? null : val;
}

function resolveCategories(recipe: JsonRecipe): string[] {
  const cats =
    recipe.cats && recipe.cats.length > 0
      ? recipe.cats
      : recipe.cat
      ? [recipe.cat]
      : [];
  const seen = new Set<string>();
  return cats.filter((c) => {
    const key = c.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Validazione base
// ---------------------------------------------------------------------------
function validateData(data: unknown): data is JsonData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.categories)) return false;
  if (!Array.isArray(d.ingTags)) return false;
  if (!Array.isArray(d.recipes)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return err("JSON non valido o body mancante", 400);
  }

  if (!validateData(data)) {
    return err(
      'Struttura JSON non valida. Deve contenere "categories" (array), "ingTags" (array) e "recipes" (array).',
      400
    );
  }

  const raw = data as JsonData;

  try {
    // ── 1. Cancella tutti i dati (Admin escluso) ─────────────────────────
    // L'ordine è importante per i vincoli FK non-cascade
    // Recipe ha cascade su Ingredient, Step, RecipePhoto, RecipeTag, RecipeCategory, Review, MenuRecipe
    // Menu ha cascade su MenuRecipe, MenuReview
    await db.menu.deleteMany();
    await db.recipe.deleteMany();
    await db.category.deleteMany();
    await db.tag.deleteMany();

    // ── 2. Categorie ─────────────────────────────────────────────────────
    for (const cat of raw.categories) {
      await db.category.upsert({
        where: { name: cat.name },
        update: { color: cat.color },
        create: { name: cat.name, color: cat.color },
      });
    }

    // ── 3. Tag ───────────────────────────────────────────────────────────
    const allTagNames = new Set<string>(raw.ingTags);
    for (const recipe of raw.recipes) {
      for (const t of recipe.tags ?? []) {
        if (t && t.trim()) allTagNames.add(t.trim());
      }
    }
    for (const tagName of allTagNames) {
      await db.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });
    }

    // ── 4. Ricette ───────────────────────────────────────────────────────
    let recipeCount = 0;
    for (const recipe of raw.recipes) {
      const categoryNames = resolveCategories(recipe);
      const tagNames = (recipe.tags ?? []).map((t) => t.trim()).filter(Boolean);

      const categories = categoryNames.length
        ? await db.category.findMany({ where: { name: { in: categoryNames } } })
        : [];

      const tags = tagNames.length
        ? await db.tag.findMany({ where: { name: { in: tagNames } } })
        : [];

      const ingredients = (recipe.ingredients ?? []).map((ing, idx) => ({
        name: stripHtml(ing.name),
        qty: normalizeQty(ing.qty),
        unit: nullIfEmpty(ing.unit),
        order: idx,
      }));

      const steps = (recipe.steps ?? []).map((step, idx) => ({
        text: step.text,
        mins: normalizeMins(step.mins),
        order: idx,
      }));

      const photos = (recipe.photos ?? [])
        .filter((url) => url && url.trim() !== "")
        .map((url, idx) => ({ url, order: idx }));

      await db.recipe.create({
        data: {
          name: recipe.name,
          servings: recipe.servings ?? null,
          prep: normalizePrepCook(recipe.prep),
          cook: normalizePrepCook(recipe.cook),
          notes: nullIfEmpty(recipe.notes),
          links: nullIfEmpty(recipe.links),
          photo: recipe.photo ?? null,
          ...(recipe.createdAt ? { createdAt: new Date(recipe.createdAt) } : {}),
          categories: {
            create: categories.map((c: { id: number }) => ({ categoryId: c.id })),
          },
          tags: {
            create: tags.map((t: { id: number }) => ({ tagId: t.id })),
          },
          ingredients: { create: ingredients },
          steps: { create: steps },
          photos: { create: photos },
        },
      });
      recipeCount++;
    }

    // ── 5. Riepilogo ─────────────────────────────────────────────────────
    const [totCategories, totTags, totRecipes] = await Promise.all([
      db.category.count(),
      db.tag.count(),
      db.recipe.count(),
    ]);

    revalidateRecipes();
    return ok({
      message: "Importazione completata con successo.",
      stats: {
        categories: totCategories,
        tags: totTags,
        recipes: totRecipes,
        imported: recipeCount,
      },
    });
  } catch (e) {
    console.error("[import] Errore durante l'importazione:", e);
    return err(
      `Errore durante l'importazione: ${e instanceof Error ? e.message : String(e)}`,
      500
    );
  }
}

