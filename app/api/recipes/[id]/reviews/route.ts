/**
 * GET  /api/recipes/[id]/reviews  — lista recensioni di una ricetta
 * POST /api/recipes/[id]/reviews  — nota personale dell'admin (nessuna recensione pubblica diretta:
 *                                    le recensioni "vere" arrivano solo dal link di recensione del menù)
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { revalidateRecipes } from "@/lib/queries";
import { getSession, requireAdmin } from "@/lib/session";

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

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]/reviews">
) {
  // Nota personale dello chef: solo l'admin può crearla, direttamente sulla ricetta
  const guard = await requireAdmin();
  if (guard) return guard;
  const session = await getSession();

  const { id } = await ctx.params;
  const recipeId = Number(id);

  const exists = await db.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
  if (!exists) return err("Ricetta non trovata", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { rating?: number; comment?: string };

  if (b.rating === undefined || b.rating < 1 || b.rating > 10) {
    return err("Il campo 'rating' deve essere tra 1 e 10");
  }

  const review = await db.review.create({
    data: {
      recipeId,
      nickname: session!.username,
      rating: Math.round(b.rating),
      comment: b.comment?.trim() || null,
    },
  });

  revalidateRecipes();
  return ok(review, 201);
}
