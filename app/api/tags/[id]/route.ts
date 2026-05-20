/**
 * DELETE /api/tags/[id]  — elimina tag
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/tags/[id]">
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;

  try {
    await db.tag.delete({ where: { id: Number(id) } });
    return ok({ message: "Tag eliminato" });
  } catch {
    return err("Tag non trovato", 404);
  }
}

