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
    // Solo recensioni ospiti (dai link menù): il voto personale dell'admin vive in RecipeRating
    where: { recipeId: { in: rows.map((r) => r.id) }, menuId: { not: null } },
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
      // Voto personale: attaccato solo per l'admin loggato in queryRecipeSummaries; default null
      myRating: null as number | null,
    };
  });
}

// ---------------------------------------------------------------------------
// Ricette — riepiloghi
// ---------------------------------------------------------------------------
async function queryRecipeSummaries(
  where: Record<string, unknown> | undefined,
  adminId: number | null = null
) {
  const rows = await db.recipe.findMany({
    where,
    select: recipeSummarySelect,
    orderBy: { createdAt: "desc" },
  });
  const summaries = await attachRecipeRatings(rows);
  if (adminId == null) return summaries;

  // Voto personale dell'admin loggato (uno per ricetta): attacca `myRating`
  const mine = await db.recipeRating.findMany({
    where: { adminId, recipeId: { in: rows.map((r) => r.id) } },
    select: { recipeId: true, rating: true },
  });
  const myById = new Map(mine.map((m) => [m.recipeId, m.rating]));
  return summaries.map((s) => ({ ...s, myRating: myById.get(s.id) ?? null }));
}

const getCachedRecipeSummaries = unstable_cache(
  () => queryRecipeSummaries({ published: true, quick: false }),
  ["published-recipe-summaries"],
  { tags: [RECIPES_TAG], revalidate: REVALIDATE_SECONDS }
);

/**
 * Lista completa per /ricette e /preferiti. Admin: fresca, con le non pronte (mai le "veloci")
 * e con il proprio voto personale (`myRating`). Visitatore (`adminId` null): cache condivisa.
 */
export function getRecipeSummaries(adminId: number | null) {
  return adminId != null
    ? queryRecipeSummaries({ quick: false }, adminId)
    : getCachedRecipeSummaries();
}

/** Ultime 4 ricette pubblicate per la home (sempre visitatore). */
export const getHomeRecipes = unstable_cache(
  async () => {
    const rows = await db.recipe.findMany({
      where: { published: true, quick: false },
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
  people: number | null;
  photo: string | null;
  published: boolean;
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
    people: m.people,
    photo: m.photo,
    published: m.published,
    createdAt: m.createdAt.toISOString(),
    _count: { reviews: m._count.recipeReviews, recipes: m._count.recipes },
    avgRating,
    previewPhotos,
  };
}

async function queryMenuSummaries(take?: number, isAdmin = false) {
  const menus = await db.menu.findMany({
    // I menù "non pronti" restano nascosti ai visitatori (come le ricette)
    where: isAdmin ? undefined : { published: true },
    orderBy: { createdAt: "desc" },
    ...(take ? { take } : {}),
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      servingTime: true,
      people: true,
      photo: true,
      published: true,
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

const getCachedMenuSummaries = unstable_cache(
  () => queryMenuSummaries(),
  ["menu-summaries"],
  { tags: [MENUS_TAG], revalidate: REVALIDATE_SECONDS }
);

/** Lista completa menù per /menu. Admin: fresca e con i "non pronti". */
export function getMenuSummaries(isAdmin: boolean) {
  return isAdmin ? queryMenuSummaries(undefined, true) : getCachedMenuSummaries();
}

/** Ultimi 4 menù pubblicati per la home (sempre visitatore). */
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
      people: true,
      photo: true,
      published: true,
      createdAt: true,
      updatedAt: true,
      reviewToken: true,
      // Sezione Costi + nota + extra lista spesa: solo admin (come gli ingredienti sotto)
      ...(isAdmin
        ? {
            notes: true,
            groceryCost: true,
            laborHours: true,
            laborRate: true,
            markupPercent: true,
            costs: { select: { id: true, label: true, amount: true }, orderBy: { order: "asc" as const } },
            extraItems: { select: { id: true, name: true, qty: true, unit: true }, orderBy: { order: "asc" as const } },
          }
        : {}),
      // Recensioni ricetta arrivate tramite il link di questo menù (vedi /recensisci/[token])
      recipeReviews: {
        select: {
          id: true, nickname: true, rating: true, comment: true, createdAt: true,
          recipe: { select: { id: true, name: true, quick: true } },
        },
        orderBy: { createdAt: "desc" as const },
      },
      recipes: {
        // Le ricette "non pronte" restano nascoste ai visitatori anche nel menù
        where: isAdmin ? {} : { recipe: { published: true } },
        select: {
          order: true,
          // Porzioni override del menù (per scalare gli ingredienti nella lista spesa)
          servings: true,
          recipe: {
            select: {
              ...recipeSummarySelect,
              steps: { select: { mins: true } },
              // Ingredienti: servono solo per la lista della spesa (solo admin, vedi sotto)
              ...(isAdmin
                ? { ingredients: { select: { name: true, qty: true, unit: true, optional: true }, orderBy: { order: "asc" as const } } }
                : {}),
            },
          },
        },
        orderBy: { order: "asc" as const },
      },
    },
  });
  if (!menu) return null;
  // Menù "non pronto": invisibile ai visitatori (→ notFound), visibile all'admin
  if (!isAdmin && !menu.published) return null;

  const avgRating =
    menu.recipeReviews.length > 0
      ? Math.round(
          (menu.recipeReviews.reduce((s, r) => s + r.rating, 0) / menu.recipeReviews.length) * 10
        ) / 10
      : null;

  const rated = await attachRecipeRatings(menu.recipes.map((mr) => mr.recipe));
  // `servings` = porzioni scelte per il menù (override); `recipe.servings` = default della ricetta
  const recipes = menu.recipes.map((mr, i) => ({ order: mr.order, servings: mr.servings, recipe: rated[i] }));

  // Lista della spesa: solo per l'admin (vedi select condizionale sopra).
  // Le quantità sono scalate se il menù imposta porzioni diverse dal default della ricetta.
  const shoppingList: ShoppingListItem[] | null = isAdmin
    ? buildShoppingList(
        recipes.map(({ servings, recipe }) => {
          const ings =
            (recipe as unknown as { ingredients?: { name: string; qty: number | null; unit: string | null; optional: boolean }[] }).ingredients ?? [];
          const base = (recipe as unknown as { servings: number | null }).servings;
          const factor = servings && base && base > 0 ? servings / base : 1;
          return {
            name: recipe.name as string,
            ingredients:
              factor === 1
                ? ings
                : ings.map((i) => ({ ...i, qty: i.qty != null ? Math.round(i.qty * factor * 100) / 100 : null })),
          };
        })
      )
    : null;

  // Campi admin-only (Costi + nota + extra lista spesa): presenti nel select solo se isAdmin
  const admin = menu as unknown as {
    notes: string | null;
    groceryCost: number | null;
    laborHours: number | null;
    laborRate: number | null;
    markupPercent: number | null;
    costs: { id: number; label: string; amount: number }[];
    extraItems: { id: number; name: string; qty: number | null; unit: string | null }[];
  };

  return {
    id: menu.id,
    name: menu.name,
    description: menu.description,
    date: menu.date ? menu.date.toISOString() : null,
    servingTime: menu.servingTime,
    people: menu.people,
    photo: menu.photo,
    published: menu.published,
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
    reviewToken: menu.reviewToken,
    avgRating,
    _count: { reviews: menu.recipeReviews.length, recipes: menu.recipes.length },
    recipes,
    shoppingList,
    // Solo admin (altrimenti i campi non sono nel select)
    notes: isAdmin ? admin.notes : null,
    groceryCost: isAdmin ? admin.groceryCost : null,
    laborHours: isAdmin ? admin.laborHours : null,
    laborRate: isAdmin ? admin.laborRate : null,
    markupPercent: isAdmin ? admin.markupPercent : null,
    costs: isAdmin ? admin.costs : [],
    extraItems: isAdmin ? admin.extraItems : [],
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
