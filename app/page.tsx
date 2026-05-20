import { db } from "@/lib/db";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { flattenRecipe } from "@/lib/api";

export default async function HomePage() {
  const [rawRecipes, categories, tags] = await Promise.all([
    db.recipe.findMany({
      select: {
        id: true, name: true, servings: true, prep: true, cook: true,
        photo: true, notes: true, cookCount: true, createdAt: true,
        categories: { select: { category: { select: { id: true, name: true, color: true } } } },
        tags: { select: { tag: { select: { id: true, name: true } } } },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  const recipes = rawRecipes.map(flattenRecipe);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ricette</h1>
        <p className="mt-1 text-gray-500">{recipes.length} ricette nel ricettario</p>
      </div>
      <RecipeGrid recipes={recipes} categories={categories} tags={tags} />
    </div>
  );
}
