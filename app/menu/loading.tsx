import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { Skeleton } from "@/components/ds/Progress";
import { PageLoader } from "@/components/brand/An10Loader";

/** Caricamento della lista menù: testata, scheda del prossimo menù, ricerca e griglia di card 8.5. */
export default function MenuLoading() {
  return (
    <>
      <PageLoader />
      <div className="flex flex-col gap-4" aria-busy>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3.5 w-40" />
        </div>
        <Skeleton className="h-48 rounded-card bg-blu-150" />
        <Skeleton className="h-(--h-field)" />
        {/* stesse scelte della lista vera (griglia/lista, card per riga) */}
        <ListSkeleton list="menus" />
      </div>
    </>
  );
}
