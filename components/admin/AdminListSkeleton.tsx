import { Skeleton } from "@/components/ds/Progress";

/**
 * Caricamento delle pagine di Gestione: stessa forma di testata (9.5), barra filtri e tabella
 * (`AdminTable`). Gira dentro la cornice di `app/admin/layout.tsx`, quindi la sotto-navigazione resta.
 */
export function AdminListSkeleton({ rows = 8, toolbar = true }: { rows?: number; toolbar?: boolean }) {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-3.5 w-56" />
      </div>
      {toolbar && <Skeleton className="h-(--h-field) w-full rounded-[0.625rem]" />}
      <div className="overflow-hidden rounded-card border border-blu-150 bg-white">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex min-h-14 items-center gap-3 border-b border-blu-150 px-3 py-2 last:border-0">
            <Skeleton className="size-10 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="size-[1.875rem] shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
