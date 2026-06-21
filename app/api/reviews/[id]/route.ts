/**
 * DELETE /api/reviews/[id]  — elimina recensione
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { revalidateRecipes } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/reviews/[id]">
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;

  try {
    await db.review.delete({ where: { id: Number(id) } });
    revalidateRecipes();
    return ok({ message: "Recensione eliminata" });
  } catch {
    return err("Recensione non trovata", 404);
  }
}

