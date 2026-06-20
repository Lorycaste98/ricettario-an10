import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { MenuForm } from "@/components/menu/MenuForm";
import type { Metadata } from "next";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const menu = await db.menu.findUnique({
    where: { id: Number(id) },
    select: { name: true },
  });
  return { title: menu ? `Modifica ${menu.name} — Admin` : "Modifica Menù — Admin" };
}

export const dynamic = "force-dynamic";

export default async function ModificaMenuPage({ params }: Params) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) notFound();

  const menu = await db.menu.findUnique({
    where: { id: menuId },
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      servingTime: true,
      photo: true,
      recipes: {
        select: { recipeId: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!menu) notFound();

  const initialData = {
    id: menu.id,
    name: menu.name,
    description: menu.description,
    date: menu.date ? menu.date.toISOString() : null,
    servingTime: menu.servingTime,
    photo: menu.photo,
    recipeIds: menu.recipes.map((r: { recipeId: number }) => r.recipeId),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-sky-50">Modifica menù</h1>
        <p className="text-sm text-sky-300/60 mt-0.5 truncate">{menu.name}</p>
      </div>
      <MenuForm initialData={initialData} />
    </div>
  );
}

