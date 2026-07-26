/**
 * PATCH /api/menus/[id]/costs  — salva la sezione Costi del menù (admin)
 *
 * Aggiorna in un'unica chiamata i campi manodopera/ricarico e rimpiazza le voci
 * di costo generiche (MenuCost). Dati admin-only e non cachati → nessun revalidate.
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, normalizeMoney, normalizeHours, normalizePercent } from "@/lib/api";
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

  const b = body as {
    laborHours?: number | null;
    laborRate?: number | null;
    markupPercent?: number | null;
    groceryCost?: number | null;
    lines?: { label?: string; amount?: number | null }[];
  };

  // Voci di costo generiche: tiene solo quelle con un'etichetta, ordine preservato
  const lines = (b.lines ?? [])
    .map((l) => ({ label: (l.label ?? "").trim(), amount: normalizeMoney(l.amount) ?? 0 }))
    .filter((l) => l.label.length > 0);

  // `groceryCost` è normalmente gestito dalla lista spesa; qui lo tocchiamo solo se
  // presente nel body (usato dal reset "azzera costi" per ripulire anche la spesa)
  const scalar: {
    laborHours: number | null;
    laborRate: number | null;
    markupPercent: number | null;
    groceryCost?: number | null;
  } = {
    laborHours: normalizeHours(b.laborHours),
    laborRate: normalizeMoney(b.laborRate),
    markupPercent: normalizePercent(b.markupPercent),
  };
  if ("groceryCost" in b) scalar.groceryCost = normalizeMoney(b.groceryCost);

  await db.$transaction([
    db.menu.update({
      where: { id: menuId },
      data: scalar,
    }),
    db.menuCost.deleteMany({ where: { menuId } }),
    db.menuCost.createMany({
      data: lines.map((l, idx) => ({ menuId, order: idx, label: l.label, amount: l.amount })),
    }),
  ]);

  const saved = await db.menuCost.findMany({
    where: { menuId },
    orderBy: { order: "asc" },
    select: { id: true, label: true, amount: true },
  });

  return ok({ ok: true, costs: saved });
}
