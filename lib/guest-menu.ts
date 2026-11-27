import "server-only";
import { db } from "@/lib/db";
import { defaultGuestCard, guestSheet, normalizeGuestCard, suggestTheme, type GuestCard, type GuestRecipe, type GuestSheet } from "@/lib/menu-guest-card";

/**
 * Menù «per gli ospiti» letto dal database: ricette del menù (per la finestra e per i nomi), tema
 * proposto e foglio salvato (`MenuGuestCard`) o, se non c'è o la tabella manca, la proposta.
 * Usato dall'API `/api/menus/[id]/guest-card` e dalla pagina pubblica `/ospiti/[token]`.
 */
export async function guestMenuData(where: { id: number } | { reviewToken: string }) {
  const menu = await db.menu.findUnique({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      servingTime: true,
      photo: true,
      reviewToken: true,
      recipes: {
        orderBy: { order: "asc" },
        select: {
          recipe: {
            select: { id: true, name: true, quick: true, categories: { select: { category: { select: { name: true } } } } },
          },
        },
      },
    },
  });
  if (!menu) return null;
  const recipes: GuestRecipe[] = menu.recipes.map(({ recipe }) => ({
    id: recipe.id,
    name: recipe.name,
    quick: recipe.quick,
    categories: recipe.categories.map((c) => c.category.name),
  }));
  return { menu, recipes, theme: suggestTheme(menu.name, menu.date) };
}

/** Foglio salvato (normalizzato) o null; `canSave` falso se la tabella non si legge */
export async function storedGuestCard(menuId: number, recipes: GuestRecipe[], theme: GuestCard["theme"]) {
  try {
    const stored = (await db.menuGuestCard.findUnique({ where: { menuId }, select: { data: true } }))?.data ?? null;
    return { card: normalizeGuestCard(stored, new Set(recipes.map((r) => r.id)), theme), canSave: true };
  } catch (e) {
    console.error("MenuGuestCard non leggibile (migrazione applicata?)", e);
    return { card: null, canSave: false };
  }
}

/** Pagina pubblica: menù e foglio pronto, dato il token del link */
export async function guestMenuByToken(token: string): Promise<{
  menu: { name: string; description: string | null; date: string | null; servingTime: string | null; photo: string | null };
  sheet: GuestSheet;
  reviewToken: string;
} | null> {
  const data = await guestMenuData({ reviewToken: token });
  if (!data) return null;
  const { menu, recipes, theme } = data;
  const { card } = await storedGuestCard(menu.id, recipes, theme);
  return {
    menu: {
      name: menu.name,
      description: menu.description,
      date: menu.date ? menu.date.toISOString() : null,
      servingTime: menu.servingTime,
      photo: menu.photo,
    },
    sheet: guestSheet(card ?? defaultGuestCard(recipes, theme), recipes),
    reviewToken: menu.reviewToken,
  };
}
