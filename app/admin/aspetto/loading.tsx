import { Skeleton } from "@/components/ds/Progress";

/** Caricamento di «Aspetto del sito»: testata + scheda con interruttori e anteprima */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3.5 w-72" />
      </div>
      <Skeleton className="h-[28rem] rounded-card" />
    </div>
  );
}
