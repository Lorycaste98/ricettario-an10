/**
 * PUT    /api/categories/[id]  — modifica nome e/o colore
 * DELETE /api/categories/[id]  — elimina categoria (rimuove le associazioni)
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { revalidateRecipes } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/categories/[id]">
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;
  const catId = Number(id);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { name?: string; color?: string };
  if (!b.name?.trim() && !b.color?.trim()) {
    return err("Invia almeno 'name' o 'color' da aggiornare");
  }

  try {
    const category = await db.category.update({
      where: { id: catId },
      data: {
        ...(b.name ? { name: b.name.trim() } : {}),
        ...(b.color ? { color: b.color.trim() } : {}),
      },
    });
    revalidateRecipes();
    return ok(category);
  } catch {
    return err("Categoria non trovata", 404);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/categories/[id]">
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;

  try {
    await db.category.delete({ where: { id: Number(id) } });
    revalidateRecipes();
    return ok({ message: "Categoria eliminata" });
  } catch {
    return err("Categoria non trovata", 404);
  }
}

