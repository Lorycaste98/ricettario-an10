/**
 * GET  /api/recipes  — lista ricette (filtri, ricerca, paginazione)
 * POST /api/recipes  — crea ricetta
 *
 * Query params GET:
 *   q        — cerca nel nome (contains, case-insensitive)
 *   category — ID categoria
 *   tag      — ID tag
 *   page     — pagina (default 1)
 *   limit    — per pagina (default 500, max 1000). Usa limit=1000 per scaricare tutto in una fetch.
 *   sort     — campo di ordinamento: name | createdAt | prep | cook | servings (default: createdAt)
 *   order    — direzione: asc | desc (default: desc)
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { recipeSummarySelect, flattenRecipe, ok, err, parseDateOnly } from "@/lib/api";
import { attachRecipeRatings, revalidateRecipes } from "@/lib/queries";
import { getSession, requireAdmin } from "@/lib/session";
import { toStepKind } from "@/lib/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const isAdmin = !!(await getSession());

  const q = sp.get("q")?.trim() || undefined;
  const categoryId = sp.get("category") ? Number(sp.get("category")) : undefined;
  const tagId = sp.get("tag") ? Number(sp.get("tag")) : undefined;
  const page = Math.max(1, Number(sp.get("page") || 1));
  const limit = Math.min(1000, Math.max(1, Number(sp.get("limit") || 500)));
  const skip = (page - 1) * limit;

  const SORTABLE_FIELDS = ["name", "createdAt", "prep", "cook", "servings"] as const;
  type SortField = (typeof SORTABLE_FIELDS)[number];
  const sortRaw = sp.get("sort") ?? "createdAt";
  const sort: SortField = (SORTABLE_FIELDS as readonly string[]).includes(sortRaw)
    ? (sortRaw as SortField)
    : "createdAt";
  const order = sp.get("order") === "asc" ? "asc" : ("desc" as const);

  const where = {
    ...(isAdmin ? {} : { published: true }),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(categoryId
      ? { categories: { some: { categoryId } } }
      : {}),
    ...(tagId ? { tags: { some: { tagId } } } : {}),
  };

  const [total, recipes] = await Promise.all([
    db.recipe.count({ where }),
    db.recipe.findMany({
      where,
      select: recipeSummarySelect,
      orderBy: { [sort]: order },
      skip,
      take: limit,
    }),
  ]);

  return ok({
    data: await attachRecipeRatings(recipes),
    meta: { total, page, limit, pages: Math.ceil(total / limit), sort, order },
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as {
    name?: string;
    createdAt?: string;
    servings?: number;
    prep?: number;
    cook?: number;
    notes?: string;
    links?: string;
    photo?: string;
    categoryIds?: number[];
    tagIds?: number[];
    ingredients?: { name: string; qty?: number; unit?: string; description?: string; order: number }[];
    steps?: { text: string; mins?: number; kind?: string; order: number }[];
    photos?: { url: string; order?: number }[];
  };

  if (!b.name?.trim()) return err("Il campo 'name' è obbligatorio");

  const recipe = await db.recipe.create({
    data: {
      name: b.name.trim(),
      ...(parseDateOnly(b.createdAt) ? { createdAt: parseDateOnly(b.createdAt) } : {}),
      servings: b.servings ?? null,
      prep: b.prep ?? null,
      cook: b.cook ?? null,
      notes: b.notes?.trim() || null,
      links: b.links?.trim() || null,
      photo: b.photo ?? null,
      categories: {
        create: (b.categoryIds ?? []).map((id) => ({ categoryId: id })),
      },
      tags: {
        create: (b.tagIds ?? []).map((id) => ({ tagId: id })),
      },
      ingredients: {
        create: (b.ingredients ?? []).map((i) => ({
          name: i.name,
          qty: i.qty ?? null,
          unit: i.unit ?? null,
          description: i.description ?? null,
          order: i.order,
        })),
      },
      steps: {
        create: (b.steps ?? []).map((s) => ({
          text: s.text,
          mins: s.mins ?? null,
          kind: toStepKind(s.kind),
          order: s.order,
        })),
      },
      photos: {
        create: (b.photos ?? []).map((p, idx) => ({
          url: p.url,
          order: p.order ?? idx,
        })),
      },
    },
    select: recipeSummarySelect,
  });

  // Sincronizza i nuovi nomi nel catalogo ingredienti
  const names = (b.ingredients ?? []).map((i) => i.name.trim()).filter(Boolean);
  if (names.length > 0) {
    await Promise.all(
      names.map((name) =>
        db.ingredientMaster.upsert({ where: { name }, create: { name }, update: {} })
      )
    );
  }

  revalidateRecipes();
  return ok(flattenRecipe(recipe), 201);
}

