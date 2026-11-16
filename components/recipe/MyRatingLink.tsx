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
      className="inline-flex h-(--h-sm) w-fit items-center gap-1.5 rounded-full bg-mio-50 px-3 text-[0.875rem] font-semibold text-mio-ink transition-colors hover:brightness-[.97]"
    >
      <ChefHat size={15} className="shrink-0" aria-hidden />
      {rating != null ? (
        <>
          Il mio voto <span className="tabular font-bold">{rating}/10</span>
        </>
      ) : (
        <span>Dai il tuo voto</span>
      )}
    </button>
  );
}
