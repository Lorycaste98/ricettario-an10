/**
 * Stile delle recensioni in base al voto (scala 1-10).
 * Condiviso tra dashboard admin, pagina recensioni e dettaglio ricetta/menù.
 *
 * Ogni voto ha il **suo** colore: rampa divergente rosso→verde in 10 passi,
 * modulando tonalità + shade + saturazione così anche i vicini si distinguono
 * (es. 7 green-100 vs 8 green-200, 9 emerald vs 10 smeraldo/teal). Estremi più
 * intensi, centro più tenue. Badge sempre leggibile (text scuro su bg chiaro).
 *
 * Il **voto 10** è il "top del top": card con alone + glow + sheen animato
 * (`rating-top`) e badge a gradiente scintillante (vedi RatingBadge) — si capisce
 * a colpo d'occhio che è il massimo, senza nemmeno leggere il numero.
 */

export interface RatingStyle {
  /** Classi bordo + sfondo (+ eventuale alone) della card. */
  card: string;
  /** Classe colore del badge voto. */
  accent: string;
  /** True solo per il voto 10: trattamento "top" (alone + sheen + scintille). */
  top: boolean;
}

// Un colore per ogni voto 1-9 (il 10 è TOP_STYLE). 1 = rosso intenso → 9 = smeraldo.
const STYLES: Record<number, Omit<RatingStyle, "top">> = {
  1: {
    card: "border-red-400 bg-gradient-to-br from-red-100 to-red-200/70",
    accent: "text-red-900 bg-red-200 border-red-400",
  },
  2: {
    card: "border-red-300 bg-gradient-to-br from-red-50 to-red-100/70",
    accent: "text-red-800 bg-red-100 border-red-300",
  },
  3: {
    card: "border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100/70",
    accent: "text-orange-800 bg-orange-100 border-orange-300",
  },
  4: {
    card: "border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/70",
    accent: "text-amber-900 bg-amber-100 border-amber-300",
  },
  5: {
    card: "border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100/70",
    accent: "text-yellow-800 bg-yellow-100 border-yellow-300",
  },
  6: {
    card: "border-lime-300 bg-gradient-to-br from-lime-50 to-lime-100/70",
    accent: "text-lime-800 bg-lime-100 border-lime-300",
  },
  7: {
    card: "border-green-300 bg-gradient-to-br from-green-50 to-green-100/70",
    accent: "text-green-800 bg-green-100 border-green-300",
  },
  8: {
    card: "border-green-500 bg-gradient-to-br from-green-100 to-green-200/70",
    accent: "text-green-900 bg-green-200 border-green-500",
  },
  9: {
    card: "border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/70",
    accent: "text-emerald-800 bg-emerald-100 border-emerald-300",
  },
};

// Voto 10 — card ricca (smeraldo→teal) con alone + glow su cui gira lo sheen.
const TOP_STYLE: Omit<RatingStyle, "top"> = {
  card: "border-emerald-400 bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 ring-2 ring-emerald-300/60 shadow-lg shadow-emerald-500/30",
  accent: "text-emerald-800 bg-emerald-100 border-emerald-300",
};

/** Voto (1-10) → stile. Un colore per voto; il 10 è il caso "top". */
export function ratingStyle(rating: number): RatingStyle {
  const clamped = Math.max(1, Math.min(10, Math.round(rating)));
  if (clamped === 10) return { ...TOP_STYLE, top: true };
  return { ...STYLES[clamped], top: false };
}
