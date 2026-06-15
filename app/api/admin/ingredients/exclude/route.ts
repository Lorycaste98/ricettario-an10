/**
 * POST /api/admin/ingredients/exclude
 * Body: { name: string }
 * Esclude un ingrediente dalle statistiche (upsert nel catalogo + flag).
 * Usato dal pulsante inline nel grafico della dashboard admin.
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }

  const { name } = body as { name?: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome richiesto" }, { status: 400 });
  }

  const result = await db.ingredientMaster.upsert({
    where: { name: name.trim() },
    create: { name: name.trim(), excludedFromStats: true },
    update: { excludedFromStats: true },
    select: { id: true, name: true, excludedFromStats: true },
  });

  return NextResponse.json(result);
}
