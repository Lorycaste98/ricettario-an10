import { clsx } from "clsx";

/**
 * Etichetta stile "cartellino del negozio con il filo": filo curvo + cartellino
 * con punta e foro. CSS-only (clip-path) + micro-SVG per il filo, nessuna dipendenza.
 * Riusabile ovunque serva marcare qualcosa (default: ingrediente "opzionale").
 */
export function PriceTag({ label = "opzionale", className }: { label?: string; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center align-middle whitespace-nowrap", className)}>
      {/* Filo */}
      <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden className="shrink-0 -mr-px text-amber-400/80">
        <path d="M1 9 Q 5 -1 11 5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {/* Cartellino con punta e foro */}
      <span
        className="relative inline-flex items-center rounded-r bg-amber-100 py-px pl-3.5 pr-1.5 text-[10px] font-semibold leading-4 text-amber-800 ring-1 ring-inset ring-amber-200/70"
        style={{ clipPath: "polygon(9px 0, 100% 0, 100% 100%, 9px 100%, 0 50%)" }}
      >
        {/* Foro del cartellino */}
        <span className="absolute left-[5px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white ring-1 ring-amber-300" />
        {label}
      </span>
    </span>
  );
}
