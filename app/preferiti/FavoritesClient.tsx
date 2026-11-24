"use client";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/ds/Feedback";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { RecipeRow } from "@/components/recipe/RecipeRow";
import { LIST_LAYOUT } from "@/lib/preferences";
import { CollectionBody, useCollectionView } from "@/components/ui/CollectionView";
import { useFavorites } from "@/lib/favorites";
import type { RecipeSummary } from "@/lib/types";

export function FavoritesClient({ recipes }: { recipes: RecipeSummary[] }) {
  const { favorites, hydrated, reconcile } = useFavorites();
  // stessa vista della libreria (griglia/lista e card per riga condivise)
  const layout = useCollectionView("recipes");

  const validIds = useMemo(() => new Set(recipes.map((r) => r.id)), [recipes]);

  // Ripulisce i preferiti orfani (ricette eliminate) allineando badge e pagina.
  // Guardia: solo se ci sono ricette, per non azzerare tutto su un fetch vuoto.
  useEffect(() => {
    if (hydrated && recipes.length > 0) reconcile(validIds);
  }, [hydrated, recipes.length, validIds, reconcile]);

  const filtered = useMemo(
    () => recipes.filter((r) => favorites.has(r.id)),
    [recipes, favorites]
  );

  if (!hydrated) {
    return <p className="py-10 text-center text-grigio">Carico i preferiti…</p>;
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<Heart />}
        title="Nessuna ricetta tra i preferiti"
        action={
          <Link
            href="/ricette"
            className="inline-flex h-(--h-sm) items-center rounded-[0.625rem] bg-arancio-pieno px-[0.8em] text-[0.875rem] font-semibold text-white hover:bg-arancio-scuro"
          >
            Sfoglia le ricette
          </Link>
        }
      >
        Tocca il cuore su una ricetta per salvarla qui.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-xs font-semibold tracking-[0.08em] text-grigio uppercase">
          {filtered.length} ricett{filtered.length === 1 ? "a" : "e"} preferit{filtered.length === 1 ? "a" : "e"}
        </p>
        {layout.controls}
      </div>
      <CollectionBody
        view={layout.view}
        gridRef={layout.ref}
        gridStyle={layout.gridStyle}
        fallbackCols={LIST_LAYOUT.recipes.fallbackCols}
        list="stack"
      >
        {filtered.map((r) => (layout.view === "list" ? <RecipeRow key={r.id} recipe={r} /> : <RecipeCard key={r.id} recipe={r} />))}
      </CollectionBody>
    </div>
  );
}
