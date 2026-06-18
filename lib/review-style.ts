/**
 * Stile delle recensioni in base al voto (stelle).
 * Condiviso tra dashboard admin, pagina recensioni e dettaglio ricetta.
 *
 * 5★ = oro che risalta (riflesso animato), poi sfumature sempre più tenui.
 */

export interface RatingStyle {
  /** Classi bordo + sfondo della card. */
  card: string;
  /** Classe colore delle stelle. */
  star: string;
  /** True per il voto massimo: applica il riflesso dorato. */
  shine: boolean;
}

const STYLES: Record<number, RatingStyle> = {
  5: {
    card: "border-amber-300/80 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/70",
    star: "text-amber-400 drop-shadow-[0_1px_2px_rgba(245,158,11,0.45)]",
    shine: true,
  },
  4: {
    card: "border-amber-200/70 bg-amber-50/70",
    star: "text-amber-400",
    shine: false,
  },
  3: {
    card: "border-sky-200/70 bg-sky-50/70",
    star: "text-sky-400",
    shine: false,
  },
  2: {
    card: "border-orange-200/70 bg-orange-50/70",
    star: "text-orange-400",
    shine: false,
  },
  1: {
    card: "border-rose-200/70 bg-rose-50/70",
    star: "text-rose-400",
    shine: false,
  },
};

export function ratingStyle(rating: number): RatingStyle {
  const r = Math.max(1, Math.min(5, Math.round(rating)));
  return STYLES[r];
}
