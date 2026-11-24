import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { Skeleton } from "@/components/ds/Progress";

/**
 * Stessa forma della libreria: PageHeader, ricerca + bottone «Filtri» (contenitore stretto) o
 * barra con «Categorie ▾», «Tag ▾» e ordinamento (da 860px, tendine 4.14), poi griglia o lista
 * come la sceglie chi guarda.
 */
export default function RicetteLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-52" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-(--h-field) min-w-[12rem] flex-1 basis-[16rem]" />
          <Skeleton className="h-(--h-btn) w-24 @min-[860px]:hidden" />
          <div aria-hidden className="hidden gap-2 @min-[860px]:flex">
            <Skeleton className="h-(--h-btn) w-32" />
            <Skeleton className="h-(--h-btn) w-24" />
            <Skeleton className="h-(--h-btn) w-44" />
            <Skeleton className="h-(--h-btn) w-(--h-btn)" />
          </div>
        </div>
        {/* stesse scelte della lista vera (griglia/lista, card per riga) */}
        <ListSkeleton list="recipes" />
      </div>
    </div>
  );
}
