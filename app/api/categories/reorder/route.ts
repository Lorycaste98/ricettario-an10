/**
 * PUT /api/categories/reorder — aggiorna sortOrder di tutte le categorie
 * Body: { ids: number[] } — array di id nell'ordine desiderato
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

export async function PUT(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const { ids } = body as { ids?: number[] };
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "number")) {
    return err("'ids' deve essere un array di numeri");
  }

  await Promise.all(
    ids.map((id, i) =>
      db.category.update({ where: { id }, data: { sortOrder: i } })
    )
  );

  return ok({ ok: true });
}
