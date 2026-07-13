import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ArrowLeft, ChefHat } from "lucide-react";
import { CookPlanner } from "@/components/menu/CookPlanner";
import type { Metadata } from "next";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const menu = await db.menu.findUnique({ where: { id: Number(id) }, select: { name: true } });
  return { title: menu ? `Modalità cucina — ${menu.name}` : "Modalità cucina — Ricettario" };
}

export const dynamic = "force-dynamic";

export default async function MenuCookModePage({ params }: Params) {
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
      date: true,
      servingTime: true,
      recipes: {
        select: {
          order: true,
          // Inizio pianificato nella timeline (drag della barra ricetta)
          cookStartAt: true,
          recipe: {
            select: {
              id: true,
              name: true,
              photo: true,
              cookCount: true,
              quick: true,
              prep: true,
              cook: true,
              steps: { select: { id: true, text: true, mins: true, kind: true, order: true }, orderBy: { order: "asc" } },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!menu) notFound();

  const recipes = menu.recipes.map((mr) => ({
    ...mr.recipe,
    cookStartAt: mr.cookStartAt ? mr.cookStartAt.toISOString() : null,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/menu/${menu.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-950 [text-shadow:0_1px_3px_rgba(255,255,255,0.6)] hover:opacity-70 transition-opacity"
      >
        <ArrowLeft size={16} /> {menu.name}
      </Link>

      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-orange-500/30">
          <ChefHat size={20} />
        </span>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-sky-50 leading-tight">Modalità cucina</h1>
          <p className="text-xs text-sky-300/60">Segui la procedura di ogni ricetta passo dopo passo</p>
        </div>
      </div>

      <CookPlanner
        menuId={menu.id}
        date={menu.date ? menu.date.toISOString() : null}
        servingTime={menu.servingTime}
        recipes={recipes}
      />
    </div>
  );
}
