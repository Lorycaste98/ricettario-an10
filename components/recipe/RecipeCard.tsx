import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { type RecipeSummary, formatMinutes } from "@/lib/types";

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const totalTime = (recipe.prep ?? 0) + (recipe.cook ?? 0);

  return (
    <Link
      href={`/ricette/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Foto */}
      <div className="relative aspect-4/3 bg-orange-50 overflow-hidden">
        {recipe.photo ? (
          <Image
            src={recipe.photo}
            alt={recipe.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">🍽️</div>
        )}
        {recipe.cookCount > 0 && (
          <div className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-600 shadow-sm">
            🍳 ×{recipe.cookCount}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors">
          {recipe.name}
        </h3>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatMinutes(totalTime)}
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {recipe.servings} pers.
            </span>
          )}
          {recipe._count.reviews > 0 && (
            <span className="flex items-center gap-1">
              ⭐ {recipe._count.reviews}
            </span>
          )}
        </div>

        {/* Categorie */}
        {recipe.categories.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            {recipe.categories.slice(0, 3).map((c) => (
              <Badge key={c.id} label={c.name} color={c.color} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

