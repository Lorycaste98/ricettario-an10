import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MenuReviewForm } from "@/components/menu/MenuReviewForm";
import { ClocheIcon } from "@/components/icons";

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
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-11 items-center justify-center rounded-[0.875rem] bg-area-menu-50 text-area-menu">
          <ClocheIcon className="size-6" aria-hidden />
        </span>
        <h1 className="text-(length:--fs-page) font-bold leading-tight text-blu-950">{menu.name}</h1>
        <p className="max-w-[34ch] text-grigio">Vota le ricette che hai assaggiato, da 1 a 10. Non serve registrarsi.</p>
      </header>
      <MenuReviewForm token={token} recipes={recipes} />
    </div>
  );
}
