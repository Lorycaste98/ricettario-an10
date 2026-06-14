import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import VocabolarioClient from "./VocabolarioClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Categorie & Tag — Ricettario" };

export default async function VocabolarioPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [categories, tags] = await Promise.all([
    db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { recipes: true } } },
    }),
    db.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { recipes: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categorie & Tag</h1>
        <p className="mt-1 text-sm text-gray-400">
          Gestisci le categorie (con colore) e i tag ingredienti usati nelle ricette.
        </p>
      </div>
      <VocabolarioClient initialCategories={categories} initialTags={tags} />
    </div>
  );
}

