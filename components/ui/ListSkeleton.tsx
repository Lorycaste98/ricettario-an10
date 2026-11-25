"use client";
import { RecipeCardSkeleton } from "@/components/recipe/RecipeCardSkeleton";
import { MenuCardSkeleton } from "@/components/menu/MenuCardSkeleton";
import { CollectionBody, pageSizeFor, useCollectionView } from "@/components/ui/CollectionView";
import { LIST_LAYOUT, LIST_PAGE, type ListKind } from "@/lib/preferences";

/**
 * Skeleton delle liste (caricamento di Ricette, Preferiti, Menù) con **le stesse scelte della lista
 * vera**: riga del totale con l'interruttore griglia/lista (quello vero, già usabile), poi griglia
 * o lista con le card per riga misurate sullo stesso contenitore (`useCollectionView`) e **una
 * pagina intera** di elementi (`pageSizeFor` con `LIST_PAGE`, come la lista). Prima della misura
 * vale la griglia elastica.
 */
export function ListSkeleton({ list }: { list: ListKind }) {
  const { view, ref, gridStyle, cols, controls } = useCollectionView(list);
  const count = pageSizeFor(view, cols, LIST_PAGE[list]);
  return (
    <div className="flex flex-col gap-3" aria-busy>
      {/* riga del totale: «N ricette · ordinate per …» + griglia/lista */}
      <div className="flex min-h-(--h-sm) items-center justify-between gap-3">
        <span aria-hidden className="h-3 w-40 animate-pulse rounded bg-blu-150 motion-reduce:animate-none" />
        {controls}
      </div>
      <CollectionBody view={view} gridRef={ref} gridStyle={gridStyle} fallbackCols={LIST_LAYOUT[list].fallbackCols} list="stack">
        {Array.from({ length: count }).map((_, i) =>
          view === "list" ? <RowSkeleton key={i} list={list} /> : list === "recipes" ? <RecipeCardSkeleton key={i} index={i} /> : <MenuCardSkeleton key={i} />
        )}
      </CollectionBody>
    </div>
  );
}

/** Riga della vista a lista: piatto (ricette) o biglietto della data (menù), nome e dettagli. */
function RowSkeleton({ list }: { list: ListKind }) {
  return (
    <div aria-hidden className="flex items-center gap-3 px-1 py-1.5">
      {list === "recipes" ? (
        <span className="size-14 shrink-0 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
      ) : (
        <span className="h-[4.25rem] w-[3.25rem] shrink-0 animate-pulse rounded-[0.5rem] bg-white motion-reduce:animate-none" />
      )}
      <span className="flex flex-1 flex-col gap-2">
        <span className="h-3.5 w-1/2 animate-pulse rounded bg-blu-150 motion-reduce:animate-none" />
        <span className="h-3 w-1/3 animate-pulse rounded bg-blu-120 motion-reduce:animate-none" />
      </span>
    </div>
  );
}
