/**
 * Ricerca globale: logica pura, usata nel browser dall'overlay «Cerca»
 * (`components/search/SearchOverlay.tsx`) sull'indice di `GET /api/search/index`.
 *
 * - `prepareIndex` normalizza una volta i testi (minuscole, senza accenti) e ricava gli
 *   **ingredienti** raggruppando per nome i `Ingredient` di tutte le ricette.
 * - `runSearch` cerca per parole: ogni parola deve comparire da qualche parte; il punteggio
 *   premia il nome (inizio > inizio di parola > dentro) rispetto a categorie, tag e ingredienti.
 * - `ingredientStats` produce le statistiche mostrate nell'anteprima di un ingrediente.
 * - `openSearch()` apre l'overlay da qualsiasi punto (evento `window`, come `openPhotoViewer`).
 */
import type { SearchIndex, SearchIndexMenu, SearchIndexRecipe } from "@/lib/types";

export function normalizeSearchText(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// ---------------------------------------------------------------------------
// Apertura dell'overlay
// ---------------------------------------------------------------------------
export const OPEN_SEARCH_EVENT = "ricettario:open-search";

export function openSearch(query = "") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(OPEN_SEARCH_EVENT, { detail: query }));
}

// ---------------------------------------------------------------------------
// Indice preparato
// ---------------------------------------------------------------------------
export interface IngredientEntry {
  key: string;
  /** Grafia più usata nelle ricette */
  name: string;
  recipeIds: number[];
}

export interface PreparedIndex {
  raw: SearchIndex;
  recipes: (SearchIndexRecipe & { n: string; nCats: string[]; nTags: string[]; nIngr: string[] })[];
  menus: (SearchIndexMenu & { n: string; nDesc: string; recipeNames: string[]; nRecipes: string[] })[];
  ingredients: (IngredientEntry & { n: string })[];
  recipeById: Map<number, SearchIndexRecipe>;
  menuById: Map<number, SearchIndexMenu>;
  ingredientByKey: Map<string, IngredientEntry>;
  excluded: Set<string>;
}

export function prepareIndex(raw: SearchIndex): PreparedIndex {
  const recipeById = new Map(raw.recipes.map((r) => [r.id, r]));
  const menuById = new Map(raw.menus.map((m) => [m.id, m]));

  // Ingredienti: chiave = nome normalizzato, nome mostrato = grafia più frequente
  const groups = new Map<string, { spellings: Map<string, number>; ids: Set<number> }>();
  for (const r of raw.recipes) {
    for (const name of r.ingredients) {
      const key = normalizeSearchText(name);
      if (!key) continue;
      let g = groups.get(key);
      if (!g) groups.set(key, (g = { spellings: new Map(), ids: new Set() }));
      g.spellings.set(name, (g.spellings.get(name) ?? 0) + 1);
      g.ids.add(r.id);
    }
  }
  const ingredients = [...groups].map(([key, g]) => {
    const name = [...g.spellings].sort((a, b) => b[1] - a[1])[0][0];
    return { key, name, n: key, recipeIds: [...g.ids] };
  });

  return {
    raw,
    recipes: raw.recipes.map((r) => ({
      ...r,
      n: normalizeSearchText(r.name),
      nCats: r.categories.map((c) => normalizeSearchText(c.name)),
      nTags: r.tags.map(normalizeSearchText),
      nIngr: r.ingredients.map(normalizeSearchText),
    })),
    menus: raw.menus.map((m) => {
      const recipeNames = [
        ...m.recipeIds.map((id) => recipeById.get(id)?.name).filter((x): x is string => !!x),
        ...m.quickRecipes,
      ];
      return {
        ...m,
        n: normalizeSearchText(m.name),
        nDesc: normalizeSearchText(m.description ?? ""),
        recipeNames,
        nRecipes: recipeNames.map(normalizeSearchText),
      };
    }),
    ingredients,
    recipeById,
    menuById,
    ingredientByKey: new Map(ingredients.map((i) => [i.key, i])),
    excluded: new Set(raw.excluded),
  };
}

// ---------------------------------------------------------------------------
// Ricerca
// ---------------------------------------------------------------------------
export type SearchHit<T> = { item: T; score: number; /** perché è uscita (es. l'ingrediente trovato) */ via?: string };

export interface SearchResults {
  recipes: SearchHit<SearchIndexRecipe>[];
  menus: SearchHit<SearchIndexMenu>[];
  ingredients: SearchHit<IngredientEntry>[];
}

function tokenize(q: string) {
  return normalizeSearchText(q).split(/\s+/).filter(Boolean);
}

/** Punteggio di una parola dentro un nome: inizio del nome > inizio di una parola > dentro. */
function nameScore(name: string, token: string) {
  if (name.startsWith(token)) return 100;
  if (name.includes(" " + token) || name.includes("'" + token)) return 70;
  if (name.includes(token)) return 45;
  return 0;
}

function bestIn(list: string[], token: string) {
  let best = -1;
  for (let i = 0; i < list.length; i++) {
    if (list[i].includes(token) && (best < 0 || list[i].length < list[best].length)) best = i;
  }
  return best;
}

const LIMITS = { recipes: 30, menus: 12, ingredients: 10 };

export function runSearch(idx: PreparedIndex, query: string): SearchResults {
  const tokens = tokenize(query);
  if (tokens.length === 0) return { recipes: [], menus: [], ingredients: [] };

  const recipes: SearchHit<SearchIndexRecipe>[] = [];
  for (const r of idx.recipes) {
    let score = 0;
    let via: string | undefined;
    let ok = true;
    for (const t of tokens) {
      const s = nameScore(r.n, t);
      if (s) { score += s; continue; }
      if (r.nCats.some((c) => c.includes(t)) || r.nTags.some((g) => g.includes(t))) { score += 25; continue; }
      const i = bestIn(r.nIngr, t);
      if (i >= 0) { score += 18; via ??= r.ingredients[i]; continue; }
      ok = false;
      break;
    }
    if (ok) recipes.push({ item: r, score: score - r.n.length / 100, via });
  }

  const menus: SearchHit<SearchIndexMenu>[] = [];
  for (const m of idx.menus) {
    let score = 0;
    let via: string | undefined;
    let ok = true;
    for (const t of tokens) {
      const s = nameScore(m.n, t);
      if (s) { score += s; continue; }
      const i = bestIn(m.nRecipes, t);
      if (i >= 0) { score += 22; via ??= m.recipeNames[i]; continue; }
      if (m.nDesc.includes(t)) { score += 12; continue; }
      ok = false;
      break;
    }
    if (ok) menus.push({ item: m, score: score - m.n.length / 100, via });
  }

  const ingredients: SearchHit<IngredientEntry>[] = [];
  for (const g of idx.ingredients) {
    let score = 0;
    for (const t of tokens) {
      const s = nameScore(g.n, t);
      if (!s) { score = -1; break; }
      score += s;
    }
    // A parità di corrispondenza vince l'ingrediente usato in più ricette
    if (score >= 0) ingredients.push({ item: g, score: score + Math.min(g.recipeIds.length, 30) - g.n.length / 10 });
  }

  const byScore = (a: { score: number }, b: { score: number }) => b.score - a.score;
  return {
    recipes: recipes.sort(byScore).slice(0, LIMITS.recipes),
    menus: menus.sort(byScore).slice(0, LIMITS.menus),
    ingredients: ingredients.sort(byScore).slice(0, LIMITS.ingredients),
  };
}

// ---------------------------------------------------------------------------
// Statistiche di un ingrediente
// ---------------------------------------------------------------------------
export interface IngredientStats {
  entry: IngredientEntry;
  recipes: SearchIndexRecipe[];
  /** Quota sulle ricette visibili (0–1) */
  share: number;
  menus: SearchIndexMenu[];
  byCategory: { name: string; color: string; count: number }[];
  /** Ingredienti che compaiono più spesso nelle stesse ricette (esclusi quelli fuori statistica) */
  together: { key: string; name: string; count: number }[];
}

export function ingredientStats(idx: PreparedIndex, key: string): IngredientStats | null {
  const entry = idx.ingredientByKey.get(key);
  if (!entry) return null;
  const ids = new Set(entry.recipeIds);
  const recipes = idx.raw.recipes.filter((r) => ids.has(r.id));
  const menus = idx.raw.menus.filter((m) => m.recipeIds.some((id) => ids.has(id)));

  const cats = new Map<string, { name: string; color: string; count: number }>();
  for (const r of recipes) {
    const c = r.categories[0];
    if (!c) continue;
    const cur = cats.get(c.name) ?? { ...c, count: 0 };
    cur.count++;
    cats.set(c.name, cur);
  }

  const co = new Map<string, number>();
  for (const r of recipes) {
    const seen = new Set<string>();
    for (const name of r.ingredients) {
      const k = normalizeSearchText(name);
      if (k === key || seen.has(k) || idx.excluded.has(k)) continue;
      seen.add(k);
      co.set(k, (co.get(k) ?? 0) + 1);
    }
  }
  const together = [...co]
    .filter(([, n]) => n >= 2 || recipes.length < 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, count]) => ({ key: k, name: idx.ingredientByKey.get(k)?.name ?? k, count }));

  return {
    entry,
    recipes,
    share: idx.raw.recipes.length ? recipes.length / idx.raw.recipes.length : 0,
    menus,
    byCategory: [...cats.values()].sort((a, b) => b.count - a.count),
    together,
  };
}

/** Ingredienti più usati (per lo stato iniziale dell'overlay), esclusi quelli fuori statistica. */
export function topIngredients(idx: PreparedIndex, n = 10) {
  return idx.ingredients
    .filter((i) => !idx.excluded.has(i.key))
    .sort((a, b) => b.recipeIds.length - a.recipeIds.length)
    .slice(0, n);
}
