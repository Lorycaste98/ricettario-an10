import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/ds/PageHeader";
import { PotIcon } from "@/components/icons";
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
                  // Ingredienti necessari al passo (+ quantità usata in quel passo):
                  // mostrati sulla card dello step corrente
                  ingredients: { select: { ingredientId: true, qty: true } },
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
    const scale = (qty: number | null) => (qty != null ? Math.round(qty * factor * 100) / 100 : null);
    return {
      ...mr.recipe,
      ingredients: mr.recipe.ingredients.map((i) => ({ ...i, qty: scale(i.qty) })),
      steps: mr.recipe.steps.map(({ ingredients, ...s }) => ({
        ...s,
        // Anche le quantità del singolo passo vanno scalate, non solo i totali:
        // altrimenti il passo dichiara grammi non scalati mentre la lista spesa sì
        stepIngredients: ingredients.map((si) => ({
          ingredientId: si.ingredientId,
          qty: scale(si.qty),
        })),
      })),
      cookStartAt: mr.cookStartAt ? mr.cookStartAt.toISOString() : null,
    };
  });

  const serveLabel = menu.date
    ? [
        new Date(menu.date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long" }),
        menu.servingTime ? `servizio alle ${menu.servingTime}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        back={<BackLink href={`/menu/${menu.id}`} label={menu.name} />}
        thumb={
          <div className="flex size-full items-center justify-center bg-arancio-50 text-arancio-scuro [&>svg]:size-3/5">
            <PotIcon />
          </div>
        }
        title="Modalità cucina"
        meta={[menu.name, serveLabel].filter(Boolean).join(" · ")}
      />

      <CookPlanner
        menuId={menu.id}
        date={menu.date ? menu.date.toISOString() : null}
        servingTime={menu.servingTime}
        recipes={recipes}
      />
    </div>
  );
}
