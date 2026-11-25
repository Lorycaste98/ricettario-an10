import { Skeleton } from "@/components/ds/Progress";
import { PageLoader } from "@/components/brand/An10Loader";

/** Caricamento della dashboard di Gestione: testata, schede «Crea», tessere, grafici */
export default function Loading() {
  return (
    <>
      <PageLoader />
      <div className="flex flex-col gap-5" aria-busy>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3.5 w-56" />
        </div>
        <div className="grid gap-(--gap) @min-[620px]:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-card" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-(--gap) @min-[760px]:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-card" />
      </div>
    </>
  );
}
