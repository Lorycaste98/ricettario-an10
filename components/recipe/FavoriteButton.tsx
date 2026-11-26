"use client";
import { Heart } from "lucide-react";
import { clsx } from "clsx";
import { useFavorites } from "@/lib/favorites";
import { headerIconCls } from "@/components/ds/button-classes";

interface Props {
  recipeId: number;
  /** card = tondo sulla foto della `RecipeCard` · icon = 3.10/3.11 nella testata del dettaglio */
  variant?: "card" | "icon";
  className?: string;
}

export function FavoriteButton({ recipeId, variant = "card", className }: Props) {
  const { isFavorite, toggle, hydrated } = useFavorites();
  const active = hydrated && isFavorite(recipeId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(recipeId);
  };

  if (variant === "icon") {
    // 3.10 / 3.11 · quadrato con sola icona, per la testata del dettaglio (come PDF ed elimina)
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
        aria-pressed={active}
        title={active ? "Nei preferiti: tocca per toglierla" : "Salva tra i preferiti"}
        className={clsx(
          headerIconCls,
          active && "border-arancio-pieno! bg-arancio-pieno! text-white! hover:bg-arancio-scuro!",
          className
        )}
      >
        <Heart className={clsx(active && "fill-current")} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
      aria-pressed={active}
      className={clsx(
        // 3.10 / 3.11 · gemello del bottone pentola sulla card
        "flex size-8 items-center justify-center rounded-full shadow-sm transition-colors",
        active ? "bg-arancio-pieno text-white hover:bg-arancio-scuro" : "bg-white/95 text-blu-800 hover:bg-white"
      )}
    >
      <Heart size={16} className={clsx(active && "fill-current")} />
    </button>
  );
}
