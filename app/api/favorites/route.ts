/**
 * GET /api/favorites — ricette preferite dell'admin loggato (RecipeFavorite).
 *
 * Solo admin: i visitatori anonimi tengono i preferiti in localStorage
 * (lib/favorites.ts). Al login i preferiti locali vengono **ignorati**: conta
 * solo la lista dell'account.
 */

import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return err("Non autorizzato", 401);

  const rows = await db.recipeFavorite.findMany({
    where: { adminId: session.adminId },
    select: { recipeId: true },
    orderBy: { createdAt: "desc" },
  });

  return ok({ ids: rows.map((r) => r.recipeId) });
}
