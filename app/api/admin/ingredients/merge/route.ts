/**
 * POST /api/admin/ingredients/merge
 * Body: { canonical: string; toMerge: number[] }
 * Unifica N ingredienti nel nome canonico: aggiorna tutte le ricette e il catalogo.
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

  const b = body as { canonical?: string; toMerge?: number[] };

  if (!b.canonical?.trim()) {
    return NextResponse.json({ error: "Il nome canonico è obbligatorio" }, { status: 400 });
  }
  if (!b.toMerge?.length) {
    return NextResponse.json({ error: "Seleziona almeno un ingrediente da unificare" }, { status: 400 });
  }

  const canonical = b.canonical.trim();

  // Recupera i nomi degli ingredienti da unificare
  const toMergeRecords = await db.ingredientMaster.findMany({
    where: { id: { in: b.toMerge } },
    select: { id: true, name: true },
  });

  const namesToMerge = toMergeRecords.map((r) => r.name);
  const idsToDelete = toMergeRecords
    .filter((r) => r.name !== canonical)
    .map((r) => r.id);

  await db.$transaction(async (tx) => {
    // Assicura che il nome canonico esista nel catalogo
    await tx.ingredientMaster.upsert({
      where: { name: canonical },
      create: { name: canonical },
      update: {},
    });

    // Aggiorna tutti gli ingredienti nelle ricette
    await tx.ingredient.updateMany({
      where: { name: { in: namesToMerge } },
      data: { name: canonical },
    });

    // Elimina le voci duplicate dal catalogo (tranne il canonico)
    if (idsToDelete.length > 0) {
      await tx.ingredientMaster.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }
  });

  return NextResponse.json({ ok: true, canonical, merged: namesToMerge.length });
}
