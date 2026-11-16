import { RecipeCardSkeleton } from "@/components/recipe/RecipeCardSkeleton";
import { Skeleton } from "@/components/ds/Progress";

/** Stessa forma della libreria (PageHeader + ricerca + chip + griglia elastica). */
export default function RicetteLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-52" />
      </div>
      <Skeleton className="h-(--h-field)" />
      <div className="flex gap-1.5 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-(--h-sm) w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(9.5rem,24cqi,13rem),1fr))] gap-(--gap)">
        {Array.from({ length: 8 }).map((_, i) => (
          <RecipeCardSkeleton key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
