/**
 * GET    /api/menus/[id]  — dettaglio menu
 * PUT    /api/menus/[id]  — aggiorna menu (admin)
 * DELETE /api/menus/[id]  — elimina menu (admin)
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { recipeSummarySelect, flattenRecipe, ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

const menuDetailSelect = {
  id: true,
  name: true,
  description: true,
  date: true,
  servingTime: true,
  photo: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { reviews: true, recipes: true } },
  reviews: {
    select: { id: true, nickname: true, rating: true, comment: true, createdAt: true },
    orderBy: { createdAt: "desc" as const },
  },
  recipes: {
    select: {
      order: true,
      recipe: { select: recipeSummarySelect },
    },
    orderBy: { order: "asc" as const },
  },
} as const;

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) return err("ID non valido", 400);

  const menu = await db.menu.findUnique({
    where: { id: menuId },
    select: menuDetailSelect,
  });
  if (!menu) return err("Menu non trovato", 404);

  const reviews = menu.reviews as { rating: number }[];
  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : null;
  const previewPhotos = (menu.recipes
    .map((mr: { order: number; recipe: { photo?: string | null } }) => mr.recipe.photo ?? null) as (string | null)[])
    .filter((p: string | null): p is string => p !== null);

  return ok({
    ...menu,
    avgRating,
    previewPhotos,
    recipes: menu.recipes.map((mr: { order: number; recipe: unknown }) => ({
      order: mr.order,
      recipe: flattenRecipe(mr.recipe),
    })),
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) return err("ID non valido", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as {
    name?: string;
    description?: string;
    date?: string | null;
    servingTime?: string | null;
    photo?: string | null;
    recipeIds?: number[];
  };

  if (!b.name?.trim()) return err("Il campo 'name' è obbligatorio");

  // Replace recipes if provided
  await db.menuRecipe.deleteMany({ where: { menuId } });

  const menu = await db.menu.update({
    where: { id: menuId },
    data: {
      name: b.name.trim(),
      description: b.description?.trim() || null,
      date: b.date ? new Date(b.date) : null,
      servingTime: b.date ? (b.servingTime?.trim() || null) : null,
      photo: b.photo?.trim() || null,
      recipes: {
        create: (b.recipeIds ?? []).map((recipeId, idx) => ({
          recipeId,
          order: idx,
        })),
      },
    },
    select: { id: true, name: true },
  });

  return ok(menu);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) return err("ID non valido", 400);

  await db.menu.delete({ where: { id: menuId } });
  return ok({ deleted: true });
}

