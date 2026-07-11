/**
 * POST /api/recensisci/[token]  — invia i voti (1-10) alle ricette di un menù
 * Nessun login richiesto: l'accesso è protetto dal token segreto del menù
 * (vedi Menu.reviewToken, condiviso dall'admin via link/QR).
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { revalidateRecipes } from "@/lib/queries";

interface RatingInput {
  recipeId?: number;
  rating?: number;
  comment?: string;
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/recensisci/[token]">
) {
  const { token } = await ctx.params;

  const menu = await db.menu.findUnique({
    where: { reviewToken: token },
    select: { id: true, recipes: { select: { recipeId: true } } },
  });
  if (!menu) return err("Link non valido", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { nickname?: string; ratings?: RatingInput[] };
  if (!b.ratings?.length) return err("Vota almeno una ricetta");

  const validRecipeIds = new Set(menu.recipes.map((r) => r.recipeId));

  const toCreate = b.ratings.filter(
    (r): r is Required<RatingInput> =>
      typeof r.recipeId === "number" &&
      validRecipeIds.has(r.recipeId) &&
      typeof r.rating === "number" &&
      r.rating >= 1 &&
      r.rating <= 10
  );
  if (toCreate.length === 0) return err("Nessun voto valido inviato");

  // Nickname vuoto = anonimo: "Ospite N" con N assegnato atomicamente per menù,
  // così due anonimi sullo stesso link non finiscono con lo stesso nome.
  let nickname = b.nickname?.trim();
  if (!nickname) {
    const updated = await db.menu.update({
      where: { id: menu.id },
      data: { anonymousReviewCount: { increment: 1 } },
      select: { anonymousReviewCount: true },
    });
    nickname = `Ospite ${updated.anonymousReviewCount}`;
  }

  await db.review.createMany({
    data: toCreate.map((r) => ({
      recipeId: r.recipeId,
      menuId: menu.id,
      nickname,
      rating: Math.round(r.rating),
      comment: r.comment?.trim() || null,
    })),
  });

  revalidateRecipes();
  return ok({ created: toCreate.length, nickname }, 201);
}
