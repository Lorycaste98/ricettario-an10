"use client";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Clock, Users } from "lucide-react";
import { RatingMedal } from "./RatingMedal";
import { type RecipeSummary, formatServings } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import { CookingButton } from "@/components/cooking/CookingButton";
import { An10Logo } from "@/components/brand/An10Logo";
import { PotIcon } from "@/components/icons";
import { pressCls, useCardInfo } from "./card-info";
import { useCardConfig } from "@/components/CardConfigProvider";

/**
 * 8.1 · card ricetta «Piatto» (griglia: libreria, preferiti, vetrina). La foto è il piatto visto
 * dall'alto: ritagliata a cerchio con il bordo bianco e un'ombra morbida, appoggiata sulla
 * «tovaglia» `blu-100` della card. Il voto ospiti è la medaglia 6.11 sul bordo del piatto, in basso
 * a destra. Senza foto: piatto bianco con il «10». Pentola e cuore nei due angoli della tovaglia.
 * Le non pronte (solo admin): piatto sbiadito, contorno tratteggiato della card e sopra il piatto il
 * timbro «Non pronta» (6.4 come fac-simile: riquadro tratteggiato inclinato), senza cambiare l'altezza;
 * testo schiarito con le tinte (nome `grigio`, dettagli `grigio-chiaro`), medaglia spenta e niente
 * pentola né cuore (prima la ricetta va sistemata, poi si cucina o si salva). Uguale nella riga 8.10.
 *
 * **Quali informazioni** le decide l'admin per tutti (Impostazioni → `useCardConfig`): ognuna accesa
 * si vede a ogni larghezza, la riga dei dettagli va a capo e la card si allunga. È un
 * `@container/card`: la larghezza decide solo le misure (nome e testo più grandi da 11rem e 18rem)
 * e la pentola, che sotto gli 8rem non ci sta.
 * Movimento: al tocco si abbassa appena, al mouse il piatto gira di 8°.
 */
export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const c = useCardInfo(recipe);
  const f = useCardConfig().recipe;
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
      {/* pentola e cuore nei due angoli liberi della tovaglia, ai lati del piatto; non per le non
          pronte: prima la ricetta va sistemata, poi si cucina o si salva */}
      {/* soglia 8rem: la tovaglia ha un margine interno, il contenuto è più stretto della card */}
      {!c.hidden && f.actions && (
        <>
          <div className="absolute top-1.5 left-1.5 z-10 hidden @min-[8rem]/card:top-2 @min-[8rem]/card:left-2 @min-[8rem]/card:block">
            <CookingButton recipeId={recipe.id} />
          </div>
          <div className="absolute top-1.5 right-1.5 z-10 @min-[9rem]/card:top-2 @min-[9rem]/card:right-2">
            <FavoriteButton recipeId={recipe.id} />
          </div>
        </>
      )}

      {/* il piatto */}
      <div className="relative w-[76%]">
        <div
          className={clsx(
            "relative aspect-square overflow-hidden rounded-full bg-white",
            c.hidden && "opacity-60 saturate-50",
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
        {/* non pronta (solo admin): timbro «fac-simile» sopra il piatto, non sbiadito con lui.
            Sta sul piatto e non nel testo, così tutte le card restano alte uguali */}
        {c.hidden && <NotReadyStamp />}
        {c.guest && f.guestRating && (
          <RatingMedal
            value={c.guest.value}
            count={c.guest.count}
            muted={c.hidden}
            className="absolute -right-[4%] -bottom-[2%] w-[clamp(2rem,27cqi,3.25rem)] text-[clamp(0.6875rem,8cqi,1rem)]"
          />
        )}
      </div>

      <h3
        className={clsx(
          "mt-[0.75em] line-clamp-2 text-[0.8125rem] leading-tight font-extrabold @min-[11rem]/card:text-[1rem] @min-[18rem]/card:text-[1.1875rem]",
          c.hidden ? "text-grigio" : "text-blu-950"
        )}
      >
        {recipe.name}
      </h3>
      <span
        className={clsx(
          "mt-1 flex max-w-full min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[0.6875rem] @min-[11rem]/card:text-xs",
          c.hidden ? "text-grigio-chiaro" : "text-grigio"
        )}
      >
        {f.category && c.cat && (
          <span className="flex max-w-full min-w-0 items-center gap-1">
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: c.cat.color }} />
            <span className="truncate">{c.cat.name}</span>
          </span>
        )}
        {f.time && c.time && (
          <span className="tabular flex items-center gap-1 whitespace-nowrap">
            <Clock className="size-3.5 shrink-0" aria-hidden /> {c.time}
          </span>
        )}
        {f.servings && recipe.servings && (
          <span className="flex min-w-0 items-center gap-1">
            <Users className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {recipe.servingsUnit ? formatServings(recipe.servings, recipe.servingsUnit) : `${recipe.servings}p`}
            </span>
          </span>
        )}
        {f.cookCount && c.isAdmin && recipe.cookCount > 0 && (
          <span className="tabular flex items-center gap-1" title={`Cucinata ${recipe.cookCount} volte`}>
            <PotIcon className="size-3.5 shrink-0" aria-hidden /> ×{recipe.cookCount}
          </span>
        )}
        {f.reviewCount && c.guest && (
          <span className="tabular whitespace-nowrap">
            {c.guest.count} {c.guest.count === 1 ? "voto" : "voti"}
          </span>
        )}
        {f.myRating && c.mine != null && (
          <span className={clsx("tabular font-bold whitespace-nowrap", !c.hidden && "text-mio-ink")}>mio {c.mine}</span>
        )}
      </span>
      {f.tags && recipe.tags.length > 0 && (
        <p className={clsx("mt-1 max-w-full truncate text-[0.6875rem] @min-[11rem]/card:text-xs", c.hidden ? "text-grigio-chiaro" : "text-blu-700")}>
          {recipe.tags.slice(0, 4).map((t) => `#${t.name}`).join("  ")}
        </p>
      )}
    </Link>
  );
}

/** 6.4 sul piatto · timbro «Non pronta» come un fac-simile: bianco pieno, bordo tratteggiato, inclinato. */
function NotReadyStamp() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className={clsx(
          "-rotate-12 rounded-[0.375rem] border-2 border-dashed border-grigio bg-white px-[0.6em] py-[0.25em]",
          "text-[clamp(0.625rem,7cqi,0.9375rem)] leading-none font-extrabold tracking-[0.12em] whitespace-nowrap text-grigio uppercase",
          "shadow-[0_2px_6px_oklch(25%_0.038_228/.18)]"
        )}
      >
        Non pronta
      </span>
    </span>
  );
}
