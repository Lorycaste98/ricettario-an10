"use client";
import { Heart } from "lucide-react";
import { clsx } from "clsx";
import { useFavorites } from "@/lib/favorites";

interface Props {
  recipeId: number;
  variant?: "card" | "detail";
}

export function FavoriteButton({ recipeId, variant = "card" }: Props) {
  const { isFavorite, toggle, hydrated } = useFavorites();
  const active = hydrated && isFavorite(recipeId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(recipeId);
  };

  if (variant === "detail") {
    return (
      <button
        onClick={handleClick}
        aria-label={active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
        aria-pressed={active}
        className={clsx(
          "inline-flex items-center gap-2 rounded-lg border backdrop-blur-sm px-4 py-2 text-sm font-medium transition-colors",
          active
            ? "border-rose-300/60 bg-rose-50/80 text-rose-600 hover:bg-rose-100/80"
            : "border-white/40 bg-white/60 text-sky-900 hover:bg-white/80"
        )}
      >
        <Heart size={16} className={clsx(active && "fill-current")} />
        {active ? "Salvata tra i preferiti" : "Salva tra i preferiti"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label={active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
      aria-pressed={active}
      className={clsx(
        "flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm transition-colors",
        active
          ? "bg-rose-500/90 text-white hover:bg-rose-500"
          : "bg-black/50 text-white hover:bg-black/70"
      )}
    >
      <Heart size={14} className={clsx(active && "fill-current")} />
    </button>
  );
}
