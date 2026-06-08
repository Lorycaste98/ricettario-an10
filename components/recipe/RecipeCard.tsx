import Link from "next/link";
import Image from "next/image";
import { type RecipeSummary, formatMinutes } from "@/lib/types";

function StarRating({ avg, count }: { avg: number; count: number }) {
  return (
    <span className="flex items-center gap-1 text-amber-300 text-xs">
      ★ <span className="font-semibold">{avg.toFixed(1)}</span>
      <span className="text-white/70">({count})</span>
    </span>
  );
}

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const totalTime = (recipe.prep ?? 0) + (recipe.cook ?? 0);
  const primaryCat = recipe.categories[0];

  return (
    <Link
      href={`/ricette/${recipe.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-zinc-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Image area */}
      <div className="relative aspect-4/3 overflow-hidden">
        {recipe.photo ? (
          <Image
            src={recipe.photo}
            alt={recipe.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-800">
            <Image src="/an10.webp" alt="AN10" width={56} height={56} className="opacity-60 rounded-xl" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
          {primaryCat ? (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white shadow backdrop-blur-sm"
              style={{ backgroundColor: primaryCat.color + "cc" }}
            >
              {primaryCat.name}
            </span>
          ) : <span />}

          {recipe.cookCount > 0 && (
            <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              🍳 ×{recipe.cookCount}
            </span>
          )}
        </div>

        {/* Bottom overlay: title + meta */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow group-hover:text-orange-300 transition-colors">
            {recipe.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-white/85">
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatMinutes(totalTime)}
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {recipe.servings}p
              </span>
            )}
            {recipe._count.reviews > 0 && recipe.avgRating !== null && (
              <StarRating avg={recipe.avgRating} count={recipe._count.reviews} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
