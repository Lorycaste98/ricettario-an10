import { Star, Sparkles } from "lucide-react";

/**
 * Badge compatto voto+conteggio usato nell'header dei gruppi di recensioni
 * (per data nelle ricette, per ricetta nei menù) — identico ovunque.
 */
export function RatingCountBadge({ avg, count }: { avg: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Star size={11} fill="currentColor" className="text-amber-400" />
      {avg.toFixed(1)}/10
      <span className="text-sky-600/70">
        · {count} recension{count === 1 ? "e" : "i"}
      </span>
    </span>
  );
}

/**
 * Riepilogo numerico del totale recensioni per l'header della card principale:
 * solo la media (senza "/10") con una stella diversa (`Sparkles`) da quella dei
 * badge dei gruppi, + il conteggio. Stile "stat" volutamente diverso dalle
 * sotto-card per non risultare ripetitivo. Identico tra ricette e menù.
 */
export function ReviewsSummary({ avg, count }: { avg: number; count: number }) {
  return (
    <span className="flex shrink-0 items-center gap-2 rounded-xl border border-rose-200/70 bg-rose-50/70 px-2.5 py-1 sm:gap-2.5 sm:px-3 sm:py-1.5">
      <span className="flex items-center gap-1">
        <Sparkles size={16} className="text-rose-400" />
        <span className="text-xl font-extrabold tabular-nums text-rose-600 sm:text-2xl">{avg.toFixed(1)}</span>
      </span>
      <span className="h-7 w-px bg-rose-200/80" />
      <span className="flex flex-col leading-none">
        <span className="text-sm font-bold tabular-nums text-sky-950">{count}</span>
        <span className="text-[10px] text-sky-500">recension{count === 1 ? "e" : "i"}</span>
      </span>
    </span>
  );
}
