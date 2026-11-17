import type { ReactNode } from "react";
import { Skeleton } from "@/components/ds/Progress";

/**
 * Caricamento dei form di Gestione (nuova/modifica ricetta e menù), stessa forma del form vero
 * (`components/admin/FormParts.tsx`): barra 11.1 attaccata in alto a tutta larghezza e blocchi
 * 11.2 su due colonne dagli 860px di contenitore. Se cambi la disposizione dei form, cambia anche qui.
 */

function Card({ rows, children }: { rows?: number; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-blu-150 bg-white px-4 py-3.5">
      <div className="flex items-center gap-2">
        <Skeleton className="size-[1.875rem]" />
        <Skeleton className="h-5 w-32" />
      </div>
      {children}
      {rows !== undefined &&
        Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Skeleton className="h-[1.875rem] w-[3.75rem]" />
            <Skeleton className="h-[1.875rem] w-[3.25rem]" />
            <Skeleton className="h-[1.875rem] flex-1" />
          </div>
        ))}
    </div>
  );
}

function Fields({ n }: { n: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Skeleton className="col-span-2 h-(--h-field)" />
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-(--h-field)" />
      ))}
    </div>
  );
}

export function FormSkeleton({ variant }: { variant: "recipe" | "menu" }) {
  return (
    <div aria-busy>
      <div
        className="-mx-4 mb-(--gap) flex items-center gap-2 border-b border-blu-150 bg-white px-(--pad) pb-2 sm:-mx-6"
        style={{
          marginTop: "calc(-1 * max(2rem, calc(env(safe-area-inset-top, 0px) + 1rem)))",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
        }}
      >
        <Skeleton className="h-6 w-40" />
        <span className="flex-1" />
        <Skeleton className="h-(--h-sm) w-24 rounded-full" />
        <Skeleton className="h-(--h-btn) w-20 bg-arancio-50" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-(--gap) @min-[860px]:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.4fr)] @min-[860px]:items-start">
        {variant === "recipe" ? (
          <>
            <div className="flex flex-col gap-(--gap)">
              <Card>
                <Fields n={4} />
              </Card>
              <Card>
                <div className="flex gap-2">
                  <Skeleton className="size-[4.75rem]" />
                  <Skeleton className="size-[4.75rem]" />
                </div>
              </Card>
            </div>
            <div className="flex flex-col gap-(--gap)">
              <Card rows={5} />
              <Card>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </Card>
            </div>
          </>
        ) : (
          <>
            <Card>
              <Fields n={4} />
            </Card>
            <Card>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="size-10" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
              <Skeleton className="h-(--h-field)" />
              <Skeleton className="h-40" />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
