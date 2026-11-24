import { MenuCardSkeleton } from "@/components/menu/MenuCardSkeleton";
import { Skeleton } from "@/components/ds/Progress";

/** Caricamento della lista menù: testata, scheda del prossimo menù, ricerca e griglia di card 8.5. */
export default function MenuLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3.5 w-40" />
      </div>
      <Skeleton className="h-48 rounded-card bg-blu-150" />
      <Skeleton className="h-(--h-field)" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(10rem,30cqi,16rem),1fr))] gap-(--gap)">
        {Array.from({ length: 6 }).map((_, i) => (
          <MenuCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
