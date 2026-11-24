"use client";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Clock, EyeOff, Users } from "lucide-react";
import { type RecipeSummary, formatServings } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import { CookingButton } from "@/components/cooking/CookingButton";
import { An10Logo } from "@/components/brand/An10Logo";
import { PotIcon } from "@/components/icons";
import { pressCls, useCardInfo } from "./card-info";
import { RatingMedal } from "./RatingMedal";

/**
 * 8.10 · riga ricetta «Carta» (vista a lista: libreria, preferiti). Come la carta di un ristorante:
 * a sinistra il piatto (foto tonda con il bordo, gemella della card 8.1) con la medaglia 6.11 del
 * voto ospiti in basso a destra, poi il nome e i puntini di guida che portano a pentola e cuore.
 * Sotto: categoria, tempo (ambra), porzioni, cotture, numero di voti, il mio voto (indaco).
 * Non pronta (solo admin): testo più chiaro (tinte, non opacità: nome grigio, dettagli grigio chiaro,
 * tempo e mio voto senza colore), piatto sbiadito e mini-timbro tratteggiato con l'occhio barrato.
 * Ogni ricetta è a sé, **senza scheda**: appoggiata sul fondo pagina e separata dallo spazio
 * (`CollectionBody` con `list="stack"`); il foglio unico la faceva sembrare un gruppo.
 * È un `@container/row`: da 26rem porzioni e cotture, da 30rem il numero di voti, da 34rem piatto e nome più grandi.
 */
export function RecipeRow({ recipe }: { recipe: RecipeSummary }) {
  const c = useCardInfo(recipe);

  return (
    <Link
      href={`/ricette/${recipe.id}`}
      className={clsx(
        "group @container/row flex min-w-0 items-center gap-3 rounded-ctl px-1 py-1.5 hover:bg-blu-100",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35",
        pressCls
      )}
    >
      {/* il piatto, con la medaglia del voto sul bordo */}
      <span className="relative shrink-0">
      <span
        className={clsx(
          "relative block size-14 overflow-hidden rounded-full bg-white @min-[34rem]/row:size-16",
          "shadow-[0_0_0_3px_white,0_0_0_4px_var(--color-blu-150),0_6px_12px_-4px_oklch(25%_0.038_228/.3)]",
          "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[8deg] motion-reduce:transition-none",
          c.hidden && "opacity-60 saturate-50"
        )}
      >
        {recipe.photo ? (
          <Image src={recipe.photo} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-blu-800">
            <An10Logo variant="simbolo" title="" className="w-1/2" />
          </span>
        )}
      </span>
      {/* non pronta (solo admin): mini-timbro sul bordo del piatto, dal lato opposto alla medaglia
          (la scritta intera non ci sta; nella riga dei dettagli manderebbe il testo a capo) */}
      {c.hidden && (
        <span
          role="img"
          aria-label="Non pronta"
          title="Non pronta"
          className="absolute -top-1 -left-1.5 flex size-[1.625rem] items-center justify-center rounded-full border-2 border-dashed border-grigio bg-white text-grigio shadow-[0_2px_5px_oklch(25%_0.038_228/.2)]"
        >
          <EyeOff className="size-3.5" aria-hidden />
        </span>
      )}
      {c.guest && (
        <RatingMedal
          value={c.guest.value}
          count={c.guest.count}
          className="absolute -right-2 -bottom-1.5 w-[1.875rem] text-[0.6875rem] @min-[34rem]/row:w-[2.125rem] @min-[34rem]/row:text-[0.75rem]"
        />
      )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        {/* nome · · · · · pentola e cuore */}
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={clsx(
              "line-clamp-2 min-w-0 text-[1rem] leading-tight font-extrabold group-hover:text-blu-700 @min-[34rem]/row:text-[1.125rem]",
              c.hidden ? "text-grigio" : "text-blu-950"
            )}
          >
            {recipe.name}
          </span>
          <span aria-hidden className="min-w-4 flex-1 border-b-2 border-dotted border-blu-250" />
          <span className="flex shrink-0 gap-1.5 [&>button]:ring-1 [&>button]:ring-blu-150">
            <CookingButton recipeId={recipe.id} />
            <FavoriteButton recipeId={recipe.id} />
          </span>
        </span>

        {/* dettagli */}
        <span className="flex min-w-0 items-center gap-2">
          <span className={clsx("flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs", c.hidden ? "text-grigio-chiaro" : "text-grigio")}>
            {c.cat && (
              <span className="flex min-w-0 items-center gap-1.5">
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: c.cat.color }} />
                <span className="truncate">{c.cat.name}</span>
              </span>
            )}
            {c.time && (
              <span className={clsx("tabular flex items-center gap-1 font-semibold whitespace-nowrap", !c.hidden && "text-ambra")}>
                <Clock className="size-3.5 shrink-0" aria-hidden /> {c.time}
              </span>
            )}
            {recipe.servings && (
              <span className="hidden min-w-0 items-center gap-1 @min-[26rem]/row:flex">
                <Users className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">
                  {recipe.servingsUnit ? formatServings(recipe.servings, recipe.servingsUnit) : `${recipe.servings}p`}
                </span>
              </span>
            )}
            {c.isAdmin && recipe.cookCount > 0 && (
              <span className="tabular hidden items-center gap-1 @min-[26rem]/row:flex">
                <PotIcon className="size-3.5 shrink-0" aria-hidden /> ×{recipe.cookCount}
              </span>
            )}
            {c.guest && (
              <span className="tabular hidden @min-[30rem]/row:inline">
                {c.guest.count} {c.guest.count === 1 ? "voto" : "voti"}
              </span>
            )}
            {c.mine != null && <span className={clsx("tabular font-bold", !c.hidden && "text-mio-ink")}>mio {c.mine}</span>}
          </span>
        </span>
      </span>
    </Link>
  );
}
