"use client";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Clock, Users } from "lucide-react";
import { type RecipeSummary, formatServings } from "@/lib/types";
import { FavoriteButton } from "../FavoriteButton";
import { CookingButton } from "@/components/cooking/CookingButton";
import { An10Logo } from "@/components/brand/An10Logo";
import { HiddenTag } from "@/components/ds/Tag";
import { PotIcon } from "@/components/icons";
import { pressCls, useCardInfo } from "./shared";

/**
 * PROPOSTA LISTA · «Carta». La vista a lista come la carta di un ristorante: a sinistra il piatto
 * (foto tonda con il bordo, gemella della card «Piatto»), il nome, i puntini di guida e — dove
 * starebbe il prezzo — il voto ospiti in grande (il mio voto in indaco se non ci sono voti
 * ospiti). Sotto, categoria, tempo (ambra), porzioni e cotture; pentola e cuore in fondo a destra.
 * Va dentro un foglio bianco (`CartaSheet`) senza filetti fra le righe: è il ritmo dei puntini a
 * separarle. Da 34rem di riga il piatto cresce e il nome passa a 1.125rem.
 */
export function RecipeRowCarta({ recipe }: { recipe: RecipeSummary }) {
  const c = useCardInfo(recipe);
  const score = c.guest ? c.guest.value.toFixed(1) : c.mine != null ? String(c.mine) : null;

  return (
    <Link
      href={`/ricette/${recipe.id}`}
      className={clsx(
        "group @container/row flex min-w-0 items-center gap-3 rounded-ctl px-2 py-2 hover:bg-blu-50",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35",
        pressCls
      )}
    >
      {/* il piatto */}
      <span
        className={clsx(
          "relative size-14 shrink-0 overflow-hidden rounded-full bg-white @min-[34rem]/row:size-16",
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

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        {/* nome · · · · · voto */}
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="line-clamp-2 min-w-0 text-[1rem] leading-tight font-extrabold text-blu-950 group-hover:text-blu-700 @min-[34rem]/row:text-[1.125rem]">
            {recipe.name}
          </span>
          <span aria-hidden className="mb-[0.3em] min-w-4 flex-1 border-b-2 border-dotted border-blu-250" />
          {score ? (
            <span
              className={clsx(
                "tabular shrink-0 text-[1.375rem] leading-none font-extrabold @min-[34rem]/row:text-[1.625rem]",
                c.guest ? "text-blu-800" : "text-mio-ink"
              )}
              title={c.guest ? `Media ${score} su ${c.guest.count} recensioni` : "Il mio voto"}
            >
              {score}
            </span>
          ) : (
            <span className="shrink-0 text-[0.75rem] font-semibold text-grigio-chiaro">da provare</span>
          )}
        </span>

        {/* dettagli · · · pentola e cuore */}
        <span className="flex min-w-0 items-center justify-between gap-2">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-grigio">
            {c.hidden && <HiddenTag />}
            {c.cat && (
              <span className="flex min-w-0 items-center gap-1.5">
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: c.cat.color }} />
                <span className="truncate">{c.cat.name}</span>
              </span>
            )}
            {c.time && (
              <span className="tabular flex items-center gap-1 font-semibold whitespace-nowrap text-ambra">
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
          </span>
          <span className="flex shrink-0 gap-1.5 [&>button]:ring-1 [&>button]:ring-blu-150">
            <CookingButton recipeId={recipe.id} />
            <FavoriteButton recipeId={recipe.id} />
          </span>
        </span>
      </span>
    </Link>
  );
}

/** Foglio bianco della «Carta»: niente filetti, righe distanziate, un filo di margine interno. */
export function CartaSheet({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1 rounded-card border border-blu-150 bg-white p-1.5 @min-[620px]:p-2.5">{children}</div>;
}
