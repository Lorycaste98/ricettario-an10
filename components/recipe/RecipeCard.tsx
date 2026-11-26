"use client";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Clock, Users } from "lucide-react";
import { MyRatingMedal, RatingMedal } from "./RatingMedal";
import { type RecipeSummary, formatServings } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import { CookingButton } from "@/components/cooking/CookingButton";
import { An10Logo } from "@/components/brand/An10Logo";
import { PotIcon } from "@/components/icons";
import { pressCls, useCardInfo } from "./card-info";
import { useCardConfig } from "@/components/CardConfigProvider";
import { CategoryLabel } from "./CardCategory";

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
 *
 * **Allineamento fra card della stessa riga**: la card occupa 5 righe della griglia che la contiene
 * (`row-span-5` + `grid-rows-subgrid`): piatto, nome, dettagli, tag e — in fondo, perché conta meno — la categoria (6.13) stanno su righe
 * **condivise** con le card accanto, quindi un nome su due righe sposta allo stesso modo tutte le
 * card della riga e ogni informazione resta alla stessa altezza. Ogni pezzo ha la sua riga fissa
 * (`row-start-*`) anche quando manca: una card senza tag lascia vuota la sua riga, non risale.
 * Fuori da una griglia (anteprima delle Impostazioni) la subgrid non vale e la card si impila da sola.
 */
/** Ogni riga è un `@container/card` largo quanto il contenuto della card: le container query non
 *  possono stare sulla card stessa, perché il contenimento di layout spegne la subgrid. */
const slot = "@container/card flex w-full min-w-0 justify-center self-start";

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const c = useCardInfo(recipe);
  const f = useCardConfig().recipe;
  return (
    <Link
      href={`/ricette/${recipe.id}`}
      data-recipe-card
      className={clsx(
        "group relative row-span-5 grid min-w-0 grid-rows-subgrid content-start gap-y-0 overflow-hidden rounded-card bg-blu-100 px-[8%] pb-[0.7rem] text-center",
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
          {/* contenitore largo quanto il contenuto della card (8% di margine per lato), come le righe */}
          <div className="pointer-events-none absolute inset-x-[8%] top-0 z-10 @container/card">
            <div className="pointer-events-auto absolute top-1.5 left-[calc(-9.524%+0.375rem)] hidden @min-[8rem]/card:top-2 @min-[8rem]/card:left-[calc(-9.524%+0.5rem)] @min-[8rem]/card:block">
              <CookingButton recipeId={recipe.id} />
            </div>
            <div className="pointer-events-auto absolute top-1.5 right-[calc(-9.524%+0.375rem)] @min-[9rem]/card:top-2 @min-[9rem]/card:right-[calc(-9.524%+0.5rem)]">
              <FavoriteButton recipeId={recipe.id} />
            </div>
          </div>
        </>
      )}

      {/* il piatto */}
      {/* margine sopra il piatto qui e non sulla card: la subgrid non conta il padding-top della
          card nell'altezza della prima riga e il nome finiva sopra il piatto. 10.7% della riga = 9% della card */}
      <div className={clsx(slot, "row-start-1 pt-[10.7%]")}>
      {/* larghezza in cqi (della riga), non in %: dentro la subgrid la % falsava l'altezza della riga del piatto */}
      <div className="relative w-[76cqi]">
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
            className="absolute top-[85%] left-[85%] w-[clamp(2rem,27cqi,3.5rem)] -translate-x-[58%] -translate-y-[58%] text-[clamp(0.6875rem,8cqi,1.0625rem)]"
          />
        )}
        {/* medaglie agganciate al bordo del cerchio a 45° (85% / 15% del quadrato), non all'angolo del
            quadrato: sulle card grandi l'angolo è lontano dal piatto e la medaglia restava sulla tovaglia.
            Il mio voto (6.12): speculare, in basso a sinistra, un po' più piccola */}
        {f.myRating && c.mine != null && (
          <MyRatingMedal
            value={c.mine}
            muted={c.hidden}
            className="absolute top-[85%] left-[15%] w-[clamp(1.75rem,22cqi,2.875rem)] -translate-x-[42%] -translate-y-[58%] text-[clamp(0.6875rem,7.5cqi,1rem)]"
          />
        )}
      </div>
      </div>

      <div className={clsx(slot, "row-start-2")}>
      <h3
        className={clsx(
          "mt-[0.75em] line-clamp-2 text-[0.8125rem] leading-tight font-extrabold @min-[11rem]/card:text-[1rem] @min-[18rem]/card:text-[1.1875rem]",
          c.hidden ? "text-grigio" : "text-blu-950"
        )}
      >
        {recipe.name}
      </h3>
      </div>
      <div className={clsx(slot, "row-start-3")}>
      <span
        className={clsx(
          "mt-1 flex max-w-full min-w-0 flex-wrap items-start justify-center gap-x-2 gap-y-0.5 text-[0.6875rem] @min-[11rem]/card:text-xs",
          c.hidden ? "text-grigio-chiaro" : "text-grigio"
        )}
      >
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
      </span>
      </div>
      <div className={clsx(slot, "row-start-4")}>
        {f.tags && recipe.tags.length > 0 && (
          <p className={clsx("mt-1 max-w-full truncate text-[0.6875rem] @min-[11rem]/card:text-xs", c.hidden ? "text-grigio-chiaro" : "text-blu-700")}>
            {recipe.tags.slice(0, 4).map((t) => `#${t.name}`).join("  ")}
          </p>
        )}
      </div>
      {/* 6.13 · categoria in fondo: dice a che categoria appartiene, ma conta meno del resto */}
      <div className={clsx(slot, "row-start-5")}>
        {f.category && (
          <CategoryLabel cats={recipe.categories} muted={c.hidden} className="mt-1.5 justify-center text-[0.6875rem] @min-[11rem]/card:text-xs" />
        )}
      </div>
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
