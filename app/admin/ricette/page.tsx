import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/ds/PageHeader";
import { buttonClasses } from "@/components/ds/button-classes";
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
      cookCount: true,
      categories: { select: { category: { select: { name: true, color: true } } } },
    },
  });

  const items = recipes.map((r) => ({
    id: r.id,
    name: r.name,
    photo: r.photo,
    published: r.published,
    cookCount: r.cookCount,
    categories: r.categories.map((rc) => rc.category),
  }));
  const hidden = items.filter((r) => !r.published).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Ricette"
        meta={`${items.length} ricette${hidden ? ` · ${hidden} non pronte` : ""}`}
        actions={
          <Link href="/admin/ricette/nuova" className={buttonClasses("primary")}>
            <Plus aria-hidden /> Nuova
          </Link>
        }
      />
      <RicetteGestioneClient initialRecipes={items} />
    </div>
  );
}
