/**
 * Stile delle recensioni in base al voto (scala 1-10).
 * Condiviso tra dashboard admin, pagina recensioni e dettaglio ricetta/menù.
 *
 * 9-10 = oro che risalta (riflesso animato), poi sfumature sempre più tenui.
 */

export interface RatingStyle {
  /** Classi bordo + sfondo della card. */
  card: string;
  /** Classe colore del badge voto. */
  accent: string;
  /** True per i voti massimi (9-10): applica il riflesso dorato. */
  shine: boolean;
}

const STYLES: Record<number, RatingStyle> = {
  5: {
    card: "border-amber-300/80 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/70",
    accent: "text-amber-600 bg-amber-400/15 border-amber-300/50",
    shine: true,
  },
  4: {
    card: "border-amber-200/70 bg-amber-50/70",
    accent: "text-amber-600 bg-amber-400/10 border-amber-200/50",
    shine: false,
  },
  3: {
    card: "border-sky-200/70 bg-sky-50/70",
    accent: "text-sky-600 bg-sky-400/10 border-sky-200/50",
    shine: false,
  },
  2: {
    card: "border-orange-200/70 bg-orange-50/70",
    accent: "text-orange-600 bg-orange-400/10 border-orange-200/50",
    shine: false,
  },
  1: {
    card: "border-rose-200/70 bg-rose-50/70",
    accent: "text-rose-600 bg-rose-400/10 border-rose-200/50",
    shine: false,
  },
};

/** Voto (1-10) → stile. Bucket a coppie: 9-10, 7-8, 5-6, 3-4, 1-2. */
export function ratingStyle(rating: number): RatingStyle {
  const clamped = Math.max(1, Math.min(10, Math.round(rating)));
  const bucket = Math.ceil(clamped / 2);
  return STYLES[bucket];
}
