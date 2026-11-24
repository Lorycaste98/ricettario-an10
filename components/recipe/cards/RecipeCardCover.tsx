"use client";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Clock } from "lucide-react";
import type { RecipeSummary } from "@/lib/types";
import { FavoriteButton } from "../FavoriteButton";
import { CookingButton } from "@/components/cooking/CookingButton";
import { An10Logo } from "@/components/brand/An10Logo";
import { HiddenTag } from "@/components/ds/Tag";
import { pressCls, useCardInfo } from "./shared";

/**
 * PROPOSTA 3 · «Copertina». Foto grande e verticale (4:5) che occupa tutta la card; il nome sta su
 * un'**etichetta bianca piena** incollata in basso a sinistra, come quella di un barattolo di
 * dispensa (niente sfumature scure sopra la foto, il testo resta su bianco pieno). Il voto ospiti
 * è un quadrato blu scuro in alto a sinistra con il numero grande. Senza foto: blu pieno con il
 * «10» grande e tagliato fuori dal bordo, come una grafica di copertina.
 * Al passaggio del mouse la foto si avvicina appena e l'etichetta sale di 2px.
 */
export function RecipeCardCover({ recipe }: { recipe: RecipeSummary }) {
  const c = useCardInfo(recipe);
  return (
    <Link
      href={`/ricette/${recipe.id}`}
      className={clsx(
        "group @container/card relative isolate flex aspect-[4/5] min-w-0 overflow-hidden rounded-card bg-blu-800",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35",
        pressCls,
        c.hidden && "outline-2 outline-offset-[-2px] outline-blu-250 outline-dashed"
      )}
    >
      <div className={clsx("absolute inset-0 -z-10", c.hidden && "opacity-60 saturate-50")}>
        {recipe.photo ? (
          <Image
            src={recipe.photo}
            alt=""
            fill
            sizes="(max-width: 700px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex size-full items-start justify-end overflow-hidden text-blu-700">
            <An10Logo variant="simbolo" title="" className="mt-[6%] -mr-[22%] w-[115%] shrink-0" />
          </div>
        )}
      </div>

      <div className="absolute top-1.5 right-1.5 flex gap-1 @min-[9rem]/card:top-2 @min-[9rem]/card:right-2">
        <span className="hidden @min-[9rem]/card:contents">
          <CookingButton recipeId={recipe.id} />
        </span>
        <FavoriteButton recipeId={recipe.id} />
      </div>

      {(c.guest || c.hidden) && (
        <div className="absolute top-0 left-0 flex flex-col items-start gap-1">
          {c.guest && (
            <span
              className="tabular flex flex-col items-center rounded-br-[0.75rem] bg-blu-800 px-[0.55em] py-[0.35em] leading-none text-white"
              title={`Media ${c.guest.value.toFixed(1)} su ${c.guest.count} recensioni`}
            >
              <span className="text-[0.9375rem] font-extrabold @min-[11rem]/card:text-[1.375rem]">{c.guest.value.toFixed(1)}</span>
              <span className="hidden text-[0.5625rem] font-semibold text-nav-ink @min-[11rem]/card:block">
                {c.guest.count} {c.guest.count === 1 ? "voto" : "voti"}
              </span>
            </span>
          )}
          {c.hidden && (
            <span className="ml-2">
              <HiddenTag />
            </span>
          )}
        </div>
      )}

      {/* etichetta */}
      <div
        className={clsx(
          "absolute right-[12%] bottom-0 left-0 flex flex-col gap-1 rounded-tr-[0.875rem] bg-white px-[0.6em] pt-[0.55em] pb-[0.6em]",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 motion-reduce:transition-none",
          "@min-[11rem]/card:px-[0.85em] @min-[11rem]/card:pt-[0.75em] @min-[11rem]/card:pb-[0.8em]"
        )}
      >
        <h3 className="line-clamp-2 text-[0.8125rem] leading-tight font-extrabold text-blu-950 @min-[11rem]/card:text-[1.0625rem] @min-[18rem]/card:text-[1.25rem]">
          {recipe.name}
        </h3>
        <span className="flex min-w-0 items-center gap-x-2 text-[0.6875rem] text-grigio @min-[11rem]/card:text-xs">
          {c.cat && (
            <span className="flex min-w-0 items-center gap-1">
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: c.cat.color }} />
              <span className="hidden truncate @min-[14rem]/card:inline">{c.cat.name}</span>
            </span>
          )}
          {c.time && (
            <span className="tabular flex items-center gap-1 whitespace-nowrap">
              <Clock className="size-3.5 shrink-0" aria-hidden /> {c.time}
            </span>
          )}
          {c.mine != null && <span className="tabular hidden font-bold text-mio-ink @min-[11rem]/card:inline">mio {c.mine}</span>}
        </span>
      </div>
    </Link>
  );
}
