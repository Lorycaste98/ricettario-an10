"use client";
import { useAuth } from "@/components/AuthProvider";
import { CookCounter } from "@/components/recipe/CookCounter";

/**
 * Widget "Volte cucinata" (solo admin) nel dettaglio ricetta.
 * Le azioni sulla ricetta (pronta/non pronta, modifica, elimina) vivono ora
 * nella `RecipeAdminBar` in cima alla pagina.
 */
export function RecipeActions({ recipeId, cookCount }: { recipeId: number; cookCount: number }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return <CookCounter recipeId={recipeId} initialCount={cookCount} />;
}
