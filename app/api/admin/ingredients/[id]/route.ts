/**
 * PATCH /api/admin/ingredients/[id] — modifica nome o flag excludedFromStats
 * DELETE /api/admin/ingredients/[id] — rimuove dal catalogo (non cancella dalle ricette)
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;
  const masterId = Number(id);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }

  const b = body as { name?: string; excludedFromStats?: boolean };

  const current = await db.ingredientMaster.findUnique({
    where: { id: masterId },
    select: { name: true },
  });
  if (!current) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const updated = await db.ingredientMaster.update({
    where: { id: masterId },
    data: {
      ...(b.name !== undefined ? { name: b.name.trim() } : {}),
      ...(b.excludedFromStats !== undefined ? { excludedFromStats: b.excludedFromStats } : {}),
    },
    select: { id: true, name: true, excludedFromStats: true },
  });

  // Se rinominato, propaga il nuovo nome a tutte le ricette
  if (b.name && b.name.trim() !== current.name) {
    await db.ingredient.updateMany({
      where: { name: current.name },
      data: { name: b.name.trim() },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;
  await db.ingredientMaster.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
