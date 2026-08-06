/**
 * Legami passo↔ingrediente con quantità (`StepIngredient.qty`).
 *
 * Invariante di tutto il modulo: `Ingredient.qty` resta l'**unico totale** della
 * ricetta; le quantità sui passi sono una *ripartizione* di quel totale. La somma
 * dei passi può stare **sotto** (parte dell'ingrediente si usa senza misurare) ma
 * non **sopra** — è questo lo sforamento che il form segnala.
 *
 * Nessuna unità propria sul legame: si eredita `Ingredient.unit`, altrimenti la
 * somma non sarebbe verificabile (500 g contro «2 cucchiai» richiederebbe una
 * tabella di conversioni).
 */

/** Un legame passo↔ingrediente in lettura. `qty` null = non specificata. */
export interface StepIngredientLink {
  ingredientId: number;
  qty: number | null;
}

/**
 * Tolleranza dei confronti fra somma dei passi e totale dell'ingrediente.
 * Senza, `0.33 × 3` contro `1` risulterebbe sforato per arrotondamento.
 */
export const QTY_EPSILON = 0.001;

/** Quantità leggibile: intero secco, altrimenti max 2 decimali (le quantità scalate fanno 166.67). */
export function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/** Stato di ripartizione di un ingrediente sui passi della ricetta. */
export interface Allocation {
  /** Somma delle quantità assegnate ai passi (i legami senza quantità non contano) */
  assigned: number;
  /** Numero di passi che usano l'ingrediente */
  steps: number;
  /** Passi che lo usano senza indicare una quantità ("quanto serve") */
  unspecified: number;
  /** Almeno un passo indica una quantità: l'ingrediente è "ripartito" */
  split: boolean;
  /** Totale − assegnato; null se il totale dell'ingrediente non è noto (q.b.) */
  remaining: number | null;
  /** Assegnato oltre il totale (oltre la tolleranza) */
  over: boolean;
}

const EMPTY: Allocation = {
  assigned: 0,
  steps: 0,
  unspecified: 0,
  split: false,
  remaining: null,
  over: false,
};

/** Ripartizione di un ingrediente dato il suo totale e le quantità assegnate dai passi. */
export function allocationOf(total: number | null, stepQtys: (number | null)[]): Allocation {
  if (stepQtys.length === 0) {
    return total != null ? { ...EMPTY, remaining: total } : EMPTY;
  }
  let assigned = 0;
  let unspecified = 0;
  for (const q of stepQtys) {
    if (q != null && Number.isFinite(q)) assigned += q;
    else unspecified++;
  }
  // Arrotondato: sommare float dà 0.30000000000000004 e il residuo si legge male
  assigned = Math.round(assigned * 100) / 100;
  const split = unspecified < stepQtys.length;
  return {
    assigned,
    steps: stepQtys.length,
    unspecified,
    split,
    remaining: total != null ? Math.round((total - assigned) * 100) / 100 : null,
    over: total != null && assigned - total > QTY_EPSILON,
  };
}

/**
 * Quantità da mostrare per un legame, in unità della ricetta (il chiamante applica
 * poi la sua scala: porzioni del dettaglio o `MenuRecipe.servings` in cucina).
 *
 * - quantità indicata → quella quantità;
 * - non indicata e nessun altro passo ne assegna una parte → il totale
 *   dell'ingrediente (comportamento di sempre, il caso di gran lunga più comune);
 * - non indicata ma l'ingrediente è ripartito fra i passi → `null`, cioè solo il
 *   nome: mostrare il totale pieno accanto a un passo che ne usa una frazione
 *   sarebbe una bugia.
 */
export function resolveLinkQty(
  linkQty: number | null | undefined,
  ingredientQty: number | null,
  split: boolean
): number | null {
  if (linkQty != null && Number.isFinite(linkQty)) return linkQty;
  return split ? null : ingredientQty;
}

/**
 * Id degli ingredienti ripartiti, cioè con **almeno un** legame che indica una
 * quantità. Serve a `resolveLinkQty` per decidere se un legame senza quantità
 * significa "tutto" o "il resto".
 */
export function splitIngredientIds(
  steps: { stepIngredients?: StepIngredientLink[] | null }[]
): Set<number> {
  const out = new Set<number>();
  for (const s of steps) {
    for (const l of s.stepIngredients ?? []) {
      if (l.qty != null && Number.isFinite(l.qty)) out.add(l.ingredientId);
    }
  }
  return out;
}

/**
 * Quantità ≥ 0 arrotondata a 2 decimali, oppure `null` (valore assente/non valido).
 * ⚠️ Lo scarto esplicito di `null`/`""` è necessario: `Number(null)` è `0`, quindi
 * un legame «quanto serve» finirebbe a DB come quantità 0.
 */
export function normalizeStepQty(value?: number | string | null): number | null {
  if (value == null || (typeof value === "string" && !value.trim())) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}
