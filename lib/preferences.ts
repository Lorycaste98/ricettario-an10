"use client";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { clearLocalStore, localStoreEvent, setLocalStoreRaw, useLocalStore } from "@/lib/local-store";
import { DEVICE_PREF_KEYS, PREF_KEYS } from "@/lib/preference-keys";

/**
 * Preferenze della pagina **Impostazioni** in un posto solo: le usano le liste (Ricette, Preferiti,
 * Menù), il pannello «Sto cucinando», i costi del menù, la ricerca e `/impostazioni`.
 * Si leggono e scrivono sempre in `localStorage` (risposta immediata, funziona offline); per l'admin
 * loggato `usePreferenceSync` le tiene allineate con l'account (`AdminPreference`, `/api/preferences`):
 * all'ingresso vincono quelle dell'account, ogni modifica si salva nell'account. Visitatori: solo
 * dispositivo. Le chiavi sincronizzate sono `PREF_KEYS` (`lib/preference-keys.ts`).
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
/** Elementi per pagina delle liste (`pageSizeFor`): li usano le liste vere e i loro skeleton */
export const LIST_PAGE: Record<ListKind, { base: number; single: number; list: number }> = {
  recipes: { base: 20, single: 10, list: 20 },
  menus: { base: 12, single: 8, list: 15 },
};

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
 * Per l'admin il ripristino arriva anche all'account (lo salva `usePreferenceSync`).
 */
export function resetPreferences() {
  for (const key of [...PREF_KEYS, ...DEVICE_PREF_KEYS]) clearLocalStore(key);
}

// ── Sincronizzazione con l'account (solo admin) ─────────────────────────────

function snapshot() {
  const data: Record<string, unknown> = {};
  for (const key of PREF_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) data[key] = JSON.parse(raw);
    } catch {
      // valore illeggibile: non si manda
    }
  }
  return data;
}

/**
 * Montato una volta (in `AppShell`). Admin loggato: scarica le preferenze dell'account e le
 * scrive sul dispositivo (vincono quelle dell'account; una chiave assente torna al valore di
 * partenza); se l'account non ne ha ancora, ci carica quelle del dispositivo. Poi ogni modifica
 * di una chiave `PREF_KEYS` si salva nell'account (PUT dello stato completo, dopo 600 ms).
 * Al logout le scelte restano sul dispositivo come ultime viste.
 */
export function usePreferenceSync() {
  const { isAdmin, loading } = useAuth();
  useEffect(() => {
    if (loading || !isAdmin) return;
    let cancelled = false;
    let ready = false;
    let applying = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const push = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void fetch("/api/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: snapshot() }),
          keepalive: true,
        }).catch(() => {});
      }, 600);
    };
    // le scritture fatte qui sotto (dall'account al dispositivo) non vanno rimandate indietro
    const onChange = () => {
      if (ready && !applying) push();
    };
    for (const key of PREF_KEYS) window.addEventListener(localStoreEvent(key), onChange);

    void fetch("/api/preferences")
      .then((r) => (r.ok ? (r.json() as Promise<{ data: Record<string, unknown> | null }>) : null))
      .then((res) => {
        if (cancelled || !res) return;
        if (res.data === null) {
          ready = true;
          push(); // primo accesso: l'account prende le scelte di questo dispositivo
          return;
        }
        applying = true;
        for (const key of PREF_KEYS) setLocalStoreRaw(key, key in res.data! ? JSON.stringify(res.data![key]) : null);
        applying = false;
        ready = true;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      clearTimeout(timer);
      for (const key of PREF_KEYS) window.removeEventListener(localStoreEvent(key), onChange);
    };
  }, [isAdmin, loading]);
}
