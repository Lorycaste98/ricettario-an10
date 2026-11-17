import { Skeleton } from "@/components/ds/Progress";

export default function RecensisciLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5" aria-busy>
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="size-11" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-24 rounded-card" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-card" />
      ))}
    </div>
  );
}
