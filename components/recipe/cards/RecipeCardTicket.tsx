"use client";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Clock } from "lucide-react";
import type { RecipeSummary } from "@/lib/types";
import { FavoriteButton } from "../FavoriteButton";
import { CookingButton } from "@/components/cooking/CookingButton";
import { NoPhoto } from "../NoPhoto";
import { HiddenTag } from "@/components/ds/Tag";
import { PotIcon } from "@/components/icons";
import { pressCls, useCardInfo } from "./shared";

/**
 * PROPOSTA 1 · «Comanda». La card è lo scontrino del pass di cucina: foto in alto, poi la
 * perforazione (tacche ai lati + tratteggio) e sotto la parte scritta. In testa la categoria come
 * intestazione, il nome grande, in fondo il tempo in ambra (giallo = tempo) e il voto ospiti come
 * numero grande «9.1» con «/10 · 4 voti», come il totale di una comanda.
 * Le tacche sono cerchi del colore del fondo pagina (`blu-50`): funziona solo su quel fondo.
 */
export function RecipeCardTicket({ recipe }: { recipe: RecipeSummary }) {
  const c = useCardInfo(recipe);
  return (
    <Link
      href={`/ricette/${recipe.id}`}
      className={clsx(
        "group @container/card relative flex min-w-0 flex-col rounded-card border border-blu-150 bg-white",
        "hover:-translate-y-0.5 hover:shadow-[0_10px_24px_oklch(25%_0.038_228/.12)]",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35",
        pressCls,
        c.hidden && "border-dashed"
      )}
    >
      <div className={clsx("relative aspect-[4/3] overflow-hidden rounded-t-[calc(var(--radius-card)-1px)]", c.hidden && "opacity-60 saturate-50")}>
        {recipe.photo ? (
          <Image src={recipe.photo} alt="" fill sizes="(max-width: 700px) 50vw, 25vw" className="object-cover" />
        ) : (
          <NoPhoto />
        )}
        <div className="absolute top-1.5 right-1.5 flex gap-1 @min-[9rem]/card:top-2 @min-[9rem]/card:right-2">
          <span className="hidden @min-[9rem]/card:contents">
            <CookingButton recipeId={recipe.id} />
          </span>
          <FavoriteButton recipeId={recipe.id} />
        </div>
        {c.hidden && (
          <div className="absolute top-2 left-2">
            <HiddenTag />
          </div>
        )}
      </div>

      {/* perforazione: due tacche e il tratteggio */}
      <div aria-hidden className="relative h-0">
        <span className="absolute -top-[0.45rem] -left-[0.5rem] size-[0.9rem] rounded-full border border-blu-150 bg-blu-50 [clip-path:inset(0_0_0_50%)]" />
        <span className="absolute -top-[0.45rem] -right-[0.5rem] size-[0.9rem] rounded-full border border-blu-150 bg-blu-50 [clip-path:inset(0_50%_0_0)]" />
        <span className="absolute inset-x-3 top-0 border-t-2 border-dashed border-blu-150" />
      </div>

      <div className="flex flex-1 flex-col gap-1 px-[0.6em] pt-[0.7em] pb-[0.6em] @min-[11rem]/card:px-[0.85em] @min-[11rem]/card:pt-[0.85em] @min-[11rem]/card:pb-[0.75em]">
        {c.cat && (
          <span className="flex min-w-0 items-center gap-1.5 text-[0.625rem] font-bold tracking-[0.12em] text-grigio uppercase @min-[11rem]/card:text-[0.6875rem]">
            <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: c.cat.color }} />
            <span className="truncate">{c.cat.name}</span>
          </span>
        )}
        <h3 className="line-clamp-2 text-[0.8125rem] leading-tight font-extrabold text-blu-950 @min-[11rem]/card:text-[1.0625rem] @min-[18rem]/card:text-[1.25rem]">
          {recipe.name}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <span className="flex min-w-0 flex-col gap-0.5 text-[0.6875rem] @min-[11rem]/card:text-xs">
            {c.time && (
              <span className="tabular flex items-center gap-1 font-bold whitespace-nowrap text-ambra">
                <Clock className="size-3.5 shrink-0" aria-hidden /> {c.time}
              </span>
            )}
            {c.isAdmin && recipe.cookCount > 0 && (
              <span className="tabular hidden items-center gap-1 text-grigio @min-[11rem]/card:flex">
                <PotIcon className="size-3.5 shrink-0" aria-hidden /> cucinata {recipe.cookCount}×
              </span>
            )}
          </span>
          {c.guest ? (
            <span className="flex shrink-0 flex-col items-end leading-none" title={`Media ${c.guest.value.toFixed(1)} su ${c.guest.count} recensioni`}>
              <span className="tabular text-[1.125rem] font-extrabold text-blu-800 @min-[11rem]/card:text-[1.625rem]">
                {c.guest.value.toFixed(1)}
              </span>
              <span className="tabular hidden text-[0.625rem] font-semibold text-grigio @min-[11rem]/card:block">
                /10 · {c.guest.count} {c.guest.count === 1 ? "voto" : "voti"}
              </span>
            </span>
          ) : c.mine != null ? (
            <span className="tabular shrink-0 text-[1.125rem] font-extrabold text-mio-ink @min-[11rem]/card:text-[1.625rem]" title="Il mio voto">
              {c.mine}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
