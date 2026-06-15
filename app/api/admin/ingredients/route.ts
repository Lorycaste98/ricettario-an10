/**
 * GET /api/admin/ingredients — lista completa per la pagina di gestione ingredienti
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const masters = await db.ingredientMaster.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, excludedFromStats: true },
  });

  const usageCounts = await db.ingredient.groupBy({
    by: ["name"],
    _count: { name: true },
  });
  const countMap = new Map(usageCounts.map((r) => [r.name, r._count.name]));

  const result = masters.map((m) => ({
    ...m,
    usageCount: countMap.get(m.name) ?? 0,
  }));

  return NextResponse.json(result);
}
