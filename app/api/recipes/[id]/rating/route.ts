/**
 * PUT    /api/recipes/[id]/rating  — imposta/aggiorna il voto personale dell'admin (upsert)
 * DELETE /api/recipes/[id]/rating  — rimuove il voto personale dell'admin
 *
 * Il voto è per-account (RecipeRating @@id([adminId, recipeId])), distinto dalle
 * recensioni ospiti e fuori dalla media pubblica.
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { revalidateRecipes } from "@/lib/queries";
import { getSession, requireAdmin } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const session = await getSession();

  const { id } = await params;
  const recipeId = Number(id);
  if (isNaN(recipeId)) return err("ID non valido", 400);

  const exists = await db.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
  if (!exists) return err("Ricetta non trovata", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { rating?: number; note?: string | null };
  if (b.rating === undefined || b.rating < 1 || b.rating > 10) {
    return err("Il campo 'rating' deve essere tra 1 e 10");
  }

  const rating = Math.round(b.rating);
  const note = b.note?.trim() || null;

  const saved = await db.recipeRating.upsert({
    where: { adminId_recipeId: { adminId: session!.adminId, recipeId } },
    create: { adminId: session!.adminId, recipeId, rating, note },
    update: { rating, note },
    select: { rating: true, note: true },
  });

  revalidateRecipes();
  return ok(saved);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const session = await getSession();

  const { id } = await params;
  const recipeId = Number(id);
  if (isNaN(recipeId)) return err("ID non valido", 400);

  await db.recipeRating
    .delete({ where: { adminId_recipeId: { adminId: session!.adminId, recipeId } } })
    .catch(() => null); // idempotente: se non c'è, ok comunque

  revalidateRecipes();
  return ok({ deleted: true });
}
