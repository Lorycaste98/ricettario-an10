import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Metadata } from "next";
import IngredientiClient from "./IngredientiClient";

export const metadata: Metadata = { title: "Ingredienti — Ricettario Admin" };

export default async function IngredientiPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const masters = await db.ingredientMaster.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, excludedFromStats: true },
  });

  const usages = await db.ingredient.findMany({
    select: {
      name: true,
      recipe: { select: { id: true, name: true } },
    },
  });

  const usageMap = new Map<string, { id: number; name: string }[]>();
  for (const u of usages) {
    const list = usageMap.get(u.name) ?? [];
    list.push(u.recipe);
    usageMap.set(u.name, list);
  }

  const ingredients = masters.map((m) => {
    const recipes = usageMap.get(m.name) ?? [];
    return { ...m, usageCount: recipes.length, recipes };
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ingredienti</h1>
        <p className="mt-1 text-sm text-gray-400">
          {ingredients.length} ingredienti nel catalogo · Unifica i duplicati, rinomina o escludi dalle statistiche
        </p>
      </div>
      <IngredientiClient initialIngredients={ingredients} />
    </div>
  );
}
