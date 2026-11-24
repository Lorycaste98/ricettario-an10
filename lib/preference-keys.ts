/**
 * Chiavi delle preferenze della pagina Impostazioni (le stesse di localStorage). Modulo senza
 * "use client": lo leggono sia il browser (`lib/preferences.ts`) sia l'API `/api/preferences`,
 * che accetta solo queste chiavi.
 */
export const PREF_KEYS = [
  "ricettario:recipe-sort:sort",
  "ricettario:recipe-sort:order",
  "ricettario:menu-sort:sort",
  "ricettario:menu-sort:order",
  "ricettario:list-view:recipes:view",
  "ricettario:list-view:recipes:cols",
  "ricettario:list-view:menus:view",
  "ricettario:list-view:menus:cols",
  "ricettario:menu-costs-outputs",
  "ricettario:cooking-keep-awake",
] as const;

export type PrefKey = (typeof PREF_KEYS)[number];
