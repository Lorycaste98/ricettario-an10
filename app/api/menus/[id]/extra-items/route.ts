/**
 * PATCH /api/menus/[id]/extra-items  — rimpiazza gli ingredienti "extra" della
 * lista spesa del menù (admin). Replace-all come i MenuRecipe nel PUT menù.
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) return err("ID non valido", 400);

  const exists = await db.menu.findUnique({ where: { id: menuId }, select: { id: true } });
  if (!exists) return err("Menu non trovato", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { items?: { name?: string; qty?: number | null; unit?: string | null }[] };

  const items = (b.items ?? [])
    .map((it) => {
      const qty = Number(it.qty);
      return {
        name: (it.name ?? "").trim(),
        qty: Number.isFinite(qty) && qty > 0 ? Math.round(qty * 100) / 100 : null,
        unit: (it.unit ?? "").trim() || null,
      };
    })
    .filter((it) => it.name.length > 0);

  await db.$transaction([
    db.menuExtraItem.deleteMany({ where: { menuId } }),
    db.menuExtraItem.createMany({
      data: items.map((it, idx) => ({ menuId, order: idx, name: it.name, qty: it.qty, unit: it.unit })),
    }),
  ]);

  const saved = await db.menuExtraItem.findMany({
    where: { menuId },
    orderBy: { order: "asc" },
    select: { id: true, name: true, qty: true, unit: true },
  });

  return ok({ ok: true, items: saved });
}
