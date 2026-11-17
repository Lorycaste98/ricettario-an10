import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Metadata } from "next";
import IngredientiClient from "./IngredientiClient";
import { PageHeader } from "@/components/ds/PageHeader";

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

  const excluded = ingredients.filter((i) => i.excludedFromStats).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Ingredienti" meta={`${ingredients.length} a catalogo · ${excluded} fuori dalle statistiche`} />
      <IngredientiClient initialIngredients={ingredients} />
    </div>
  );
}
