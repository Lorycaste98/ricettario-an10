"use client";
import Link from "next/link";
import Image from "next/image";
import { EyeOff, Star, CookingPot, Clock, Users } from "lucide-react";
import { type RecipeSummary, formatMinutes, formatServings } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import { useAuth } from "@/components/AuthProvider";

/** Pill voto (oro) — elemento in evidenza, coerente con l'ordinamento per valutazione. */
function RatingPill({ avg, count }: { avg: number; count: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-400/20 px-1.5 py-0.5 text-amber-300 shadow-sm">
      <Star size={11} className="fill-current" />
      <span className="text-xs font-bold leading-none">{avg.toFixed(1)}</span>
      <span className="text-[10px] leading-none text-amber-200/70">({count})</span>
    </span>
  );
}

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const { isAdmin } = useAuth();
  const totalTime = (recipe.prep ?? 0) + (recipe.cook ?? 0);
  const primaryCat = recipe.categories[0];
  const hasRating = recipe._count.reviews > 0 && recipe.avgRating !== null;
  const hasMeta = totalTime > 0 || !!recipe.servings || (isAdmin && recipe.cookCount > 0);
  // Solo gli admin vedono le ricette non pronte (offuscate, con badge)
  const isHidden = isAdmin && !recipe.published;

  return (
    <Link
      href={`/ricette/${recipe.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-zinc-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${
        isHidden ? "opacity-55 hover:opacity-100 ring-1 ring-dashed ring-white/30" : ""
      }`}
    >
      {/* Image area — l'aspect ratio fisso rende tutte le card della stessa altezza */}
      <div className="relative aspect-4/3 overflow-hidden">
        {recipe.photo ? (
          <Image
            src={recipe.photo}
            alt={recipe.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-800">
            <Image src="/an10.webp" alt="AN10" width={56} height={56} className="opacity-60 rounded-xl" />
          </div>
        )}

        {/* Sottile sfumatura in alto per la leggibilità dei badge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/45 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {primaryCat && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white shadow backdrop-blur-sm"
                style={{ backgroundColor: primaryCat.color + "cc" }}
              >
                {primaryCat.name}
              </span>
            )}
            {isHidden && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow backdrop-blur-sm">
                <EyeOff size={10} /> Non pronta
              </span>
            )}
          </div>

          <FavoriteButton recipeId={recipe.id} />
        </div>

        {/* Pannello info frosted: sopra la foto, ma la foto resta visibile (blur) */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 border-t border-white/10 bg-black/30 px-2.5 py-2 backdrop-blur-md sm:px-3">
          <div className="flex items-start justify-between gap-2">
            <h3
              title={recipe.name}
              className="min-h-[2.75em] text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow group-hover:text-orange-300 transition-colors"
            >
              {recipe.name}
            </h3>
            {hasRating && <RatingPill avg={recipe.avgRating!} count={recipe._count.reviews} />}
          </div>

          {hasMeta && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] sm:text-[11px] text-white/85">
              {totalTime > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={12} className="shrink-0" /> {formatMinutes(totalTime)}
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1">
                  <Users size={12} className="shrink-0" />
                  <span className="truncate max-w-28">
                    {recipe.servingsUnit
                      ? formatServings(recipe.servings, recipe.servingsUnit)
                      : `${recipe.servings}p`}
                  </span>
                </span>
              )}
              {isAdmin && recipe.cookCount > 0 && (
                <span className="flex items-center gap-1">
                  <CookingPot size={12} className="shrink-0" /> ×{recipe.cookCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
