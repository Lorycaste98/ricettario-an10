import { Skeleton } from "@/components/ds/Progress";
import { backLinkCls } from "@/components/ui/BackLink";

/**
 * Caricamento del dettaglio ricetta: stessa forma della pagina (testata 9.5, ingredienti +
 * procedura affiancati da 620px, colonna foto da 1000px). Il BackLink usa le sue classi vere.
 */
export default function RicettaLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <span className={`${backLinkCls} w-36`} aria-hidden />
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 shrink-0" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-7 w-3/5" />
          <Skeleton className="h-3.5 w-2/5" />
        </div>
      </div>
      <div className="grid items-start gap-(--gap) @min-[1000px]:grid-cols-[1fr_clamp(16rem,26cqi,20rem)]">
        <div className="grid gap-x-(--gap) gap-y-4 @min-[620px]:grid-cols-[clamp(13rem,36%,20rem)_1fr]">
          <div className="flex flex-col gap-2.5 rounded-card bg-blu-100 p-3.5">
            <Skeleton className="h-3 w-24 bg-blu-150" />
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-5 bg-blu-150" />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-(--h-btn) w-48" />
            <Skeleton className="h-36 rounded-card" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
        <Skeleton className="hidden aspect-4/3 rounded-card @min-[1000px]:block" />
      </div>
    </div>
  );
}
