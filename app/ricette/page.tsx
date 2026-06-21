import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { flattenRecipe, recipeSummarySelect } from "@/lib/api";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ricette — Ricettario" };
export const dynamic = "force-dynamic";

export default async function RicettePage() {
  // Gli admin vedono tutte le ricette (anche le non pronte); i visitatori solo le pubblicate
  const isAdmin = !!(await getSession());

  const [rawRecipes, categories, tags] = await Promise.all([
    db.recipe.findMany({
      where: isAdmin ? undefined : { published: true },
      select: recipeSummarySelect,
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  const recipes = rawRecipes.map(flattenRecipe);

  return (
    <div>
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/30 px-4 py-1.5 text-xs font-semibold text-sky-700 backdrop-blur-sm">
          <BookOpen size={12} />
          Ricette
        </div>
        <h1 className="text-3xl font-bold text-sky-50 drop-shadow">Le mie ricette</h1>
        <p className="text-sky-200/80 text-sm">Prova una delle mie ricette</p>
      </div>
      <RecipeGrid recipes={recipes} categories={categories} tags={tags} />
    </div>
  );
}
