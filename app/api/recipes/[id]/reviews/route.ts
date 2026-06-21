/**
 * GET  /api/recipes/[id]/reviews  — lista recensioni di una ricetta
 * POST /api/recipes/[id]/reviews  — aggiungi recensione
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { revalidateRecipes } from "@/lib/queries";
import { getSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]/reviews">
) {
  const { id } = await ctx.params;
  const recipeId = Number(id);
  const isAdmin = !!(await getSession());

  const exists = await db.recipe.findUnique({ where: { id: recipeId }, select: { published: true } });
  // Ricetta "non pronta": nascosta ai visitatori, niente recensioni via API diretta
  if (!exists || (!isAdmin && !exists.published)) return err("Ricetta non trovata", 404);

  const reviews = await db.review.findMany({
    where: { recipeId },
    orderBy: { createdAt: "desc" },
  });

  return ok(reviews);
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]/reviews">
) {
  const { id } = await ctx.params;
  const recipeId = Number(id);
  const isAdmin = !!(await getSession());

  const exists = await db.recipe.findUnique({ where: { id: recipeId }, select: { published: true } });
  if (!exists || (!isAdmin && !exists.published)) return err("Ricetta non trovata", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { nickname?: string; rating?: number; comment?: string };

  if (!b.nickname?.trim()) return err("Il campo 'nickname' è obbligatorio");
  if (b.rating === undefined || b.rating < 1 || b.rating > 5) {
    return err("Il campo 'rating' deve essere tra 1 e 5");
  }

  const review = await db.review.create({
    data: {
      recipeId,
      nickname: b.nickname.trim(),
      rating: Math.round(b.rating),
      comment: b.comment?.trim() || null,
    },
  });

  revalidateRecipes();
  return ok(review, 201);
}

