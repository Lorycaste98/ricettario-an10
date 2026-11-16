"use client";
import { Heart } from "lucide-react";
import { clsx } from "clsx";
import { useFavorites } from "@/lib/favorites";

interface Props {
  recipeId: number;
  variant?: "card" | "detail" | "overlay" | "icon";
}

export function FavoriteButton({ recipeId, variant = "card" }: Props) {
  const { isFavorite, toggle, hydrated } = useFavorites();
  const active = hydrated && isFavorite(recipeId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(recipeId);
  };

  if (variant === "overlay") {
    // Badge in sovrimpressione sulla foto: vetro scuro leggibile su qualsiasi
    // immagine; icona sempre, etichetta breve solo da desktop (lg).
    return (
      <button
        onClick={handleClick}
        aria-label={active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
        aria-pressed={active}
        title={active ? "Rimuovi dai preferiti" : "Salva tra i preferiti"}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-white shadow-sm backdrop-blur-md transition-colors lg:px-3",
          active ? "bg-rose-500/85 hover:bg-rose-500" : "bg-black/45 hover:bg-black/65"
        )}
      >
        <Heart size={16} className={clsx(active && "fill-current")} />
        <span className="hidden lg:inline">{active ? "Salvata" : "Preferiti"}</span>
      </button>
    );
  }

  if (variant === "icon") {
    // 3.10 / 3.11 · tondo con sola icona, per la testata del dettaglio
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
        aria-pressed={active}
        title={active ? "Nei preferiti: tocca per toglierla" : "Salva tra i preferiti"}
        className={clsx(
          "inline-flex size-(--h-icon) shrink-0 items-center justify-center rounded-full border transition-colors",
          active ? "border-arancio bg-arancio text-white" : "border-blu-200 bg-white text-blu-800 hover:bg-blu-100"
        )}
      >
        <Heart size={20} className={clsx(active && "fill-current")} />
      </button>
    );
  }

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
        // 3.10 / 3.11 · gemello del bottone pentola sulla card
        "flex size-8 items-center justify-center rounded-full shadow-sm transition-colors",
        active ? "bg-arancio text-white hover:bg-arancio-scuro" : "bg-white/95 text-blu-800 hover:bg-white"
      )}
    >
      <Heart size={16} className={clsx(active && "fill-current")} />
    </button>
  );
}
