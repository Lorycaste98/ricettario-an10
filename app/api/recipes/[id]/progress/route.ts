/**
 * GET /api/recipes/[id]/progress — avanzamento passi dell'admin loggato
 * PUT /api/recipes/[id]/progress — salva l'avanzamento (upsert; array vuoto = cancella)
 *
 * Solo admin: gli ospiti anonimi usano localStorage (lib/recipe-progress.ts).
 * Il progresso è per indice di step (gli id sono instabili: il PUT ricetta
 * cancella e ricrea gli step) con `stepsCount` come guardia anti-stale.
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { getSession } from "@/lib/session";

const MAX_STEPS = 500;

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]/progress">
) {
  const session = await getSession();
  if (!session) return err("Non autorizzato", 401);

  const { id } = await ctx.params;
  const recipeId = Number(id);

  const progress = await db.recipeProgress.findUnique({
    where: { adminId_recipeId: { adminId: session.adminId, recipeId } },
    select: { doneSteps: true, stepsCount: true },
  });

  return ok(progress ?? { doneSteps: [], stepsCount: 0 });
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]/progress">
) {
  const session = await getSession();
  if (!session) return err("Non autorizzato", 401);

  const { id } = await ctx.params;
  const recipeId = Number(id);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const { doneSteps, stepsCount } = body as { doneSteps?: unknown; stepsCount?: unknown };
  if (
    !Array.isArray(doneSteps) ||
    doneSteps.length > MAX_STEPS ||
    !doneSteps.every((n) => Number.isInteger(n) && n >= 0 && n < MAX_STEPS) ||
    !Number.isInteger(stepsCount) ||
    (stepsCount as number) < 0 ||
    (stepsCount as number) > MAX_STEPS
  ) {
    return err("Payload non valido: attesi doneSteps (int[] ≥ 0) e stepsCount (int ≥ 0)");
  }

  const key = { adminId_recipeId: { adminId: session.adminId, recipeId } };

  if (doneSteps.length === 0) {
    // Niente da ricordare: pulizia della riga se esiste
    await db.recipeProgress.deleteMany({ where: { adminId: session.adminId, recipeId } });
    return ok({ saved: true });
  }

  const exists = await db.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
  if (!exists) return err("Ricetta non trovata", 404);

  await db.recipeProgress.upsert({
    where: key,
    create: { adminId: session.adminId, recipeId, doneSteps, stepsCount: stepsCount as number },
    update: { doneSteps, stepsCount: stepsCount as number },
  });

  return ok({ saved: true });
}
