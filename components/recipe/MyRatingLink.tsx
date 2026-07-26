"use client";
import { ChefHat } from "lucide-react";

/**
 * Badge "Il mio voto" in cima al dettaglio ricetta (solo admin): mostra il voto
 * personale e, al click, scorre con animazione fino alla card «Il mio voto».
 * Sfondo pieno (non trasparente) per restare leggibile sopra lo sfondo a gradiente.
 */
export function MyRatingLink({
  rating,
  targetId = "mio-voto",
}: {
  rating: number | null;
  targetId?: string;
}) {
  const scrollToCard = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={scrollToCard}
      className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-300/70 bg-sky-100/90 px-3.5 py-2 text-sm font-medium text-sky-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-sky-200/90"
    >
      <ChefHat size={15} className="shrink-0 text-sky-600" />
      {rating != null ? (
        <>
          Il mio voto <span className="font-bold text-sky-900">{rating}/10</span>
        </>
      ) : (
        <span className="text-sky-700">Dai il tuo voto</span>
      )}
    </button>
  );
}
