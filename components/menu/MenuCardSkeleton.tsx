import { Skeleton } from "@/components/ds/Progress";

/** Skeleton della card menù 8.5 (stessa forma: testata azzurra con filo + riga sotto). */
export function MenuCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-blu-150 bg-white" aria-hidden>
      <div className="flex flex-col gap-1.5 border-l-4 border-blu-150 bg-blu-100 px-[0.9em] py-[0.7em]">
        <Skeleton className="h-3 w-24 bg-blu-150" />
        <Skeleton className="h-5 w-3/4 bg-blu-150" />
      </div>
      <div className="px-[0.9em] py-[0.7em]">
        <Skeleton className="h-3.5 w-1/2" />
      </div>
    </div>
  );
}
