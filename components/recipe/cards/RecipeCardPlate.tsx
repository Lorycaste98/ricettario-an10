"use client";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Clock, Star } from "lucide-react";
import type { RecipeSummary } from "@/lib/types";
import { FavoriteButton } from "../FavoriteButton";
import { CookingButton } from "@/components/cooking/CookingButton";
import { An10Logo } from "@/components/brand/An10Logo";
import { HiddenTag } from "@/components/ds/Tag";
import { pressCls, useCardInfo } from "./shared";

/**
 * PROPOSTA 2 · «Piatto». La foto è il piatto visto dall'alto: ritagliata a cerchio con il bordo
 * bianco (il bordo del piatto) e un'ombra morbida, appoggiata sulla «tovaglia» azzurra della card.
 * Il voto ospiti è una medaglia oro sul bordo del piatto. Senza foto: piatto bianco con il «10».
 * Al passaggio del mouse il piatto gira un poco, come quando lo si porta in tavola; al tocco si
 * abbassa appena.
 */
export function RecipeCardPlate({ recipe }: { recipe: RecipeSummary }) {
  const c = useCardInfo(recipe);
  return (
    <Link
      href={`/ricette/${recipe.id}`}
      className={clsx(
        "group @container/card relative flex min-w-0 flex-col items-center overflow-hidden rounded-card bg-blu-100 px-[8%] pt-[9%] pb-[0.7em] text-center",
        "hover:bg-blu-120",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35",
        pressCls,
        c.hidden && "outline-2 outline-offset-[-2px] outline-blu-250 outline-dashed"
      )}
    >
      {/* pentola e cuore nei due angoli liberi della tovaglia, ai lati del piatto */}
      <div className="absolute top-1.5 left-1.5 z-10 hidden @min-[9rem]/card:top-2 @min-[9rem]/card:left-2 @min-[9rem]/card:block">
        <CookingButton recipeId={recipe.id} />
      </div>
      <div className="absolute top-1.5 right-1.5 z-10 @min-[9rem]/card:top-2 @min-[9rem]/card:right-2">
        <FavoriteButton recipeId={recipe.id} />
      </div>
      {c.hidden && (
        <div className="absolute top-2 left-2 z-10">
          <HiddenTag />
        </div>
      )}

      {/* il piatto */}
      <div className={clsx("relative w-[76%]", c.hidden && "opacity-60 saturate-50")}>
        <div
          className={clsx(
            "relative aspect-square overflow-hidden rounded-full bg-white",
            "shadow-[0_0_0_clamp(4px,3.5cqi,9px)_white,0_10px_22px_-6px_oklch(25%_0.038_228/.35)]",
            "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[8deg] motion-reduce:transition-none"
          )}
        >
          {recipe.photo ? (
            <Image src={recipe.photo} alt="" fill sizes="(max-width: 700px) 45vw, 22vw" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-blu-800">
              <An10Logo variant="simbolo" title="" className="w-[42%]" />
            </div>
          )}
        </div>
        {c.guest && (
          <span
            className="tabular absolute -right-[4%] -bottom-[2%] flex aspect-square w-[clamp(1.9rem,26cqi,3.1rem)] flex-col items-center justify-center rounded-full bg-giallo-400 leading-none font-extrabold text-blu-950 shadow-[0_0_0_3px_white]"
            title={`Media ${c.guest.value.toFixed(1)} su ${c.guest.count} recensioni`}
          >
            <span className="text-[clamp(0.6875rem,8cqi,1rem)]">{c.guest.value.toFixed(1)}</span>
            <Star className="hidden size-[0.6rem] fill-current @min-[11rem]/card:block" aria-hidden />
          </span>
        )}
      </div>

      <h3 className="mt-[0.75em] line-clamp-2 text-[0.8125rem] leading-tight font-extrabold text-blu-950 @min-[11rem]/card:text-[1rem] @min-[18rem]/card:text-[1.1875rem]">
        {recipe.name}
      </h3>
      <span className="mt-1 flex min-w-0 items-center justify-center gap-x-2 text-[0.6875rem] text-grigio @min-[11rem]/card:text-xs">
        {c.cat && (
          <span className="flex min-w-0 items-center gap-1">
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: c.cat.color }} />
            <span className="hidden truncate @min-[13rem]/card:inline">{c.cat.name}</span>
          </span>
        )}
        {c.time && (
          <span className="tabular flex items-center gap-1 whitespace-nowrap">
            <Clock className="size-3.5 shrink-0" aria-hidden /> {c.time}
          </span>
        )}
        {c.mine != null && <span className="tabular hidden font-bold text-mio-ink @min-[11rem]/card:inline">mio {c.mine}</span>}
      </span>
    </Link>
  );
}
