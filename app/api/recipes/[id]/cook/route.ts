/**
 * POST   /api/recipes/[id]/cook  — segna "ho cucinato questa ricetta oggi" (+1)
 * DELETE /api/recipes/[id]/cook  — annulla l'ultimo conteggio (-1, min 0)
 *
 * Solo admin. Il contatore viene incrementato/decrementato di 1.
 * La UI mostrerà un pulsante "Ho cucinato questa ricetta!" nella pagina di dettaglio.
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]/cook">
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;
  const recipeId = Number(id);

  const recipe = await db.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, cookCount: true },
  });
  if (!recipe) return err("Ricetta non trovata", 404);

  const updated = await db.recipe.update({
    where: { id: recipeId },
    data: { cookCount: { increment: 1 } },
    select: { id: true, name: true, cookCount: true },
  });

  return ok(updated);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]/cook">
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;
  const recipeId = Number(id);

  const recipe = await db.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, cookCount: true },
  });
  if (!recipe) return err("Ricetta non trovata", 404);
  if (recipe.cookCount === 0) return err("Il contatore è già a 0");

  const updated = await db.recipe.update({
    where: { id: recipeId },
    data: { cookCount: { decrement: 1 } },
    select: { id: true, name: true, cookCount: true },
  });

  return ok(updated);
}

