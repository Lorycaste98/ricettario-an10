import { Skeleton } from "@/components/ds/Progress";

/**
 * Skeleton della card menù 8.5 «menù stampato»: tovaglia azzurra, biglietto della data in alto a
 * sinistra, cartoncino bianco centrato e un po' storto con le righe dei nomi, sotto nome e dettagli.
 * Il cartoncino è nella posizione «senza foto» (centrato): la foto non si sa ancora se c'è.
 */
export function MenuCardSkeleton() {
  return (
    <div className="@container/card relative flex flex-col items-center overflow-hidden rounded-card bg-blu-100 px-[6%] pt-[6%] pb-[0.8em]" aria-hidden>
      <div className="relative aspect-[5/4] w-full">
        <div className="absolute top-[4%] bottom-[4%] left-[18%] flex w-[64%] -rotate-2 animate-pulse flex-col items-center justify-center gap-[0.5em] rounded-[0.5rem] bg-white px-[12%] motion-reduce:animate-none">
          <span className="size-[clamp(0.8125rem,9cqi,1.375rem)] rounded-full bg-blu-120" />
          <span className="w-[38%] border-t border-blu-150" />
          <span className="h-[0.5em] w-full rounded-full bg-blu-120" />
          <span className="h-[0.5em] w-4/5 rounded-full bg-blu-120" />
          <span className="h-[0.5em] w-1/2 rounded-full bg-blu-100" />
        </div>
      </div>
      <span className="absolute top-[0.45rem] left-[0.45rem] aspect-[4/5] w-[clamp(2.25rem,20cqi,3.5rem)] animate-pulse rounded-[0.5em] bg-blu-150 motion-reduce:animate-none" />
      <Skeleton className="mt-3 h-4 w-3/4 bg-blu-150" />
      <Skeleton className="mt-2 h-3 w-1/2 bg-blu-120" />
    </div>
  );
}
