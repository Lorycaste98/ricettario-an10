import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { RecipeForm, type RecipeFormData } from "@/components/recipe/RecipeForm";
import { flattenRecipe } from "@/lib/api";
import { toStepKind } from "@/lib/types";
import type { Metadata } from "next";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const r = await db.recipe.findUnique({ where: { id: Number(id) }, select: { name: true } });
  return { title: r ? `Modifica: ${r.name} — Ricettario` : "Ricetta non trovata" };
}

export default async function ModificaRicettaPage({ params }: { params: Promise<Params> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const recipeId = Number(id);

  const [raw, categories, tags] = await Promise.all([
    db.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true, name: true, servings: true, servingsUnit: true, prep: true, cook: true,
        notes: true, links: true, photo: true, published: true, cookCount: true, createdAt: true, updatedAt: true,
        categories: { select: { category: { select: { id: true, name: true, color: true } } } },
        tags: { select: { tag: { select: { id: true, name: true } } } },
        photos: { select: { id: true, url: true, order: true }, orderBy: { order: "asc" } },
        ingredients: { select: { id: true, name: true, qty: true, unit: true, description: true, optional: true, order: true }, orderBy: { order: "asc" } },
        steps: { select: { id: true, text: true, mins: true, kind: true, order: true }, orderBy: { order: "asc" } },
        _count: { select: { reviews: true } },
      },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!raw) notFound();

  const recipe = flattenRecipe(raw) as ReturnType<typeof flattenRecipe> & typeof raw;

  const initialData: RecipeFormData = {
    name: recipe.name,
    // createdAt salvato a mezzogiorno UTC: i componenti UTC danno la stessa data scelta
    createdAt: recipe.createdAt.toISOString().slice(0, 10),
    servings: recipe.servings != null ? String(recipe.servings) : "",
    servingsUnit: recipe.servingsUnit ?? "",
    prep: recipe.prep != null ? String(recipe.prep) : "",
    cook: recipe.cook != null ? String(recipe.cook) : "",
    notes: recipe.notes ?? "",
    links: recipe.links ?? "",
    photo: recipe.photo ?? "",
    published: recipe.published,
    categoryIds: recipe.categories.map((c: { id: number }) => c.id),
    tagIds: recipe.tags.map((t: { id: number }) => t.id),
    ingredients: recipe.ingredients.map((i: { name: string; qty: number | null; unit: string | null; description: string | null; optional: boolean }) => ({
      name: i.name,
      qty: i.qty != null ? String(i.qty) : "",
      unit: i.unit ?? "",
      description: i.description ?? "",
      optional: i.optional,
    })),
    steps: recipe.steps.map((s: { text: string; mins: number | null; kind: string }) => ({
      text: s.text,
      mins: s.mins != null ? String(s.mins) : "",
      kind: toStepKind(s.kind),
    })),
    photos: recipe.photos.map((p: { url: string }) => ({ url: p.url })),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <RecipeForm recipeId={recipeId} categories={categories} tags={tags} initialData={initialData} />
    </div>
  );
}


