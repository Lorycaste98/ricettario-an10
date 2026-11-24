/**
 * Informazioni mostrate sulle card e sulle righe delle liste (ricette 8.1/8.10, menù 8.5/8.11).
 * Le decide l'admin per tutti dalla pagina Impostazioni (tabella `SiteSetting`, chiave `card-info`,
 * `/api/site-settings/card-info`); il layout le legge una volta (`getCardConfig`) e le passa alle
 * card con `CardConfigProvider`. Modulo senza "use client": lo usano server, API e browser.
 * Un'informazione accesa si vede sempre, a qualunque larghezza: la riga dei dettagli va a capo e la
 * card si allunga (scelta del proprietario: più informazioni = card più alte).
 */

export type RecipeField = "category" | "time" | "servings" | "guestRating" | "reviewCount" | "myRating" | "cookCount" | "tags" | "actions";
export type MenuField = "servingTime" | "people" | "recipeCount" | "guestRating" | "photo";

export type CardConfig = { recipe: Record<RecipeField, boolean>; menu: Record<MenuField, boolean> };

export const RECIPE_FIELDS: { value: RecipeField; label: string; hint: string; adminOnly?: boolean }[] = [
  { value: "category", label: "Categoria", hint: "pallino colorato e nome" },
  { value: "time", label: "Tempo", hint: "preparazione più cottura" },
  { value: "servings", label: "Porzioni", hint: "persone o unità (teglie, pezzi…)" },
  { value: "guestRating", label: "Voto degli ospiti", hint: "la medaglia sul piatto" },
  { value: "reviewCount", label: "Numero di voti", hint: "quanti ospiti hanno votato" },
  { value: "tags", label: "Tag", hint: "i primi tag della ricetta" },
  { value: "actions", label: "Pentola e cuore", hint: "«Sto cucinando» e preferiti" },
  { value: "myRating", label: "Il mio voto", hint: "solo per chi è entrato", adminOnly: true },
  { value: "cookCount", label: "Volte cucinata", hint: "solo per chi è entrato", adminOnly: true },
];

export const MENU_FIELDS: { value: MenuField; label: string; hint: string }[] = [
  { value: "servingTime", label: "Ora del servizio", hint: "in fondo al biglietto della data" },
  { value: "guestRating", label: "Voto degli ospiti", hint: "la medaglia sulla tovaglia" },
  { value: "photo", label: "Foto di una ricetta", hint: "il piatto accanto al cartoncino" },
  { value: "people", label: "Persone", hint: "quante persone sono previste" },
  { value: "recipeCount", label: "Numero di ricette", hint: "quante ricette ha il menù" },
];

/** Come le card di oggi su un telefono: il resto si accende dalle Impostazioni */
export const DEFAULT_CARD_CONFIG: CardConfig = {
  recipe: { category: true, time: true, servings: false, guestRating: true, reviewCount: false, myRating: true, cookCount: false, tags: false, actions: true },
  menu: { servingTime: true, people: true, recipeCount: true, guestRating: true, photo: true },
};

/** Valore salvato → configurazione completa (campi mancanti o sbagliati = valore di partenza). */
export function normalizeCardConfig(raw: unknown): CardConfig {
  const src = (raw && typeof raw === "object" ? raw : {}) as { recipe?: Record<string, unknown>; menu?: Record<string, unknown> };
  const pick = <K extends string>(defaults: Record<K, boolean>, from: Record<string, unknown> | undefined) =>
    Object.fromEntries(
      (Object.keys(defaults) as K[]).map((k) => [k, typeof from?.[k] === "boolean" ? (from[k] as boolean) : defaults[k]])
    ) as Record<K, boolean>;
  return { recipe: pick(DEFAULT_CARD_CONFIG.recipe, src.recipe), menu: pick(DEFAULT_CARD_CONFIG.menu, src.menu) };
}

export const CARD_CONFIG_KEY = "card-info";
export const SITE_SETTINGS_TAG = "site-settings";
