import { RecipeCardSkeleton } from "@/components/recipe/RecipeCardSkeleton";

export default function RicetteLoading() {
  return (
    <div className="space-y-5">
      <div className="mb-8">
        <div className="h-8 w-40 rounded-xl bg-white/20 animate-pulse" />
        <div className="mt-2 h-4 w-28 rounded-xl bg-white/10 animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 flex-1 rounded-lg bg-white/20 animate-pulse" />
        <div className="h-9 w-9 rounded-lg bg-white/20 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <RecipeCardSkeleton key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
