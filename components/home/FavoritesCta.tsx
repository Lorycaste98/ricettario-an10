"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

/**
 * «I tuoi preferiti» nella vetrina (`app/page.tsx`), sulla fascia blu.
 * Renderizza null finché i preferiti non sono idratati o se sono vuoti,
 * così non c'è flash lato server (la home è un server component).
 */
export function FavoritesCta() {
  const { favorites, hydrated } = useFavorites();

  if (!hydrated || favorites.size === 0) return null;

  const count = favorites.size;

  return (
    <Link
      href="/preferiti"
      className="inline-flex h-(--h-sm) items-center gap-[0.45em] rounded-full bg-blu-700 px-[0.9em] text-[0.875rem] font-semibold text-white transition-colors hover:bg-blu-600 [&_svg]:size-[1.05em]"
    >
      <Heart className="fill-current" aria-hidden />
      I tuoi preferiti
      <span className="tabular rounded-full bg-white px-1.5 text-xs font-bold text-blu-800">{count > 99 ? "99+" : count}</span>
    </Link>
  );
}
