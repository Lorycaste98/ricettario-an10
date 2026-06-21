/**
 * PUT    /api/tags/[id]  — rinomina tag
 * DELETE /api/tags/[id]  — elimina tag
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { revalidateRecipes } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/tags/[id]">
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { name?: string };
  if (!b.name?.trim()) return err("Il campo 'name' è obbligatorio");

  try {
    const tag = await db.tag.update({
      where: { id: Number(id) },
      data: { name: b.name.trim() },
    });
    revalidateRecipes();
    return ok(tag);
  } catch {
    return err("Tag non trovato o nome già esistente", 409);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/tags/[id]">
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;

  try {
    await db.tag.delete({ where: { id: Number(id) } });
    revalidateRecipes();
    return ok({ message: "Tag eliminato" });
  } catch {
    return err("Tag non trovato", 404);
  }
}

