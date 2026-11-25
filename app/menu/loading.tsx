import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { Skeleton } from "@/components/ds/Progress";
import { PageLoader } from "@/components/brand/An10Loader";

/** Caricamento della lista menù: testata, scheda del prossimo menù, ricerca con i filtri, riga del totale e una pagina di card 8.5. */
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
        {/* ricerca + «Ordina e filtra» (stretto) o visibilità e ordinamento (da 860px), come MenuGrid */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-(--h-field) flex-1" />
          <Skeleton className="size-(--h-btn) rounded-ctl @min-[860px]:hidden" />
          <div aria-hidden className="hidden gap-2 @min-[860px]:flex">
            <Skeleton className="h-(--h-btn) w-44" />
            <Skeleton className="h-(--h-btn) w-(--h-btn)" />
          </div>
        </div>
        {/* stesse scelte della lista vera (griglia/lista, card per riga) */}
        <ListSkeleton list="menus" />
      </div>
    </>
  );
}
