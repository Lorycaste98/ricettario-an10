import { Skeleton } from "@/components/ds/Progress";

/** Skeleton della card menù 8.5 «Tavola»: tovaglia azzurra, piatto grande + uno piccolo, due righe centrate. */
export function MenuCardSkeleton() {
  return (
    <div className="flex flex-col items-center overflow-hidden rounded-card bg-blu-100 px-[6%] pt-[6%] pb-[0.8em]" aria-hidden>
      <div className="relative aspect-[5/4] w-full">
        <div className="absolute top-[2%] right-[2%] aspect-square w-[36%] animate-pulse rounded-full bg-white motion-reduce:animate-none" />
        <div className="absolute top-[10%] left-[6%] aspect-square w-[64%] animate-pulse rounded-full bg-white motion-reduce:animate-none" />
      </div>
      <Skeleton className="mt-3 h-4 w-3/4 bg-blu-150" />
      <Skeleton className="mt-2 h-3 w-1/2 bg-blu-120" />
    </div>
  );
}
