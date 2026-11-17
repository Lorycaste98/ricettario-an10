import { clsx } from "clsx";

/**
 * Classi dei bottoni del restyle (tavola sezione 3), fuori da `Button.tsx` (modulo client) perché
 * servono anche ai server component: link con l'aspetto di un bottone, azioni di riga.
 */
export type ButtonVariant =
  | "primary" //   3.2 · azione principale (arancio)
  | "secondary" // 3.4 · bianco con bordo
  | "tonal" //     3.5 · azzurro
  | "ghost" //     3.6 · solo testo
  | "danger" //    3.7 · elimina, contorno rosa
  | "dangerSolid"; // conferma di eliminazione (10.1)
export type ButtonSize = "sm" | "md" | "lg"; // 3.9 · 3.2 · 3.1

const VARIANT: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-arancio text-white hover:bg-arancio-scuro active:bg-arancio-scuro",
  secondary: "bg-white border-blu-200 text-blu-950 hover:bg-blu-100",
  tonal: "border-transparent bg-blu-120 text-blu-800 hover:bg-blu-150",
  ghost: "border-transparent text-blu-700 hover:bg-blu-100 px-[0.4em]!", // blu-700: ≥ 4.5:1 anche sul fondo blu-50
  danger: "bg-white border-rosa-200 text-rosa hover:bg-rosa-50",
  dangerSolid: "border-transparent bg-rosa text-white hover:brightness-95",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "hit-44 h-(--h-sm) px-[0.8em] text-[0.875rem] rounded-[0.625rem]",
  md: "h-(--h-btn) px-[1.05em] text-(length:--fs-body) rounded-ctl",
  lg: "h-(--h-btn-lg) px-[1.3em] text-[calc(var(--fs-body)+1px)] font-bold rounded-ctl",
};

/** Classi di un bottone: servono anche ai link che hanno l'aspetto di un bottone (es. «+ Nuova»). */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return clsx(
    // il colore del bordo lo dà la variante: con un `border-transparent` qui vinceva sempre lui
    "inline-flex shrink-0 items-center justify-center gap-[0.45em] border font-semibold whitespace-nowrap",
    "transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35",
    "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-neutro-50 disabled:text-grigio-chiaro",
    "[&_svg]:size-[1.15em] [&_svg]:shrink-0",
    VARIANT[variant],
    SIZE[size],
    className
  );
}

/** Classi di un'icona-bottone di riga (3.12, 30px): per i link (Modifica) accanto a `IconButton size="row"`. */
export const rowIconCls =
  "hit-44 inline-flex size-[1.875rem] shrink-0 items-center justify-center rounded-[0.5625rem] border border-blu-200 bg-white text-blu-800 transition-colors hover:bg-blu-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35 [&_svg]:size-4";

