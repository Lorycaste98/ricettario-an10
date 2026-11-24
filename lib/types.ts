// Tipi condivisi per le API responses

import type { StepIngredientLink } from "@/lib/step-ingredients";

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface RecipeSummary {
  id: number;
  name: string;
  servings: number | null;
  /** Unità delle porzioni (es. "teglie da 28cm"); nulla/assente = persone. */
  servingsUnit: string | null;
  prep: number | null;
  cook: number | null;
  photo: string | null;
  notes: string | null;
  cookCount: number;
  published: boolean;
  /** Ricetta "veloce": solo nome, senza scheda. Esclusa da libreria/ricerca, nessuna pagina di dettaglio. */
  quick: boolean;
  createdAt: string;
  /** Media delle recensioni ospiti (dai link menù); NON include il voto personale dell'admin. */
  avgRating: number | null;
  /** Voto personale (1-10) dell'admin loggato su questa ricetta; null = non votata / visitatore. */
  myRating: number | null;
  categories: Category[];
  tags: Tag[];
  _count: { reviews: number };
}

/** Voto personale dell'admin su una ricetta (uno per account): 1-10 + nota opzionale. */
export interface PersonalRating {
  rating: number;
  note: string | null;
}

export interface Ingredient {
  id: number;
  name: string;
  qty: number | null;
  unit: string | null;
  description: string | null;
  /** Ingrediente facoltativo: mostrato con l'etichetta "opzionale". */
  optional: boolean;
  /** Sezione/preparazione di appartenenza (es. "Per l'impasto"); null = nessuna sezione. */
  section?: string | null;
  order: number;
}

/** Tipo di tempo di uno step della procedura. */
export type StepKind = "PREP" | "COOK" | "WAIT";

export const STEP_KINDS: StepKind[] = ["PREP", "COOK", "WAIT"];

export const STEP_KIND_LABEL: Record<StepKind, string> = {
  PREP: "Preparazione",
  COOK: "Cottura",
  WAIT: "Attesa",
};

/** Normalizza un valore arbitrario in uno StepKind valido (default PREP). */
export function toStepKind(v: unknown): StepKind {
  return v === "COOK" || v === "WAIT" ? v : "PREP";
}

export interface Step {
  id: number;
  text: string;
  mins: number | null;
  kind: StepKind;
  order: number;
  /**
   * Ingredienti (della stessa ricetta) necessari a questo passo; assente/vuoto = nessun legame.
   * `qty` = parte del totale dell'ingrediente usata in questo passo, null = non specificata.
   * Vedi `lib/step-ingredients.ts` per la resa a schermo.
   */
  stepIngredients?: StepIngredientLink[];
}

export interface RecipePhoto {
  id: number;
  url: string;
  order: number;
}

/** Voto 1-10. `menu` presente = recensione arrivata dal link di quel menù; assente = nota personale admin. */
export interface Review {
  id: number;
  nickname: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  menu?: { id: number; name: string } | null;
}

export interface RecipeDetail extends RecipeSummary {
  links: string | null;
  updatedAt: string;
  photos: RecipePhoto[];
  ingredients: Ingredient[];
  steps: Step[];
  reviews: Review[];
}

/** Recensione ricetta ricevuta tramite il link di un menù (vista lato menù). */
export interface MenuRecipeReview {
  id: number;
  nickname: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  recipe: { id: number; name: string; quick: boolean };
}

export interface MenuSummary {
  id: number;
  name: string;
  description: string | null;
  date: string | null;
  servingTime: string | null;
  /** Persone previste per il menù (opzionale, informativo). */
  people: number | null;
  photo: string | null;
  /** false = "non pronto", nascosto ai visitatori (visibile solo all'admin, offuscato) */
  published: boolean;
  createdAt: string;
  avgRating: number | null;
  _count: { reviews: number; recipes: number };
  previewPhotos: string[];
  /** nomi delle prime ricette del menù, in ordine (card 8.5 «menù stampato») */
  previewNames: string[];
}

/** Voce di costo generica di un menù ("altri costi"). */
export interface MenuCostLine {
  id: number;
  label: string;
  amount: number;
}

/** Ingrediente "extra" aggiunto a mano alla lista spesa di un menù. */
export interface MenuExtraItem {
  id: number;
  name: string;
  qty: number | null;
  unit: string | null;
}

export interface MenuDetail extends MenuSummary {
  updatedAt: string;
  /** Token segreto del link "/recensisci/[token]" — presente solo nella risposta admin. */
  reviewToken: string;
  recipes: Array<{
    order: number;
    /** Porzioni scelte per questa ricetta nel menù (override del default della ricetta); null = default. */
    servings: number | null;
    recipe: RecipeSummary;
  }>;
  recipeReviews: MenuRecipeReview[];
  // Campi admin-only (Costi + nota + extra lista spesa); null/[] per i visitatori.
  /** Nota admin del menù (privata). */
  notes: string | null;
  /** Totale speso per la spesa alimentari (dalla lista spesa). */
  groceryCost: number | null;
  /** Ore di manodopera. */
  laborHours: number | null;
  /** Prezzo orario della manodopera (€/h). */
  laborRate: number | null;
  /** Ricarico % scelto per il prezzo di vendita. */
  markupPercent: number | null;
  /** Voci di costo generiche ("altri costi"). */
  costs: MenuCostLine[];
  /** Ingredienti "extra" della lista spesa (non presenti nelle ricette). */
  extraItems: MenuExtraItem[];
}

// Utility

/** "4 pers." oppure "2 teglie da 28cm" — tollera `undefined` (payload cached pre-deploy). */
export function formatServings(n: number, unit?: string | null): string {
  return `${n} ${unit?.trim() || "pers."}`;
}

export function formatMinutes(mins: number | null): string {
  if (!mins) return "";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}


// ---------------------------------------------------------------------------
// Ricerca globale (overlay «Cerca»): indice compatto scaricato una volta e interrogato nel browser.
// Contiene solo ciò che chi cerca può vedere (visitatore: solo ricette e menù pronti).
// ---------------------------------------------------------------------------
export interface SearchIndexRecipe {
  id: number;
  name: string;
  photo: string | null;
  /** prep + cook in minuti; 0 = non indicato */
  time: number;
  servings: number | null;
  servingsUnit: string | null;
  published: boolean;
  avgRating: number | null;
  reviews: number;
  categories: { name: string; color: string }[];
  tags: string[];
  /** Nomi degli ingredienti, nell'ordine della ricetta */
  ingredients: string[];
  /** Quantità e unità di ogni ingrediente (stesso ordine di `ingredients`); null = non indicata/q.b. */
  amounts: [number | null, string | null][];
  steps: number;
  /** Testo dei passi e note, uno per riga (si cerca anche qui) */
  text: string;
  /** Cotture registrate (`Recipe.cookCount`) */
  cooks: number;
}

export interface SearchIndexMenu {
  id: number;
  name: string;
  description: string | null;
  date: string | null;
  servingTime: string | null;
  people: number | null;
  /** Foto del menù o, in mancanza, della prima ricetta con foto */
  photo: string | null;
  published: boolean;
  avgRating: number | null;
  reviews: number;
  /** Ricette con scheda (id in `recipes`), in ordine */
  recipeIds: number[];
  /** Ricette «veloci» (solo nome, senza scheda) */
  quickRecipes: string[];
}

export interface SearchIndex {
  recipes: SearchIndexRecipe[];
  menus: SearchIndexMenu[];
  /** Ingredienti esclusi dalle statistiche (IngredientMaster.excludedFromStats), già normalizzati */
  excluded: string[];
}
