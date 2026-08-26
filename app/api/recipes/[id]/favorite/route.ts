/**
 * PUT /api/recipes/[id]/favorite    — salva la ricetta tra i preferiti dell'admin
 * DELETE /api/recipes/[id]/favorite — la rimuove
 *
 * Solo admin (gli ospiti anonimi usano localStorage, vedi lib/favorites.ts).
 * Idempotente in entrambe le direzioni: il client fa update ottimistico e non
 * deve preoccuparsi di doppi click o di uno stato già allineato.
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { getSession } from "@/lib/session";

export async function PUT(
  _req: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]/favorite">
) {
  const session = await getSession();
  if (!session) return err("Non autorizzato", 401);

  const { id } = await ctx.params;
  const recipeId = Number(id);
  if (!Number.isInteger(recipeId)) return err("Id ricetta non valido");

  const exists = await db.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
  if (!exists) return err("Ricetta non trovata", 404);

  await db.recipeFavorite.upsert({
    where: { adminId_recipeId: { adminId: session.adminId, recipeId } },
    create: { adminId: session.adminId, recipeId },
    update: {},
  });

  return ok({ favorite: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]/favorite">
) {
  const session = await getSession();
  if (!session) return err("Non autorizzato", 401);

  const { id } = await ctx.params;
  const recipeId = Number(id);
  if (!Number.isInteger(recipeId)) return err("Id ricetta non valido");

  await db.recipeFavorite.deleteMany({ where: { adminId: session.adminId, recipeId } });

  return ok({ favorite: false });
}
