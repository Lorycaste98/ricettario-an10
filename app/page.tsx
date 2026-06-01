import { db } from "@/lib/db";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { flattenRecipe, recipeSummarySelect } from "@/lib/api";

export default async function HomePage() {
  const [rawRecipes, categories, tags] = await Promise.all([
    db.recipe.findMany({
      select: recipeSummarySelect,
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  const recipes = rawRecipes.map(flattenRecipe);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sky-950">Ricette</h1>
        <p className="mt-1 text-sky-700">{recipes.length} ricette nel ricettario</p>
      </div>
      <RecipeGrid recipes={recipes} categories={categories} tags={tags} />
    </div>
  );
}
