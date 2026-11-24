"use client";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Clock, Users } from "lucide-react";
import { type RecipeSummary, formatMinutes, formatServings } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import { CookingButton } from "@/components/cooking/CookingButton";
import { useAuth } from "@/components/AuthProvider";
import { NoPhoto } from "./NoPhoto";
import { GuestRatingTag, HiddenTag, MyRatingTag } from "@/components/ds/Tag";
import { PotIcon } from "@/components/icons";

/**
 * Riga ricetta della vista a **lista** (gemella della riga 8.3 del dettaglio menù): miniatura,
 * nome, categoria, tempo, porzioni, cotture e voti; pentola e cuore a destra. Stessi dati e stesse
 * regole della `RecipeCard` (non pronta = offuscata + 6.4). Va dentro il contenitore a righe di
 * `CollectionBody`. È un `@container/row`: da 34rem i voti passano a destra, sulla riga del nome.
 */
export function RecipeRow({ recipe }: { recipe: RecipeSummary }) {
  const { isAdmin } = useAuth();
  const totalTime = (recipe.prep ?? 0) + (recipe.cook ?? 0);
  const primaryCat = recipe.categories[0];
  const hasRating = recipe._count.reviews > 0 && recipe.avgRating !== null;
  const isHidden = isAdmin && !recipe.published;
  const ratings = (hasRating || (isAdmin && recipe.myRating != null)) && (
    <span className="flex shrink-0 gap-1">
      {isAdmin && recipe.myRating != null && <MyRatingTag value={recipe.myRating} />}
      {hasRating && <GuestRatingTag value={recipe.avgRating!} count={recipe._count.reviews} />}
    </span>
  );

  return (
    <Link
      href={`/ricette/${recipe.id}`}
      className={clsx(
        "group @container/row flex min-w-0 items-center gap-3 px-[clamp(0.625rem,2cqi,1rem)] py-2.5 transition-colors hover:bg-blu-50",
        "focus-visible:relative focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35 focus-visible:ring-inset"
      )}
    >
      <span
        className={clsx(
          "relative size-14 shrink-0 overflow-hidden rounded-ctl",
          isHidden && "opacity-60 saturate-50"
        )}
      >
        {recipe.photo ? (
          <Image src={recipe.photo} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          <NoPhoto logo="w-1/2" />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-start justify-between gap-2">
          <span className="line-clamp-2 leading-tight font-bold text-blu-950 group-hover:text-blu-700" title={recipe.name}>
            {recipe.name}
          </span>
          <span className="hidden @min-[34rem]/row:flex">{ratings}</span>
        </span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-grigio">
          {isHidden && <HiddenTag />}
          {primaryCat && (
            <span className="flex min-w-0 items-center gap-1.5">
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: primaryCat.color }} />
              <span className="truncate">{primaryCat.name}</span>
            </span>
          )}
          {totalTime > 0 && (
            <span className="tabular flex items-center gap-1 whitespace-nowrap">
              <Clock className="size-3.5 shrink-0" aria-hidden /> {formatMinutes(totalTime)}
            </span>
          )}
          {recipe.servings && (
            <span className="flex min-w-0 items-center gap-1">
              <Users className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                {recipe.servingsUnit ? formatServings(recipe.servings, recipe.servingsUnit) : `${recipe.servings}p`}
              </span>
            </span>
          )}
          {isAdmin && recipe.cookCount > 0 && (
            <span className="tabular flex items-center gap-1" title={`Cucinata ${recipe.cookCount} volte`}>
              <PotIcon className="size-3.5 shrink-0" aria-hidden /> ×{recipe.cookCount}
            </span>
          )}
        </span>
        {ratings && <span className="flex @min-[34rem]/row:hidden">{ratings}</span>}
      </span>

      {/* sulla riga bianca i bottoni tondi hanno un bordo, non solo l'ombra della foto */}
      <span className="flex shrink-0 gap-1.5 [&>button]:ring-1 [&>button]:ring-blu-150">
        <CookingButton recipeId={recipe.id} />
        <FavoriteButton recipeId={recipe.id} />
      </span>
    </Link>
  );
}
