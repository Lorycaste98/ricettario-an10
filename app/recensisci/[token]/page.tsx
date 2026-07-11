import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MenuReviewForm } from "@/components/menu/MenuReviewForm";

type Params = { params: Promise<{ token: string }> };

export const metadata: Metadata = { title: "Recensisci il menù — Ricettario" };

export default async function RecensisciMenuPage({ params }: Params) {
  const { token } = await params;

  const menu = await db.menu.findUnique({
    where: { reviewToken: token },
    select: {
      id: true,
      name: true,
      recipes: {
        select: { order: true, recipe: { select: { id: true, name: true, photo: true } } },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!menu) notFound();

  const recipes = menu.recipes.map((mr) => mr.recipe);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-sky-50">{menu.name}</h1>
        <p className="text-sm text-sky-300/70">Vota le ricette che hai assaggiato — un voto da 1 a 10</p>
      </div>
      <MenuReviewForm token={token} recipes={recipes} />
    </div>
  );
}
