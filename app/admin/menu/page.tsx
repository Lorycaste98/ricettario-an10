import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/ds/PageHeader";
import { buttonClasses } from "@/components/ds/button-classes";
import MenuGestioneClient, { type AdminMenuItem } from "./MenuGestioneClient";

export const metadata: Metadata = { title: "Gestione menù — Ricettario Admin" };
export const dynamic = "force-dynamic";

async function getMenus(): Promise<AdminMenuItem[]> {
  const menus = await db.menu.findMany({
    orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      date: true,
      photo: true,
      published: true,
      people: true,
      _count: { select: { recipeReviews: true, recipes: true } },
      recipeReviews: { select: { rating: true } },
      recipes: { select: { recipe: { select: { photo: true } } }, orderBy: { order: "asc" }, take: 1 },
    },
  });
  return menus.map((m) => {
    const ratings = m.recipeReviews.map((r) => r.rating);
    return {
      id: m.id,
      name: m.name,
      date: m.date ? m.date.toISOString() : null,
      published: m.published,
      people: m.people,
      recipes: m._count.recipes,
      reviews: m._count.recipeReviews,
      avgRating: ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null,
      thumb: m.photo ?? m.recipes[0]?.recipe.photo ?? null,
    };
  });
}

export default async function AdminMenuPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const menus = await getMenus();
  const hidden = menus.filter((m) => !m.published).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Menù"
        meta={`${menus.length} menù${hidden ? ` · ${hidden} non pronti` : ""}`}
        actions={
          <Link href="/admin/menu/nuovo" className={buttonClasses("primary")}>
            <Plus aria-hidden /> Nuovo
          </Link>
        }
      />
      <MenuGestioneClient initialMenus={menus} />
    </div>
  );
}
