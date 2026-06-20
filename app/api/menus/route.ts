/**
 * GET  /api/menus  — lista menu
 * POST /api/menus  — crea menu (admin)
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

const menuSummarySelect = {
  id: true,
  name: true,
  description: true,
  date: true,
  servingTime: true,
  photo: true,
  createdAt: true,
  _count: { select: { reviews: true, recipes: true } },
  reviews: { select: { rating: true } },
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
  reviews: { rating: number }[];
  recipes: { order: number; recipe: { photo: string | null } }[];
  [key: string]: unknown;
}) {
  const reviews = m.reviews ?? [];
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
    photo?: string;
    recipeIds?: number[];
  };

  if (!b.name?.trim()) return err("Il campo 'name' è obbligatorio");

  const menu = await db.menu.create({
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

  return ok(menu, 201);
}

