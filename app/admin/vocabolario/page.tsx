import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import VocabolarioClient from "./VocabolarioClient";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ds/PageHeader";

export const metadata: Metadata = { title: "Categorie e tag — Ricettario" };

export default async function VocabolarioPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [categories, tags] = await Promise.all([
    db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { recipes: true } } },
    }),
    db.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { recipes: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Categorie e tag" meta={`${categories.length} categorie · ${tags.length} tag`} />
      <VocabolarioClient initialCategories={categories} initialTags={tags} />
    </div>
  );
}
