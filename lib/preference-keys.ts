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
  "ricettario:list-view:menus:view",
  "ricettario:menu-costs-outputs",
  "ricettario:cooking-keep-awake",
  "ricettario:compact-detail",
] as const;

export type PrefKey = (typeof PREF_KEYS)[number];

/**
 * Preferenze che restano **sempre del dispositivo**, anche per l'admin: le card per riga dipendono
 * dalla larghezza dello schermo (2 scelte sul telefono non devono diventare 2 sul PC).
 * Non vanno all'account; «Ripristina» le azzera insieme alle altre.
 */
export const DEVICE_PREF_KEYS = ["ricettario:list-view:recipes:cols", "ricettario:list-view:menus:cols"] as const;

/** Vista compatta dei dettagli (vedi `useCompactDetail` in `lib/preferences.ts`). */
export const COMPACT_KEY = "ricettario:compact-detail";

/** Script prima del disegno (in `<head>` di `app/layout.tsx`): accende `html[data-compact]` se la scelta è salvata. */
export const COMPACT_BOOT_SCRIPT = `try{if(localStorage.getItem("${COMPACT_KEY}")==="true")document.documentElement.dataset.compact=""}catch(e){}`;
