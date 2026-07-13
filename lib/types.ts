// Tipi condivisi per le API responses

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
  avgRating: number | null;
  categories: Category[];
  tags: Tag[];
  _count: { reviews: number };
}

export interface Ingredient {
  id: number;
  name: string;
  qty: number | null;
  unit: string | null;
  description: string | null;
  /** Ingrediente facoltativo: mostrato con l'etichetta "opzionale". */
  optional: boolean;
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
  photo: string | null;
  createdAt: string;
  avgRating: number | null;
  _count: { reviews: number; recipes: number };
  previewPhotos: string[];
}

export interface MenuDetail extends MenuSummary {
  updatedAt: string;
  /** Token segreto del link "/recensisci/[token]" — presente solo nella risposta admin. */
  reviewToken: string;
  recipes: Array<{
    order: number;
    recipe: RecipeSummary;
  }>;
  recipeReviews: MenuRecipeReview[];
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

