// Aggregazione ingredienti delle ricette di un menù in una lista della spesa.
// Raggruppa per nome+unità normalizzati (case-insensitive); quando gli ingredienti
// verranno unificati via IngredientMaster, Ingredient.name viene riscritto dal merge
// (vedi app/api/admin/ingredients/merge/route.ts) e la lista si allinea da sola.

export interface ShoppingListIngredient {
  name: string;
  qty: number | null;
  unit: string | null;
}

export interface ShoppingListRecipe {
  name: string;
  ingredients: ShoppingListIngredient[];
}

export interface ShoppingListItem {
  key: string;
  name: string;
  unit: string | null;
  qty: number | null;
  recipeNames: string[];
}

export function buildShoppingList(recipes: ShoppingListRecipe[]): ShoppingListItem[] {
  const map = new Map<string, ShoppingListItem>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const name = ing.name.trim();
      if (!name) continue;
      const unit = ing.unit?.trim() || null;
      const key = `${name.toLowerCase()}|${(unit ?? "").toLowerCase()}`;

      let item = map.get(key);
      if (!item) {
        item = { key, name, unit, qty: null, recipeNames: [] };
        map.set(key, item);
      }
      if (ing.qty != null) {
        item.qty = Math.round(((item.qty ?? 0) + ing.qty) * 100) / 100;
      }
      if (!item.recipeNames.includes(recipe.name)) item.recipeNames.push(recipe.name);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "it"));
}
