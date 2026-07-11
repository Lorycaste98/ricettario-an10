/**
 * Query di lettura per le pagine pubbliche + cache a tag.
 *
 * - `attachRecipeRatings`: calcola la media voti con UN'unica groupBy lato DB,
 *   invece di trascinare ogni riga `Review` per ogni ricetta (vedi recipeSummarySelect).
 * - Le `getCached*` sono wrappate in `unstable_cache`: la query Supabase viene
 *   servita dalla cache (TTFB più basso, niente round-trip a ogni visita) finché
 *   un mutate admin non chiama `revalidateRecipes()` / `revalidateMenus()`.
 *
 * Gli admin NON usano la cache: vedono dati freschi (incluse le ricette non pronte).
 */

import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { recipeSummarySelect, flattenRecipe } from "@/lib/api";
import { buildShoppingList, type ShoppingListItem } from "@/lib/shopping-list";

// ---------------------------------------------------------------------------
// Tag di cache + invalidazione
// ---------------------------------------------------------------------------
export const RECIPES_TAG = "recipes";
export const MENUS_TAG = "menus";

// `"max"` = stale-while-revalidate: la prossima visita serve il dato stale e
// rinfresca in background (TTFB basso). Gli admin non leggono dalla cache, quindi
// vedono comunque i dati freschi subito.
/** Invalida le liste/dettagli ricetta (e i menù, che incorporano ricette). */
export function revalidateRecipes() {
  revalidateTag(RECIPES_TAG, "max");
  revalidateTag(MENUS_TAG, "max");
}

/** Invalida solo i menù (liste + dettagli). */
export function revalidateMenus() {
  revalidateTag(MENUS_TAG, "max");
}

// Fallback temporale: rete di sicurezza se un invalidation per-tag venisse mancato.
const REVALIDATE_SECONDS = 3600;

// ---------------------------------------------------------------------------
// Media voti (#2) — una groupBy invece di N righe Review
// ---------------------------------------------------------------------------
export async function attachRecipeRatings<T extends { id: number }>(rows: T[]) {
  if (rows.length === 0) return [];
  const grouped = await db.review.groupBy({
    by: ["recipeId"],
    where: { recipeId: { in: rows.map((r) => r.id) } },
    _avg: { rating: true },
  });
  const avgById = new Map<number, number | null>(
    grouped.map((g) => [g.recipeId, g._avg.rating])
  );
  return rows.map((row) => {
    const flat = flattenRecipe(row);
    const avg = avgById.get(row.id);
    return {
      ...flat,
      // ISO string: coerente col tipo RecipeSummary e serializzabile in cache
      createdAt:
        flat.createdAt instanceof Date ? flat.createdAt.toISOString() : flat.createdAt,
      avgRating: avg != null ? Math.round(avg * 10) / 10 : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Ricette — riepiloghi
// ---------------------------------------------------------------------------
async function queryRecipeSummaries(where: Record<string, unknown> | undefined) {
  const rows = await db.recipe.findMany({
    where,
    select: recipeSummarySelect,
    orderBy: { createdAt: "desc" },
  });
  return attachRecipeRatings(rows);
}

const getCachedRecipeSummaries = unstable_cache(
  () => queryRecipeSummaries({ published: true }),
  ["published-recipe-summaries"],
  { tags: [RECIPES_TAG], revalidate: REVALIDATE_SECONDS }
);

/** Lista completa per /ricette e /preferiti. Admin: fresca e con le non pronte. */
export function getRecipeSummaries(isAdmin: boolean) {
  return isAdmin ? queryRecipeSummaries(undefined) : getCachedRecipeSummaries();
}

/** Ultime 4 ricette pubblicate per la home (sempre visitatore). */
export const getHomeRecipes = unstable_cache(
  async () => {
    const rows = await db.recipe.findMany({
      where: { published: true },
      select: recipeSummarySelect,
      orderBy: { createdAt: "desc" },
      take: 4,
    });
    return attachRecipeRatings(rows);
  },
  ["home-recipes"],
  { tags: [RECIPES_TAG], revalidate: REVALIDATE_SECONDS }
);

// ---------------------------------------------------------------------------
// Menù — riepiloghi (liste)
// ---------------------------------------------------------------------------
function processMenuRow(m: {
  id: number;
  name: string;
  description: string | null;
  date: Date | null;
  servingTime: string | null;
  photo: string | null;
  createdAt: Date;
  _count: { recipeReviews: number; recipes: number };
  recipeReviews: { rating: number }[];
  recipes: { order: number; recipe: { photo: string | null } }[];
}) {
  // Media/conteggio: aggregato delle recensioni ricetta arrivate tramite il link di questo menù
  // (le vecchie MenuReview, voto al menù intero, sono dismesse — non se ne creano più)
  const avgRating =
    m.recipeReviews.length > 0
      ? Math.round(
          (m.recipeReviews.reduce((s, r) => s + r.rating, 0) / m.recipeReviews.length) * 10
        ) / 10
      : null;
  const previewPhotos = m.recipes
    .map((mr) => mr.recipe.photo)
    .filter((p): p is string => p !== null);
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    date: m.date ? m.date.toISOString() : null,
    servingTime: m.servingTime,
    photo: m.photo,
    createdAt: m.createdAt.toISOString(),
    _count: { reviews: m._count.recipeReviews, recipes: m._count.recipes },
    avgRating,
    previewPhotos,
  };
}

async function queryMenuSummaries(take?: number) {
  const menus = await db.menu.findMany({
    orderBy: { createdAt: "desc" },
    ...(take ? { take } : {}),
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      servingTime: true,
      photo: true,
      createdAt: true,
      _count: { select: { recipeReviews: true, recipes: true } },
      recipeReviews: { select: { rating: true } },
      recipes: {
        // Anteprime: solo foto di ricette pubblicate (niente leak delle non pronte)
        where: { recipe: { published: true } },
        select: { order: true, recipe: { select: { photo: true } } },
        orderBy: { order: "asc" as const },
        take: 4,
      },
    },
  });
  return menus.map(processMenuRow);
}

/** Lista completa menù per /menu. */
export const getMenuSummaries = unstable_cache(
  () => queryMenuSummaries(),
  ["menu-summaries"],
  { tags: [MENUS_TAG], revalidate: REVALIDATE_SECONDS }
);

/** Ultimi 4 menù per la home. */
export const getHomeMenus = unstable_cache(
  () => queryMenuSummaries(4),
  ["home-menus"],
  { tags: [MENUS_TAG], revalidate: REVALIDATE_SECONDS }
);

// ---------------------------------------------------------------------------
// Menù — dettaglio
// ---------------------------------------------------------------------------
async function queryMenuDetail(id: number, isAdmin: boolean) {
  const menu = await db.menu.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      servingTime: true,
      photo: true,
      createdAt: true,
      updatedAt: true,
      reviewToken: true,
      // Recensioni ricetta arrivate tramite il link di questo menù (vedi /recensisci/[token])
      recipeReviews: {
        select: {
          id: true, nickname: true, rating: true, comment: true, createdAt: true,
          recipe: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" as const },
      },
      recipes: {
        // Le ricette "non pronte" restano nascoste ai visitatori anche nel menù
        where: isAdmin ? {} : { recipe: { published: true } },
        select: {
          order: true,
          recipe: {
            select: {
              ...recipeSummarySelect,
              steps: { select: { mins: true } },
              // Ingredienti: servono solo per la lista della spesa (solo admin, vedi sotto)
              ...(isAdmin
                ? { ingredients: { select: { name: true, qty: true, unit: true }, orderBy: { order: "asc" as const } } }
                : {}),
            },
          },
        },
        orderBy: { order: "asc" as const },
      },
    },
  });
  if (!menu) return null;

  const avgRating =
    menu.recipeReviews.length > 0
      ? Math.round(
          (menu.recipeReviews.reduce((s, r) => s + r.rating, 0) / menu.recipeReviews.length) * 10
        ) / 10
      : null;

  const rated = await attachRecipeRatings(menu.recipes.map((mr) => mr.recipe));
  const recipes = menu.recipes.map((mr, i) => ({ order: mr.order, recipe: rated[i] }));

  // Lista della spesa: solo per l'admin (vedi select condizionale sopra)
  const shoppingList: ShoppingListItem[] | null = isAdmin
    ? buildShoppingList(
        recipes.map(({ recipe }) => ({
          name: recipe.name as string,
          ingredients: (recipe as unknown as { ingredients?: { name: string; qty: number | null; unit: string | null }[] }).ingredients ?? [],
        }))
      )
    : null;

  return {
    id: menu.id,
    name: menu.name,
    description: menu.description,
    date: menu.date ? menu.date.toISOString() : null,
    servingTime: menu.servingTime,
    photo: menu.photo,
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
    reviewToken: menu.reviewToken,
    avgRating,
    _count: { reviews: menu.recipeReviews.length, recipes: menu.recipes.length },
    recipes,
    shoppingList,
    recipeReviews: menu.recipeReviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  };
}

/** Dettaglio menù. Visitatore: cache per-id + filtro published. Admin: fresco. */
export function getMenuDetail(id: number, isAdmin: boolean) {
  if (isAdmin) return queryMenuDetail(id, true);
  return unstable_cache(
    () => queryMenuDetail(id, false),
    ["menu-detail", String(id)],
    { tags: [MENUS_TAG], revalidate: REVALIDATE_SECONDS }
  )();
}
