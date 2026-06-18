import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Clock, Flame, Hourglass, Users, ExternalLink, CalendarDays, ImageIcon } from "lucide-react";
import { db } from "@/lib/db";
import { flattenRecipe } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ReviewSection } from "@/components/recipe/ReviewSection";
import { RecipeProcedure } from "@/components/recipe/RecipeProcedure";
import { FavoriteButton } from "@/components/recipe/FavoriteButton";
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
      ingredients: { select: { id: true, name: true, qty: true, unit: true, description: true, order: true }, orderBy: { order: "asc" } },
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
    <article className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
      {/* Back */}
      <Link href="/ricette" className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-950 [text-shadow:0_1px_3px_rgba(255,255,255,0.6)] hover:opacity-70 transition-opacity">
        <ArrowLeft size={16} /> Tutte le ricette
      </Link>

      {/* Header */}
      <div className="fade-up grid gap-6 lg:grid-cols-2 lg:gap-8" style={{ animationDelay: "0ms" }}>
        {/* Photo — slim su mobile, quadrata su desktop */}
        <div className="relative aspect-video sm:aspect-4/3 overflow-hidden rounded-2xl bg-white/20 backdrop-blur-sm">
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
            <h1 className="text-2xl sm:text-3xl font-bold text-sky-950 leading-tight">{recipe.name}</h1>
          </div>

          {/* Meta grid — 2 col mobile, 4 col sm+ */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {recipe.prep && (
              <MetaTile icon={<Clock size={16} />} label="Preparazione" value={formatMinutes(recipe.prep)} />
            )}
            {recipe.cook && recipe.cook > 0 && (
              <MetaTile icon={<Flame size={16} />} label="Cottura" value={formatMinutes(recipe.cook)} />
            )}
            {totalTime > 0 && (
              <MetaTile icon={<Hourglass size={16} />} label="Totale" value={formatMinutes(totalTime)} accent />
            )}
            {recipe.servings && (
              <MetaTile icon={<Users size={16} />} label="Porzioni" value={`${recipe.servings} pers.`} />
            )}
          </div>

          {recipe.notes && (
            <p className="rounded-xl bg-amber-100/60 border border-amber-200/50 backdrop-blur-sm px-4 py-3 text-sm text-amber-900 leading-relaxed">
              📝 {recipe.notes}
            </p>
          )}

          {recipe.links && (
            <a href={recipe.links} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:underline">
              <ExternalLink size={15} /> Fonte / Ricetta originale
            </a>
          )}

          {/* Data aggiunta */}
          <p className="inline-flex items-center gap-1.5 text-xs text-sky-700/60">
            <CalendarDays size={13} /> Aggiunta il{" "}
            {new Date(recipe.createdAt ?? "2020-01-01").toLocaleDateString("it-IT", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <FavoriteButton recipeId={recipe.id} variant="detail" />

          {/* Admin actions */}
          <RecipeActions recipeId={recipe.id} cookCount={recipe.cookCount} />
        </div>
      </div>

      {/* Ingredienti compatti + Procedura interattiva */}
      <div className="fade-up" style={{ animationDelay: "80ms" }}>
        <RecipeProcedure
          recipeId={recipe.id}
          defaultServings={recipe.servings ?? null}
          ingredients={recipe.ingredients}
          steps={recipe.steps}
        />
      </div>

      {/* Altre foto */}
      {allPhotos.length > 1 && (
        <section className="fade-up" style={{ animationDelay: "160ms" }}>
          <SectionHeader title="Foto" icon={<ImageIcon size={20} />} tone="violet" size="lg" className="mb-4" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {allPhotos.slice(1).map((url: string, i: number) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-white/20 transition-transform duration-300 hover:scale-[1.02]">
                <Image src={url} alt={`${recipe.name} foto ${i + 2}`} fill className="object-cover" sizes="33vw" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recensioni */}
      <div className="fade-up" style={{ animationDelay: "240ms" }}>
        <ReviewSection recipeId={recipe.id} initialReviews={recipe.reviews} />
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Tile meta (tempo prep/cottura/totale/porzioni) — vetro con icona
// ---------------------------------------------------------------------------
function MetaTile({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center backdrop-blur-sm ${
        accent
          ? "border-orange-300/40 bg-orange-400/20"
          : "border-white/40 bg-white/50"
      }`}
    >
      <span className={accent ? "text-orange-600" : "text-sky-500"}>{icon}</span>
      <p className={`text-[11px] ${accent ? "text-orange-600" : "text-sky-600"}`}>{label}</p>
      <p className={`text-sm font-semibold ${accent ? "text-orange-700" : "text-sky-950"}`}>{value}</p>
    </div>
  );
}
