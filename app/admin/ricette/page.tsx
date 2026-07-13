import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Metadata } from "next";
import RicetteGestioneClient from "./RicetteGestioneClient";

export const metadata: Metadata = { title: "Gestione ricette — Ricettario Admin" };
export const dynamic = "force-dynamic";

export default async function RicetteGestionePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const recipes = await db.recipe.findMany({
    where: { quick: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      photo: true,
      published: true,
      categories: { select: { category: { select: { name: true, color: true } } } },
    },
  });

  const items = recipes.map((r) => ({
    id: r.id,
    name: r.name,
    photo: r.photo,
    published: r.published,
    categories: r.categories.map((rc) => rc.category),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestione ricette</h1>
        <p className="mt-1 text-sm text-gray-400">
          {items.length} ricette · Scegli quali mostrare ai visitatori. Le ricette non pronte restano visibili solo a te.
        </p>
      </div>
      <RicetteGestioneClient initialRecipes={items} />
    </div>
  );
}
