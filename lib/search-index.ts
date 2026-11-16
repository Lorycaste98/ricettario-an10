/**
 * Indice della ricerca globale (overlay «Cerca», `components/search/SearchOverlay.tsx`).
 *
 * Una sola risposta compatta con ricette, menù e nomi degli ingredienti: il browser la scarica
 * alla prima apertura della ricerca e da lì cerca in locale (nessuna richiesta per lettera).
 * Gli ingredienti non hanno una lista a parte: si ricavano dalle ricette lato client.
 *
 * Visitatore: versione cachata (tag `recipes`/`menus`, invalidata dai mutate admin) con solo
 * ricette e menù pronti. Admin: fresca, con i non pronti.
 */
import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { RECIPES_TAG, MENUS_TAG } from "@/lib/queries";
import { normalizeSearchText } from "@/lib/search";
import type { SearchIndex } from "@/lib/types";

const round1 = (n: number | null | undefined) => (n == null ? null : Math.round(n * 10) / 10);

async function buildSearchIndex(isAdmin: boolean): Promise<SearchIndex> {
  const pub = isAdmin ? {} : { published: true };
  const [recipes, menus, ratings, excluded] = await Promise.all([
    db.recipe.findMany({
      where: { ...pub, quick: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        photo: true,
        prep: true,
        cook: true,
        servings: true,
        servingsUnit: true,
        published: true,
        categories: { select: { category: { select: { name: true, color: true } } } },
        tags: { select: { tag: { select: { name: true } } } },
        ingredients: { select: { name: true }, orderBy: { order: "asc" } },
        _count: { select: { steps: true } },
      },
    }),
    db.menu.findMany({
      where: pub,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        servingTime: true,
        people: true,
        photo: true,
        published: true,
        recipeReviews: { select: { rating: true } },
        recipes: {
          where: { recipe: pub },
          orderBy: { order: "asc" },
          select: { recipe: { select: { id: true, name: true, quick: true, photo: true } } },
        },
      },
    }),
    // Media delle sole recensioni ospiti (come attachRecipeRatings)
    db.review.groupBy({ by: ["recipeId"], where: { menuId: { not: null } }, _avg: { rating: true }, _count: true }),
    db.ingredientMaster.findMany({ where: { excludedFromStats: true }, select: { name: true } }),
  ]);

  const ratingById = new Map(ratings.map((r) => [r.recipeId, r]));

  return {
    recipes: recipes.map((r) => {
      const rt = ratingById.get(r.id);
      return {
        id: r.id,
        name: r.name,
        photo: r.photo,
        time: (r.prep ?? 0) + (r.cook ?? 0),
        servings: r.servings,
        servingsUnit: r.servingsUnit,
        published: r.published,
        avgRating: round1(rt?._avg.rating),
        reviews: rt?._count ?? 0,
        categories: r.categories.map((c) => c.category),
        tags: r.tags.map((t) => t.tag.name),
        ingredients: r.ingredients.map((i) => i.name.trim()).filter(Boolean),
        steps: r._count.steps,
      };
    }),
    menus: menus.map((m) => {
      const n = m.recipeReviews.length;
      return {
        id: m.id,
        name: m.name,
        description: m.description,
        date: m.date ? m.date.toISOString() : null,
        servingTime: m.servingTime,
        people: m.people,
        photo: m.photo ?? m.recipes.find((mr) => mr.recipe.photo)?.recipe.photo ?? null,
        published: m.published,
        avgRating: n ? round1(m.recipeReviews.reduce((s, r) => s + r.rating, 0) / n) : null,
        reviews: n,
        recipeIds: m.recipes.filter((mr) => !mr.recipe.quick).map((mr) => mr.recipe.id),
        quickRecipes: m.recipes.filter((mr) => mr.recipe.quick).map((mr) => mr.recipe.name),
      };
    }),
    excluded: excluded.map((e) => normalizeSearchText(e.name)),
  };
}

const getCachedPublicIndex = unstable_cache(() => buildSearchIndex(false), ["search-index-public"], {
  tags: [RECIPES_TAG, MENUS_TAG],
  revalidate: 3600,
});

export function getSearchIndex(isAdmin: boolean) {
  return isAdmin ? buildSearchIndex(true) : getCachedPublicIndex();
}
