"use client";
import { RecipeCardSkeleton } from "@/components/recipe/RecipeCardSkeleton";
import { MenuCardSkeleton } from "@/components/menu/MenuCardSkeleton";
import { CollectionBody, useCollectionView } from "@/components/ui/CollectionView";
import { LIST_LAYOUT, type ListKind } from "@/lib/preferences";

/**
 * Skeleton delle liste (caricamento di Ricette, Preferiti, Menù) con **le stesse scelte della lista
 * vera**: griglia o lista, card per riga (misurate sullo stesso contenitore, `useCollectionView`).
 * Due righe di card in griglia, sei righe in lista. Prima della misura vale la griglia elastica.
 */
export function ListSkeleton({ list }: { list: ListKind }) {
  const { view, ref, gridStyle, cols } = useCollectionView(list);
  const count = view === "list" ? 6 : Math.max(2, cols || 3) * 2;
  return (
    <CollectionBody view={view} gridRef={ref} gridStyle={gridStyle} fallbackCols={LIST_LAYOUT[list].fallbackCols} list="stack">
      {Array.from({ length: count }).map((_, i) =>
        view === "list" ? <RowSkeleton key={i} list={list} /> : list === "recipes" ? <RecipeCardSkeleton key={i} index={i} /> : <MenuCardSkeleton key={i} />
      )}
    </CollectionBody>
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
