import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { Skeleton } from "@/components/ds/Progress";

/** Stessa forma della libreria (PageHeader + ricerca + chip + griglia o lista come la sceglie chi guarda). */
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
      {/* stesse scelte della lista vera (griglia/lista, card per riga) */}
      <ListSkeleton list="recipes" />
    </div>
  );
}
