"use client";
import { clearLocalStore, useLocalStore } from "@/lib/local-store";

/**
 * Preferenze del dispositivo, in un posto solo: le usano le liste (Ricette, Preferiti, Menù), il
 * pannello «Sto cucinando», i costi del menù, la ricerca e la pagina **Impostazioni** (`/impostazioni`).
 * Tutte in `localStorage`: valgono su questo dispositivo, per chi è entrato e per chi no.
 * Salvarle nell'account vorrà dire cambiare solo dove si leggono e scrivono, qui.
 */

// ── Ordinamento delle ricette ───────────────────────────────────────────────

export type RecipeSortKey = "myRating" | "createdAt" | "name" | "prep" | "cook" | "cookCount" | "avgRating" | "reviews";

/** «Il mio voto» è solo per l'admin (voto personale): ai visitatori non si mostra */
export const RECIPE_SORT_OPTIONS: { value: RecipeSortKey; label: string; adminOnly?: boolean }[] = [
  { value: "myRating", label: "Il mio voto", adminOnly: true },
  { value: "avgRating", label: "Valutazione" },
  { value: "reviews", label: "Recensioni" },
  { value: "createdAt", label: "Data" },
  { value: "name", label: "Nome" },
  { value: "prep", label: "Tempo prep" },
  { value: "cook", label: "Cottura" },
  { value: "cookCount", label: "Volte cotta" },
];

const RECIPE_SORT = "ricettario:recipe-sort:sort";
const RECIPE_ORDER = "ricettario:recipe-sort:order";
const RECIPE_SORT_KEYS = RECIPE_SORT_OPTIONS.map((o) => o.value);
// Si salva solo la scelta ESPLICITA (null = nessuna): il default dipende da chi guarda e lo
// decide `recipeSortFor` (admin → «Il mio voto», visitatore → «Valutazione»)
const parseRecipeSort = (raw: string): RecipeSortKey | null => {
  const v = JSON.parse(raw);
  return RECIPE_SORT_KEYS.includes(v) ? v : null;
};
const parseDesc = (raw: string): "asc" | "desc" => (JSON.parse(raw) === "asc" ? "asc" : "desc");

export function useRecipeSort() {
  const [pref, setPref] = useLocalStore<RecipeSortKey | null>(RECIPE_SORT, null, parseRecipeSort);
  const [order, setOrder] = useLocalStore<"asc" | "desc">(RECIPE_ORDER, "desc", parseDesc);
  return { pref, setPref, order, setOrder };
}

/** Ordinamento in vigore: «Il mio voto» rimasto sul dispositivo vale solo da admin */
export function recipeSortFor(pref: RecipeSortKey | null, isAdmin: boolean): RecipeSortKey {
  const fallback: RecipeSortKey = isAdmin ? "myRating" : "avgRating";
  return pref && (isAdmin || pref !== "myRating") ? pref : fallback;
}

// ── Ordinamento dei menù ────────────────────────────────────────────────────

export type MenuSortKey = "date" | "createdAt" | "name";

export const MENU_SORT_OPTIONS: { value: MenuSortKey; label: string }[] = [
  { value: "date", label: "Data servizio" },
  { value: "createdAt", label: "Data creazione" },
  { value: "name", label: "Nome" },
];

const MENU_SORT = "ricettario:menu-sort:sort";
const MENU_ORDER = "ricettario:menu-sort:order";
const parseMenuSort = (raw: string): MenuSortKey => {
  const v = JSON.parse(raw);
  return v === "name" || v === "createdAt" ? v : "date";
};
// Default: dalla più vecchia alla più recente (crescente)
const parseAsc = (raw: string): "asc" | "desc" => (JSON.parse(raw) === "desc" ? "desc" : "asc");

export function useMenuSort() {
  const [sort, setSort] = useLocalStore<MenuSortKey>(MENU_SORT, "date", parseMenuSort);
  const [order, setOrder] = useLocalStore<"asc" | "desc">(MENU_ORDER, "asc", parseAsc);
  return { sort, setSort, order, setOrder };
}

// ── Vista delle liste (griglia/lista, card per riga) ────────────────────────

export type ViewMode = "grid" | "list";
export type ListKind = "recipes" | "menus";
export const MAX_COLS = 8;

/**
 * Misure delle card per lista: `minCardRem` = larghezza minima a mano (decide il massimo per riga),
 * `autoCard` = card della griglia automatica [min rem, quota del contenitore, max rem].
 * Ricette e preferiti condividono «recipes».
 */
export const LIST_LAYOUT: Record<ListKind, { minCardRem: number; autoCard: [number, number, number]; fallbackCols: string }> = {
  recipes: { minCardRem: 6.5, autoCard: [9.5, 0.24, 13], fallbackCols: "grid-cols-[repeat(auto-fill,minmax(clamp(9.5rem,24cqi,13rem),1fr))]" },
  menus: { minCardRem: 9, autoCard: [10, 0.3, 16], fallbackCols: "grid-cols-[repeat(auto-fill,minmax(clamp(10rem,30cqi,16rem),1fr))]" },
};

const viewKey = (list: ListKind) => `ricettario:list-view:${list}:view`;
const colsKey = (list: ListKind) => `ricettario:list-view:${list}:cols`;
const parseView = (raw: string): ViewMode => (JSON.parse(raw) === "list" ? "list" : "grid");
const parseCols = (raw: string): number => {
  const v = JSON.parse(raw);
  return Number.isInteger(v) && v >= 0 && v <= MAX_COLS ? v : 0;
};

/** `cols` 0 = automatico */
export function useListView(list: ListKind) {
  const [view, setView] = useLocalStore<ViewMode>(viewKey(list), "grid", parseView);
  const [cols, setCols] = useLocalStore<number>(colsKey(list), 0, parseCols);
  return { view, setView, cols, setCols };
}

// ── Costi del menù (solo admin) ─────────────────────────────────────────────

export type CostOutputKey = "markup" | "perPerson" | "margin";
export const COST_OUTPUTS: { value: CostOutputKey; label: string; hint: string }[] = [
  { value: "markup", label: "Prezzo", hint: "prezzo con il ricarico" },
  { value: "perPerson", label: "A persona", hint: "prezzo diviso per le persone" },
  { value: "margin", label: "Margine", hint: "guadagno in euro e in percentuale" },
];
const COST_OUTPUTS_KEY = "ricettario:menu-costs-outputs";
const DEFAULT_COST_OUTPUTS: CostOutputKey[] = ["markup", "perPerson", "margin"];
const parseCostOutputs = (raw: string): CostOutputKey[] => {
  const p: unknown = JSON.parse(raw);
  if (!Array.isArray(p)) return DEFAULT_COST_OUTPUTS;
  return p.filter((x): x is CostOutputKey => x === "markup" || x === "perPerson" || x === "margin");
};

export function useCostOutputs() {
  const [outputs, setOutputs] = useLocalStore<CostOutputKey[]>(COST_OUTPUTS_KEY, DEFAULT_COST_OUTPUTS, parseCostOutputs);
  const toggle = (k: CostOutputKey) => setOutputs(outputs.includes(k) ? outputs.filter((o) => o !== k) : [...outputs, k]);
  return { outputs, toggle };
}

// ── Ricerche recenti ────────────────────────────────────────────────────────

export const SEARCH_RECENT_KEY = "ricettario:search-recent";

export function clearRecentSearches() {
  clearLocalStore(SEARCH_RECENT_KEY);
}

// ── Schermo acceso durante i timer ──────────────────────────────────────────

export const KEEP_AWAKE_KEY = "ricettario:cooking-keep-awake";

// ── Ripristino ──────────────────────────────────────────────────────────────

/**
 * «Ripristina le impostazioni»: torna ai valori di partenza **solo** le scelte di questa pagina.
 * Non tocca i dati (preferiti, lista della spesa, avanzamento dei passi, «Sto cucinando»).
 */
export function resetPreferences() {
  for (const key of [
    RECIPE_SORT,
    RECIPE_ORDER,
    MENU_SORT,
    MENU_ORDER,
    viewKey("recipes"),
    colsKey("recipes"),
    viewKey("menus"),
    colsKey("menus"),
    COST_OUTPUTS_KEY,
    KEEP_AWAKE_KEY,
  ]) {
    clearLocalStore(key);
  }
}
