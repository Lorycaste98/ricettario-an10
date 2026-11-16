import { Skeleton } from "@/components/ds/Progress";
import { backLinkCls } from "@/components/ui/BackLink";

/** Caricamento della modalità cucina: testata 9.5, timeline (13.6) e card con il passo corrente (8.7). */
export default function CucinaLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <span className={`${backLinkCls} w-36`} aria-hidden />
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 shrink-0" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-3.5 w-1/3" />
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-card border border-blu-150 bg-white p-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-40 rounded-ctl" />
      </div>
      <div className="grid gap-(--gap) @min-[760px]:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-card border border-blu-150 bg-white p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <Skeleton className="h-2" />
            <Skeleton className="h-36 rounded-card" />
          </div>
        ))}
      </div>
    </div>
  );
}
