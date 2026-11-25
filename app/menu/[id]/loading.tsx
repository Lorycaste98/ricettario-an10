import { Skeleton } from "@/components/ds/Progress";
import { backLinkCls } from "@/components/ui/BackLink";
import { PageLoader } from "@/components/brand/An10Loader";

/**
 * Caricamento del dettaglio menù: stessa forma della pagina (testata 9.5, riga azioni, ricette e
 * lista spesa · da 1000px colonna laterale con costi e note). Il BackLink usa le sue classi vere.
 */
export default function MenuDetailLoading() {
  return (
    <>
      <PageLoader />
      <div className="flex flex-col gap-4" aria-busy>
        <span className={`${backLinkCls} w-36`} aria-hidden />
        <div className="flex items-center gap-3">
          <Skeleton className="size-14 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-7 w-3/5" />
            <Skeleton className="h-3.5 w-2/5" />
          </div>
        </div>
        <Skeleton className="h-(--h-btn) w-44" />
        <div className="grid items-start gap-(--gap) @min-[1000px]:grid-cols-[1fr_clamp(18rem,32cqi,25rem)]">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-28" />
            <div className="flex flex-col overflow-hidden rounded-card border border-blu-150 bg-white">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-blu-150 px-3 py-2.5 last:border-b-0">
                  <Skeleton className="size-7 rounded-full" />
                  <Skeleton className="size-12" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="hidden h-72 rounded-card @min-[1000px]:block" />
        </div>
      </div>
    </>
  );
}
