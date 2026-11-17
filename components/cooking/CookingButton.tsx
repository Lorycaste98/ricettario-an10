"use client";
import { useState } from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import { PotIcon } from "@/components/icons";
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
        // 3.10 / 3.11 · bottone tondo su foto: bianco, attivo = arancio
        "flex size-8 items-center justify-center rounded-full shadow-sm transition-colors",
        active
          ? "bg-arancio-pieno text-white hover:bg-arancio-scuro"
          : failed
            ? "bg-rosa text-white"
            : "bg-white/95 text-blu-800 hover:bg-white"
      )}
    >
      {loading ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" /> : <PotIcon size={17} />}
    </button>
  );
}
