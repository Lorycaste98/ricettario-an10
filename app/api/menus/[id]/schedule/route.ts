/**
 * PATCH /api/menus/[id]/schedule — imposta l'orario di inizio pianificato di una
 * ricetta del menù nella timeline della modalità cucina (admin).
 *
 * Body: { recipeId: number, cookStartAt: string | null }
 *   cookStartAt ISO; null = torna al calcolo automatico (all'indietro dal servizio).
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { revalidateMenus } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/menus/[id]/schedule">
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;
  const menuId = Number(id);
  if (isNaN(menuId)) return err("ID non valido", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const { recipeId, cookStartAt } = body as { recipeId?: unknown; cookStartAt?: unknown };
  if (typeof recipeId !== "number" || !Number.isInteger(recipeId)) {
    return err("Il campo 'recipeId' deve essere un intero");
  }
  let startDate: Date | null = null;
  if (cookStartAt !== null && cookStartAt !== undefined) {
    if (typeof cookStartAt !== "string") return err("'cookStartAt' deve essere una stringa ISO o null");
    startDate = new Date(cookStartAt);
    if (isNaN(startDate.getTime())) return err("'cookStartAt' non è una data valida");
  }

  try {
    await db.menuRecipe.update({
      where: { menuId_recipeId: { menuId, recipeId } },
      data: { cookStartAt: startDate },
    });
  } catch {
    return err("Ricetta non presente nel menù", 404);
  }

  revalidateMenus();
  return ok({ recipeId, cookStartAt: startDate ? startDate.toISOString() : null });
}
