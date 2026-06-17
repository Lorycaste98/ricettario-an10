"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

/**
 * CTA "Vedi preferiti" per la home pubblica.
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
      className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/15 backdrop-blur-sm px-6 py-2.5 text-sm font-semibold text-rose-100 hover:bg-rose-500/25 transition-colors shadow-lg"
    >
      <Heart size={16} className="fill-current text-rose-300" />
      Vedi preferiti
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold leading-none text-white">
        {count > 99 ? "99+" : count}
      </span>
    </Link>
  );
}
