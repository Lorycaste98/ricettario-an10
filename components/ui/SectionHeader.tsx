import type { ReactNode } from "react";

/**
 * Header di sezione condiviso: badge a gradiente con icona + titolo (+ hint/azione).
 * Usato dal form ricetta/menù e dalle pagine di dettaglio per avere lo stesso
 * riferimento visivo (icona + titolo) ovunque.
 */

export const SECTION_TONES = {
  orange: "from-orange-400 to-rose-500 shadow-orange-500/30",
  sky: "from-sky-400 to-cyan-500 shadow-sky-500/30",
  violet: "from-violet-500 to-indigo-500 shadow-indigo-500/30",
  emerald: "from-emerald-400 to-teal-500 shadow-emerald-500/30",
  amber: "from-amber-400 to-orange-500 shadow-amber-500/30",
} as const;

export type SectionTone = keyof typeof SECTION_TONES;

export function SectionHeader({
  title,
  icon,
  tone = "sky",
  hint,
  size = "md",
  action,
  titleClassName = "text-sky-950",
  className = "",
}: {
  title: string;
  icon: ReactNode;
  tone?: SectionTone;
  hint?: string;
  /** "md" (form) badge 9×9; "lg" (dettaglio) badge 10×10 + titolo più grande. */
  size?: "md" | "lg";
  /** Contenuto allineato a destra (es. controllo porzioni, progresso). */
  action?: ReactNode;
  titleClassName?: string;
  className?: string;
}) {
  const badge = size === "lg" ? "h-10 w-10" : "h-9 w-9";
  const titleSize = size === "lg" ? "text-lg sm:text-xl font-bold" : "text-base font-semibold";
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span
        className={`flex ${badge} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${SECTION_TONES[tone]}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className={`${titleSize} ${titleClassName} leading-tight`}>{title}</h2>
        {hint && <p className="text-xs text-sky-600/80">{hint}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
