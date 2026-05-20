import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { RecipeForm } from "@/components/recipe/RecipeForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nuova ricetta — Ricettario" };

export default async function NuovaRicettaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [categories, tags] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <RecipeForm categories={categories} tags={tags} />
    </div>
  );
}

