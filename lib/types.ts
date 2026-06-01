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
  prep: number | null;
  cook: number | null;
  photo: string | null;
  notes: string | null;
  cookCount: number;
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
  order: number;
}

export interface Step {
  id: number;
  text: string;
  mins: number | null;
  order: number;
}

export interface RecipePhoto {
  id: number;
  url: string;
  order: number;
}

export interface Review {
  id: number;
  nickname: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface RecipeDetail extends RecipeSummary {
  links: string | null;
  updatedAt: string;
  photos: RecipePhoto[];
  ingredients: Ingredient[];
  steps: Step[];
  reviews: Review[];
}

export interface MenuReview {
  id: number;
  nickname: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface MenuSummary {
  id: number;
  name: string;
  description: string | null;
  date: string | null;
  photo: string | null;
  createdAt: string;
  avgRating: number | null;
  _count: { reviews: number; recipes: number };
  previewPhotos: string[];
}

export interface MenuDetail extends MenuSummary {
  updatedAt: string;
  recipes: Array<{
    order: number;
    recipe: RecipeSummary;
  }>;
  reviews: MenuReview[];
}

// Utility
export function formatMinutes(mins: number | null): string {
  if (!mins) return "";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

