// Selects condivisi per mantenere risposte consistenti

export const recipeSummarySelect = {
  id: true,
  name: true,
  servings: true,
  servingsUnit: true,
  prep: true,
  cook: true,
  photo: true,
  notes: true,
  cookCount: true,
  published: true,
  quick: true,
  createdAt: true,
  categories: {
    select: {
      category: { select: { id: true, name: true, color: true } },
    },
  },
  tags: {
    select: {
      tag: { select: { id: true, name: true } },
    },
  },
  _count: { select: { reviews: true } },
  // NB: nessuna `reviews` qui — la media voti per le liste si calcola lato DB
  // con un'unica groupBy in `attachRecipeRatings` (lib/queries.ts), non trascinando
  // ogni riga recensione. Il dettaglio (recipeDetailSelect) la ridefinisce con i campi completi.
} as const;

export const recipeDetailSelect = {
  ...recipeSummarySelect,
  links: true,
  updatedAt: true,
  photos: {
    select: { id: true, url: true, order: true },
    orderBy: { order: "asc" as const },
  },
  ingredients: {
    select: { id: true, name: true, qty: true, unit: true, description: true, optional: true, section: true, order: true },
    orderBy: { order: "asc" as const },
  },
  steps: {
    select: { id: true, text: true, mins: true, kind: true, order: true },
    orderBy: { order: "asc" as const },
  },
  reviews: {
    select: {
      id: true,
      nickname: true,
      rating: true,
      comment: true,
      createdAt: true,
      menu: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

// Normalizza il risultato appiattendo le junction table categories/tags
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flattenRecipe(r: any) {
  const reviews: { rating: number }[] = r.reviews ?? [];
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s: number, rv: { rating: number }) => s + rv.rating, 0) / reviews.length) * 10) / 10
      : null;
  return {
    ...r,
    categories: r.categories?.map((rc: { category: unknown }) => rc.category),
    tags: r.tags?.map((rt: { tag: unknown }) => rt.tag),
    avgRating,
  };
}

export function ok(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function err(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * Converte una stringa data "YYYY-MM-DD" (dal <input type="date">) in `Date`.
 * Fissa l'ora a mezzogiorno UTC così la data non slitta di giorno per timezone
 * ed è ricostruibile con `.toISOString().slice(0, 10)`. Ritorna `undefined`
 * se il valore è assente o malformato.
 */
export function parseDateOnly(value?: string | null): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = new Date(`${value}T12:00:00.000Z`);
  return isNaN(d.getTime()) ? undefined : d;
}

/** Intero positivo o `null` (per campi porzioni/persone opzionali dei menù). */
export function normalizePeople(value?: number | null): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

/**
 * Importo in € ≥ 0 arrotondato a 2 decimali, oppure `null` (campo assente/vuoto/non valido).
 * Usato dai campi monetari dei menù (spesa, prezzo orario, voci di costo).
 */
export function normalizeMoney(value?: number | null): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

/** Numero di ore ≥ 0 (manodopera), max 2 decimali, oppure `null`. */
export function normalizeHours(value?: number | null): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

/** Percentuale ≥ 0 (ricarico), max 2 decimali, oppure `null`. */
export function normalizePercent(value?: number | null): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

/**
 * Normalizza le ricette di un menù in `{recipeId, servings}[]` (ordine preservato).
 * Accetta la forma ricca `recipes` (con override porzioni) o, in fallback, la
 * vecchia `recipeIds` (senza porzioni). Scarta id non validi e duplicati.
 */
export function normalizeMenuRecipes(
  recipes?: { recipeId: number; servings?: number | null }[],
  recipeIds?: number[]
): { recipeId: number; servings: number | null }[] {
  const raw = recipes?.length
    ? recipes
    : (recipeIds ?? []).map((recipeId) => ({ recipeId, servings: null }));
  const seen = new Set<number>();
  const out: { recipeId: number; servings: number | null }[] = [];
  for (const r of raw) {
    const id = Number(r.recipeId);
    if (!Number.isInteger(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ recipeId: id, servings: normalizePeople(r.servings) });
  }
  return out;
}

