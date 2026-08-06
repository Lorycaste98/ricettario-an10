// Selects condivisi per mantenere risposte consistenti

import { db } from "@/lib/db";
import { toStepKind } from "@/lib/types";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

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
    select: {
      id: true,
      text: true,
      mins: true,
      kind: true,
      order: true,
      // Ingredienti necessari al passo: appiattiti in `ingredientIds` da flattenRecipe
      ingredients: { select: { ingredientId: true } },
    },
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
    // Legami passo↔ingrediente: la junction diventa una lista di id (riferiti
    // agli `ingredients[].id` della stessa risposta). In scrittura si usano
    // invece gli indici, vedi `createRecipeContent`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    steps: r.steps?.map((s: any) => ({
      ...s,
      ingredients: undefined,
      ingredientIds: (s.ingredients ?? []).map((si: { ingredientId: number }) => si.ingredientId),
    })),
    avgRating,
  };
}

// ─── Scrittura di ingredienti / step / legami ────────────────────────────────

export interface IngredientInput {
  name: string;
  qty?: number | null;
  unit?: string | null;
  description?: string | null;
  optional?: boolean;
  section?: string | null;
  order?: number;
}

export interface StepInput {
  text: string;
  mins?: number | null;
  kind?: string;
  order?: number;
  /** Indici (posizione nell'array `ingredients` della stessa richiesta) degli ingredienti del passo */
  ingredientIdx?: number[];
}

/**
 * Crea ingredienti, step e legami passo↔ingrediente di una ricetta.
 * Il chiamante deve aver già svuotato le tabelle (PUT) o aver appena creato la
 * ricetta (POST); qui non si cancella nulla.
 *
 * I legami arrivano come **indici** nell'array `ingredients` — al momento della
 * richiesta gli id non esistono ancora (il PUT fa delete-recreate di entrambe le
 * tabelle) — quindi si possono risolvere solo qui, dopo l'insert. `order` viene
 * riscritto con la posizione nell'array proprio per far coincidere indice e
 * ordine di lettura.
 */
export async function createRecipeContent(
  tx: TxClient,
  recipeId: number,
  ingredients: IngredientInput[] | undefined,
  steps: StepInput[] | undefined
) {
  const ingRows = ingredients ?? [];
  const stepRows = steps ?? [];

  const createdIngredients = ingRows.length
    ? await tx.ingredient.createManyAndReturn({
        data: ingRows.map((i, idx) => ({
          recipeId,
          name: i.name,
          qty: i.qty ?? null,
          unit: i.unit ?? null,
          description: i.description ?? null,
          optional: !!i.optional,
          section: i.section?.trim() || null,
          order: idx,
        })),
        select: { id: true, order: true },
      })
    : [];

  const createdSteps = stepRows.length
    ? await tx.step.createManyAndReturn({
        data: stepRows.map((s, idx) => ({
          recipeId,
          text: s.text,
          mins: s.mins ?? null,
          kind: toStepKind(s.kind),
          order: idx,
        })),
        select: { id: true, order: true },
      })
    : [];

  // `order` == indice nell'array inviato (riscritto sopra): mappe esatte
  const ingredientIdByIdx = new Map(createdIngredients.map((i) => [i.order, i.id]));
  const stepIdByIdx = new Map(createdSteps.map((s) => [s.order, s.id]));

  const links: { stepId: number; ingredientId: number }[] = [];
  stepRows.forEach((s, idx) => {
    const stepId = stepIdByIdx.get(idx);
    if (!stepId || !s.ingredientIdx?.length) return;
    for (const ingredientId of new Set(
      s.ingredientIdx
        .map((i) => ingredientIdByIdx.get(i))
        .filter((id): id is number => id !== undefined)
    )) {
      links.push({ stepId, ingredientId });
    }
  });

  if (links.length > 0) {
    await tx.stepIngredient.createMany({ data: links, skipDuplicates: true });
  }
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

