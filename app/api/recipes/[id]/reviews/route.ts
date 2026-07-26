/**
 * GET  /api/recipes/[id]/reviews  — lista recensioni ospiti di una ricetta (dai link menù)
 *
 * Il voto personale dell'admin NON è più una recensione: vive in RecipeRating,
 * gestito da `PUT/DELETE /api/recipes/[id]/rating`.
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
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
    include: { menu: { select: { id: true, name: true } } },
  });

  return ok(reviews);
}
