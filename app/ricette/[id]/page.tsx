import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { flattenRecipe } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { ReviewSection } from "@/components/recipe/ReviewSection";
import { RecipeActions } from "./RecipeActions";
import { formatMinutes } from "@/lib/types";
import type { Metadata } from "next";

export async function generateMetadata({ params }: PageProps<"/ricette/[id]">): Promise<Metadata> {
  const { id } = await params;
  const recipe = await db.recipe.findUnique({ where: { id: Number(id) }, select: { name: true } });
  return { title: recipe ? `${recipe.name} — Ricettario` : "Ricetta non trovata" };
}

export default async function RecipePage({ params }: PageProps<"/ricette/[id]">) {
  const { id } = await params;

  const raw = await db.recipe.findUnique({
    where: { id: Number(id) },
    select: {
      id: true, name: true, servings: true, prep: true, cook: true,
      notes: true, links: true, photo: true, cookCount: true,
      createdAt: true, updatedAt: true,
      categories: { select: { category: { select: { id: true, name: true, color: true } } } },
      tags: { select: { tag: { select: { id: true, name: true } } } },
      photos: { select: { id: true, url: true, order: true }, orderBy: { order: "asc" } },
      ingredients: { select: { id: true, name: true, qty: true, unit: true, order: true }, orderBy: { order: "asc" } },
      steps: { select: { id: true, text: true, mins: true, order: true }, orderBy: { order: "asc" } },
      reviews: { select: { id: true, nickname: true, rating: true, comment: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { reviews: true } },
    },
  });

  if (!raw) notFound();
  const recipe = flattenRecipe(raw) as ReturnType<typeof flattenRecipe> & typeof raw;

  const totalTime = (recipe.prep ?? 0) + (recipe.cook ?? 0);
  const allPhotos = recipe.photo
    ? [recipe.photo, ...recipe.photos.map((p: { url: string }) => p.url).filter((u: string) => u !== recipe.photo)]
    : recipe.photos.map((p: { url: string }) => p.url);

  return (
    <article className="mx-auto max-w-4xl space-y-10">
      {/* Back */}
      <Link href="/" className="flex items-center gap-1 text-sm text-gray-400 hover:text-orange-500 transition-colors">
        ← Tutte le ricette
      </Link>

      {/* Header */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-orange-50">
          {allPhotos.length > 0 ? (
            <Image src={allPhotos[0]} alt={recipe.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl">🍽️</div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {recipe.categories.map((c: { id: number; name: string; color: string }) => (
                <Badge key={c.id} label={c.name} color={c.color} />
              ))}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{recipe.name}</h1>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recipe.prep && (
              <div className="rounded-xl bg-white border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Preparazione</p>
                <p className="font-semibold text-gray-800 text-sm">{formatMinutes(recipe.prep)}</p>
              </div>
            )}
            {recipe.cook && recipe.cook > 0 && (
              <div className="rounded-xl bg-white border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Cottura</p>
                <p className="font-semibold text-gray-800 text-sm">{formatMinutes(recipe.cook)}</p>
              </div>
            )}
            {totalTime > 0 && (
              <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
                <p className="text-xs text-orange-400 mb-1">Totale</p>
                <p className="font-semibold text-orange-600 text-sm">{formatMinutes(totalTime)}</p>
              </div>
            )}
            {recipe.servings && (
              <div className="rounded-xl bg-white border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Porzioni</p>
                <p className="font-semibold text-gray-800 text-sm">{recipe.servings} pers.</p>
              </div>
            )}
          </div>

          {recipe.notes && (
            <p className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800 leading-relaxed">
              📝 {recipe.notes}
            </p>
          )}

          {recipe.links && (
            <a href={recipe.links} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-orange-500 hover:underline">
              🔗 Fonte / Ricetta originale
            </a>
          )}

          {/* Admin actions */}
          <RecipeActions recipeId={recipe.id} cookCount={recipe.cookCount} />
        </div>
      </div>

      {/* Ingredienti + Passi */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Ingredienti */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Ingredienti</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing: { id: number; qty: number | null; unit: string | null; name: string }) => (
              <li key={ing.id} className="flex items-baseline gap-2 border-b border-gray-50 pb-2 last:border-0">
                <span className="shrink-0 font-medium text-orange-500 text-sm min-w-[60px]">
                  {ing.qty ? `${ing.qty}${ing.unit ? ` ${ing.unit}` : ""}` : ing.unit ? ing.unit : "q.b."}
                </span>
                <span className="text-gray-700 text-sm">{ing.name}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Procedura */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Procedura</h2>
          <ol className="space-y-4">
            {recipe.steps.map((step: { id: number; text: string; mins: number | null; order: number }, i: number) => (
              <li key={step.id} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 leading-relaxed">{step.text}</p>
                  {step.mins && step.mins > 0 && (
                    <p className="mt-1 text-xs text-gray-400">⏱ {formatMinutes(step.mins)}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Altre foto */}
      {allPhotos.length > 1 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Foto</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {allPhotos.slice(1).map((url: string, i: number) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                <Image src={url} alt={`${recipe.name} foto ${i + 2}`} fill className="object-cover" sizes="33vw" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recensioni */}
      <ReviewSection recipeId={recipe.id} initialReviews={recipe.reviews} />
    </article>
  );
}

