/**
 * GET /api/search?q=...
 *
 * Ricerca full-text nelle ricette: cerca su nome, note, nomi ingredienti e testo dei passi.
 * Ritorna i risultati ordinati per rilevanza (più match = prima).
 *
 * Query params:
 *   q      — termine di ricerca (obbligatorio, min 2 char)
 *   limit  — numero di risultati (default 10, max 50)
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { recipeSummarySelect, ok, err } from "@/lib/api";
import { attachRecipeRatings } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 10)));

  if (!q || q.length < 2) return err("Il parametro 'q' deve avere almeno 2 caratteri");

  // Gli admin cercano anche tra le ricette non pronte; i visitatori solo tra le pubblicate
  const isAdmin = !!(await getSession());

  // Ricerca per nome + note + ingredienti + passi
  const recipes = await db.recipe.findMany({
    where: {
      ...(isAdmin ? {} : { published: true }),
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { ingredients: { some: { name: { contains: q, mode: "insensitive" } } } },
        { steps: { some: { text: { contains: q, mode: "insensitive" } } } },
      ],
    },
    select: recipeSummarySelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return ok({ data: await attachRecipeRatings(recipes), total: recipes.length });
}

