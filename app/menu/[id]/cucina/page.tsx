import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ChefHat } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
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
          // Porzioni del menù (override): scalano le quantità mostrate sugli step
          servings: true,
          recipe: {
            select: {
              id: true,
              name: true,
              photo: true,
              cookCount: true,
              quick: true,
              prep: true,
              cook: true,
              servings: true,
              ingredients: {
                select: { id: true, name: true, qty: true, unit: true, optional: true },
                orderBy: { order: "asc" },
              },
              steps: {
                select: {
                  id: true, text: true, mins: true, kind: true, order: true,
                  // Ingredienti necessari al passo: mostrati sulla card dello step corrente
                  ingredients: { select: { ingredientId: true } },
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!menu) notFound();

  const recipes = menu.recipes.map((mr) => {
    // Stesse porzioni della lista della spesa: se il menù ne imposta di diverse
    // dal default della ricetta, le quantità degli step seguono
    const base = mr.recipe.servings;
    const factor = mr.servings && base && base > 0 ? mr.servings / base : 1;
    return {
      ...mr.recipe,
      ingredients: mr.recipe.ingredients.map((i) => ({
        ...i,
        qty: i.qty != null ? Math.round(i.qty * factor * 100) / 100 : null,
      })),
      steps: mr.recipe.steps.map(({ ingredients, ...s }) => ({
        ...s,
        ingredientIds: ingredients.map((si) => si.ingredientId),
      })),
      cookStartAt: mr.cookStartAt ? mr.cookStartAt.toISOString() : null,
    };
  });

  return (
    // Stesso ritmo verticale del dettaglio ricetta/menù (back → header → contenuto)
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-5">
      {/* Back: bottone condiviso (BackLink), identico su ricetta/menù/modalità cucina */}
      <BackLink href={`/menu/${menu.id}`} label={menu.name} />

      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-orange-500/30">
          <ChefHat size={20} />
        </span>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-sky-50 leading-tight drop-shadow">Modalità cucina</h1>
          <p className="text-xs text-sky-100">Segui la procedura di ogni ricetta passo dopo passo</p>
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
