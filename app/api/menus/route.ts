/**
 * GET  /api/menus  — lista menu
 * POST /api/menus  — crea menu (admin)
 */

import { type NextRequest } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { ok, err, normalizePeople, normalizeMenuRecipes } from "@/lib/api";
import { revalidateMenus } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

const menuSummarySelect = {
  id: true,
  name: true,
  description: true,
  date: true,
  servingTime: true,
  people: true,
  photo: true,
  createdAt: true,
  _count: { select: { recipeReviews: true, recipes: true } },
  recipeReviews: { select: { rating: true } },
  recipes: {
    select: {
      order: true,
      recipe: { select: { photo: true } },
    },
    orderBy: { order: "asc" as const },
    take: 4,
  },
} as const;

function flattenMenu(m: {
  recipeReviews: { rating: number }[];
  recipes: { order: number; recipe: { photo: string | null } }[];
  [key: string]: unknown;
}) {
  const reviews = m.recipeReviews ?? [];
  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : null;
  const previewPhotos = m.recipes
    .map((mr: { order: number; recipe: { photo: string | null } }) => mr.recipe.photo)
    .filter((p): p is string => p !== null);
  return { ...m, avgRating, previewPhotos };
}

export async function GET() {
  const menus = await db.menu.findMany({
    select: menuSummarySelect,
    orderBy: { createdAt: "desc" },
  });
  return ok(menus.map(flattenMenu));
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
    description?: string;
    date?: string;
    servingTime?: string;
    people?: number | null;
    photo?: string;
    published?: boolean;
    recipeIds?: number[];
    recipes?: { recipeId: number; servings?: number | null }[];
  };

  if (!b.name?.trim()) return err("Il campo 'name' è obbligatorio");

  // Ricette: forma ricca `{recipeId, servings}[]` (porzioni per il menù), con
  // fallback alla vecchia `recipeIds` (senza override porzioni)
  const recipeRows = normalizeMenuRecipes(b.recipes, b.recipeIds);

  const menu = await db.menu.create({
    data: {
      name: b.name.trim(),
      description: b.description?.trim() || null,
      date: b.date ? new Date(b.date) : null,
      servingTime: b.date ? (b.servingTime?.trim() || null) : null,
      people: normalizePeople(b.people),
      photo: b.photo?.trim() || null,
      published: typeof b.published === "boolean" ? b.published : true,
      reviewToken: crypto.randomUUID(),
      recipes: {
        create: recipeRows.map((r, idx) => ({
          recipeId: r.recipeId,
          order: idx,
          servings: r.servings,
        })),
      },
    },
    select: { id: true, name: true },
  });

  revalidateMenus();
  return ok(menu, 201);
}

