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
 * Card ricetta in lista (tavola 8.1 con foto, 8.2 senza foto → logo AN10 su azzurro).
 * Foto 4:3 in alto con pentola («Sto cucinando») e cuore; sotto, su bianco: nome (2 righe),
 * tempo e voti. La categoria principale è il pallino colorato davanti al tempo.
 * Le ricette non pronte (solo admin) sono offuscate con l'etichetta 6.4.
 *
 * La card è un contenitore (`@container/card`): cosa mostra dipende dalla **sua** larghezza, che
 * cambia con le card per riga scelte (`CollectionView`). Stretta (3 per riga sul telefono): nome più
 * piccolo e solo pallino + tempo. Da 13rem porzioni e cotture, da 16rem il nome della categoria,
 * da 19rem i tag e un nome più grande.
 */
export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const { isAdmin } = useAuth();
  const totalTime = (recipe.prep ?? 0) + (recipe.cook ?? 0);
  const primaryCat = recipe.categories[0];
  const hasRating = recipe._count.reviews > 0 && recipe.avgRating !== null;
  const isHidden = isAdmin && !recipe.published;

  return (
    <Link
      href={`/ricette/${recipe.id}`}
      className={clsx(
        "group @container/card flex min-w-0 flex-col overflow-hidden rounded-card border border-blu-150 bg-white transition-shadow hover:shadow-[0_6px_18px_oklch(25%_0.038_228/.1)]",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35",
        isHidden && "border-dashed"
      )}
    >
      <div className={clsx("relative aspect-4/3 overflow-hidden", isHidden && "opacity-60 saturate-50")}>
        {recipe.photo ? (
          <Image
            src={recipe.photo}
            alt=""
            fill
            sizes="(max-width: 700px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <NoPhoto />
        )}
        <div className="absolute top-1.5 right-1.5 flex gap-1 @min-[9rem]/card:top-2 @min-[9rem]/card:right-2 @min-[9rem]/card:gap-1.5">
          {/* card stretta (3 per riga sul telefono): solo il cuore, la pentola coprirebbe la foto */}
          <span className="hidden @min-[9rem]/card:contents">
            <CookingButton recipeId={recipe.id} />
          </span>
          <FavoriteButton recipeId={recipe.id} />
        </div>
        {isHidden && (
          <div className="absolute top-2 left-2">
            <HiddenTag />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-[0.55em] pt-[0.45em] pb-[0.55em] @min-[9rem]/card:px-[0.7em] @min-[9rem]/card:pt-[0.55em] @min-[9rem]/card:pb-[0.7em]">
        <h3
          className="line-clamp-2 text-[0.8125rem] leading-tight font-bold text-blu-950 @min-[9rem]/card:text-[0.9375rem] @min-[19rem]/card:text-[1.0625rem]"
          title={recipe.name}
        >
          {recipe.name}
        </h3>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="flex min-w-0 items-center gap-x-2.5 text-xs text-grigio">
            {primaryCat && (
              <span
                aria-label={primaryCat.name}
                title={primaryCat.name}
                className="size-2 shrink-0 rounded-full"
                style={{ background: primaryCat.color }}
              />
            )}
            {primaryCat && <span className="hidden truncate @min-[16rem]/card:inline">{primaryCat.name}</span>}
            {totalTime > 0 && (
              <span className="tabular flex items-center gap-1 whitespace-nowrap">
                <Clock className="size-3.5 shrink-0" aria-hidden /> {formatMinutes(totalTime)}
              </span>
            )}
            {recipe.servings && (
              <span className="hidden min-w-0 items-center gap-1 @min-[13rem]/card:flex">
                <Users className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">
                  {recipe.servingsUnit ? formatServings(recipe.servings, recipe.servingsUnit) : `${recipe.servings}p`}
                </span>
              </span>
            )}
            {isAdmin && recipe.cookCount > 0 && (
              <span className="tabular hidden items-center gap-1 @min-[13rem]/card:flex" title={`Cucinata ${recipe.cookCount} volte`}>
                <PotIcon className="size-3.5 shrink-0" aria-hidden /> ×{recipe.cookCount}
              </span>
            )}
          </span>
          {(hasRating || (isAdmin && recipe.myRating != null)) && (
            <span className="flex shrink-0 gap-1">
              {isAdmin && recipe.myRating != null && <MyRatingTag value={recipe.myRating} />}
              {hasRating && <GuestRatingTag value={recipe.avgRating!} count={recipe._count.reviews} />}
            </span>
          )}
        </div>
        {recipe.tags.length > 0 && (
          <p className="hidden truncate text-xs text-blu-700 @min-[19rem]/card:block">
            {recipe.tags.slice(0, 4).map((t) => `#${t.name}`).join("  ")}
          </p>
        )}
      </div>
    </Link>
  );
}
