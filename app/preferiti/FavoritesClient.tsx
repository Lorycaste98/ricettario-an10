"use client";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/ds/Feedback";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { useFavorites } from "@/lib/favorites";
import type { RecipeSummary } from "@/lib/types";

export function FavoritesClient({ recipes }: { recipes: RecipeSummary[] }) {
  const { favorites, hydrated, reconcile } = useFavorites();

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
            className="inline-flex h-(--h-sm) items-center rounded-[0.625rem] bg-arancio px-[0.8em] text-[0.875rem] font-semibold text-white hover:bg-arancio-scuro"
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
      <p className="text-xs font-semibold tracking-[0.08em] text-grigio uppercase">
        {filtered.length} ricett{filtered.length === 1 ? "a" : "e"} preferit{filtered.length === 1 ? "a" : "e"}
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(9.5rem,24cqi,13rem),1fr))] gap-(--gap)">
        {filtered.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>
    </div>
  );
}
