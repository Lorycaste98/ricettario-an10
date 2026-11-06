"use client";
import { useState } from "react";
import { clsx } from "clsx";
import { CookingPot, Loader2 } from "lucide-react";
import { addRecipeById, isCooking, openCookingDock, useCookingSession } from "@/lib/cooking-session";

/**
 * Bottone tondo sulla `RecipeCard` (gemello del cuore dei preferiti): aggiunge la
 * ricetta a «Sto cucinando» senza aprirla. Se è già in lista apre il pannello.
 * La card è un link: il click non deve navigare.
 */
export function CookingButton({ recipeId }: { recipeId: number }) {
  const session = useCookingSession();
  const active = session.hydrated && isCooking(session, recipeId);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (active) {
      openCookingDock();
      return;
    }
    setLoading(true);
    setFailed(false);
    const ok = await addRecipeById(recipeId);
    setLoading(false);
    if (!ok) setFailed(true);
  };

  const label = active
    ? "Stai cucinando questa ricetta: apri il pannello"
    : failed
      ? "Non riuscito, riprova"
      : "Aggiungi a «Sto cucinando»";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={clsx(
        "flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm transition-colors",
        active
          ? "bg-orange-500/95 text-white hover:bg-orange-500"
          : failed
            ? "bg-rose-500/80 text-white hover:bg-rose-500"
            : "bg-black/50 text-white hover:bg-black/70"
      )}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <CookingPot size={14} />}
    </button>
  );
}
