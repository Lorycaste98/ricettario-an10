"use client";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
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
    return (
      <p className="text-center text-sky-100/70 text-sm py-10">Carico i preferiti…</p>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Heart size={48} className="text-sky-100/40" />
        <p className="font-medium text-sky-950 [text-shadow:0_1px_3px_rgba(255,255,255,0.6)]">
          Nessuna ricetta tra i preferiti
        </p>
        <p className="text-sm text-sky-200/80 max-w-xs">
          Tocca il cuore su una ricetta per salvarla qui.
        </p>
        <Link
          href="/ricette"
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          Sfoglia le ricette
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium text-sky-950 [text-shadow:0_1px_3px_rgba(255,255,255,0.6)]">
        {filtered.length} ricett{filtered.length === 1 ? "a" : "e"} preferit{filtered.length === 1 ? "a" : "e"}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>
    </div>
  );
}
