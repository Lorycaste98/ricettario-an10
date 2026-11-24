"use client";
import { type RecipeSummary, formatMinutes } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

/**
 * Dati comuni a `RecipeCard` (8.1, «Piatto») e `RecipeRow` (8.10, «Carta»): tempo totale,
 * categoria principale, voti, stato «non pronta» (solo admin).
 */
export function useCardInfo(recipe: RecipeSummary) {
  const { isAdmin } = useAuth();
  const total = (recipe.prep ?? 0) + (recipe.cook ?? 0);
  return {
    isAdmin,
    time: total > 0 ? formatMinutes(total) : null,
    cat: recipe.categories[0] ?? null,
    guest: recipe._count.reviews > 0 && recipe.avgRating !== null ? { value: recipe.avgRating!, count: recipe._count.reviews } : null,
    mine: isAdmin && recipe.myRating != null ? recipe.myRating : null,
    hidden: isAdmin && !recipe.published,
  };
}

/**
 * Pressione al tocco (touch) e sollevamento al passaggio del mouse (solo dove c'è un mouse:
 * in Tailwind v4 `hover:` vale solo con `@media (hover: hover)`). Movimento corto, niente rimbalzi.
 */
export const pressCls =
  "transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";
