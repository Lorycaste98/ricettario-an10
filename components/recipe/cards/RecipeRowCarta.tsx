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
import { RatingMedal } from "./RatingMedal";

/**
 * PROPOSTA LISTA · «Carta». La vista a lista come la carta di un ristorante: a sinistra il piatto
 * (foto tonda con il bordo, gemella della card «Piatto») con il voto ospiti come **medaglia** in
 * basso a destra, come nel Piatto; poi il nome e i puntini di guida che portano a pentola e cuore.
 * Sotto, categoria, tempo (ambra), porzioni, cotture e il mio voto (indaco).
 * Ogni ricetta è a sé (non un foglio unico, che le faceva sembrare un gruppo): `variant="card"` =
 * scheda bianca propria, `variant="bare"` = appoggiata sul fondo pagina, separata solo dallo spazio.
 * Le righe vanno in una colonna con spazio (`CartaStack`). Da 34rem il piatto cresce e il nome passa a 1.125rem.
 */
export function RecipeRowCarta({ recipe, variant = "card" }: { recipe: RecipeSummary; variant?: "card" | "bare" }) {
  const c = useCardInfo(recipe);

  return (
    <Link
      href={`/ricette/${recipe.id}`}
      className={clsx(
        "group @container/row flex min-w-0 items-center gap-3",
        variant === "card"
          ? "rounded-card border border-blu-150 bg-white px-[clamp(0.625rem,2cqi,1rem)] py-2.5 hover:shadow-[0_6px_16px_oklch(25%_0.038_228/.1)]"
          : "rounded-ctl px-1 py-1.5 hover:bg-blu-100",
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
          <span className="line-clamp-2 min-w-0 text-[1rem] leading-tight font-extrabold text-blu-950 group-hover:text-blu-700 @min-[34rem]/row:text-[1.125rem]">
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
            {c.mine != null && <span className="tabular font-bold text-mio-ink">mio {c.mine}</span>}
          </span>
        </span>
      </span>
    </Link>
  );
}

/** Colonna delle righe «Carta»: ogni ricetta separata dallo spazio (schede) o più fitta (senza scheda). */
export function CartaStack({ variant = "card", children }: { variant?: "card" | "bare"; children: React.ReactNode }) {
  return <div className={variant === "card" ? "flex flex-col gap-2" : "flex flex-col gap-1.5"}>{children}</div>;
}
