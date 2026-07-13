import { Zap } from "lucide-react";
import { clsx } from "clsx";

/**
 * Etichetta ricetta "veloce": comanda da cucina — un tagliando dal bordo
 * strappato agganciato a una clip, come le comande appese al pass. Stesso
 * linguaggio visivo di PriceTag (clip-path + micro-SVG), tema cucina invece
 * che negozio. Riusabile ovunque venga segnalata una ricetta `quick`.
 */
export function QuickTag({ label = "veloce", className }: { label?: string; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center align-middle whitespace-nowrap", className)}>
      {/* Clip che aggancia il tagliando al pass */}
      <svg width="7" height="12" viewBox="0 0 7 12" aria-hidden className="shrink-0 -mr-px text-orange-500/80">
        <path d="M6 1 H2.5 a1.5 1.5 0 0 0 -1.5 1.5 v6 a1.5 1.5 0 0 0 1.5 1.5 H6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {/* Tagliando con bordo strappato */}
      <span
        className="relative inline-flex items-center gap-1 bg-orange-100 py-px pl-1.5 pr-2.5 text-[10px] font-semibold leading-4 text-orange-700 ring-1 ring-inset ring-orange-200/70"
        style={{ clipPath: "polygon(0 0, 88% 0, 100% 20%, 88% 40%, 100% 60%, 88% 80%, 100% 100%, 0 100%)" }}
      >
        <Zap size={9} className="shrink-0" />
        {label}
      </span>
    </span>
  );
}
