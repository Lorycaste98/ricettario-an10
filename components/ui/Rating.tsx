"use client";
import { Star, Sparkles } from "lucide-react";
import { ratingStyle } from "@/lib/review-style";

/** Selettore voto 1-10 touch-friendly: niente hover richiesto, un tap imposta il valore. */
export function RatingInput({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          aria-label={`${n} su 10`}
          aria-pressed={n === value}
          className={`flex h-9 items-center justify-center rounded-lg border text-sm font-bold transition-colors disabled:opacity-50 ${
            n <= value
              ? "border-orange-500 bg-orange-500 text-white"
              : "border-white/40 bg-white/40 text-sky-800 active:bg-white/70"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

/** Badge di sola lettura per un voto 1-10 già dato. */
export function RatingBadge({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const s = ratingStyle(rating);
  const small = size === "sm";
  const pad = small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";

  // Voto 10 — badge "top del top": gradiente smeraldo→teal + scintilla animata
  if (s.top) {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-600 bg-gradient-to-r from-emerald-500 to-teal-500 font-extrabold text-white shadow-sm shadow-emerald-500/30 [text-shadow:0_1px_2px_rgba(0,0,0,0.28)] ${pad}`}
      >
        <Sparkles size={small ? 10 : 12} fill="currentColor" className="rating-twinkle" />
        {rating}/10
      </span>
    );
  }

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border font-bold ${s.accent} ${pad}`}>
      <Star size={small ? 10 : 12} fill="currentColor" />
      {rating}/10
    </span>
  );
}
