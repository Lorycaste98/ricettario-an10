import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NewRecipeLink, RecipeGrid } from "@/components/recipe/RecipeGrid";
import { getRecipeSummaries } from "@/lib/queries";
import { PageHeader } from "@/components/ds/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ricette — Ricettario" };

export default async function RicettePage() {
  // Gli admin vedono tutte le ricette (anche le non pronte) + il proprio voto personale
  const session = await getSession();

  const [recipes, categories, tags] = await Promise.all([
    getRecipeSummaries(session?.adminId ?? null),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Ricette"
        meta={session ? `${recipes.length} ricette nel ricettario` : "Le ricette del ricettario AN10"}
        actions={session ? <NewRecipeLink /> : undefined}
      />
      <RecipeGrid recipes={recipes} categories={categories} tags={tags} />
    </div>
  );
}
