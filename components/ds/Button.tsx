"use client";

import { clsx } from "clsx";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "@/components/ds/button-classes";

export { buttonClasses, rowIconCls, type ButtonSize, type ButtonVariant } from "@/components/ds/button-classes";

/**
 * Bottoni del restyle (tavola sezione 3). Misure fluide: --h-btn (38→44px), --h-btn-lg (44→54px),
 * --h-sm (30→34px). Padding e icone in em, così seguono il testo del bottone.
 * Regola (DESIGN.md D2): **una sola azione arancio per zona**.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, icon, className, children, disabled, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
});

function Spinner() {
  return (
    <svg className="animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** 3.10 · 3.11 · 3.12 — bottone con sola icona. `label` obbligatoria: è il nome per lo screen reader. */
export function IconButton({
  label,
  active = false,
  tone = "neutral",
  shape = "round",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  active?: boolean;
  tone?: "neutral" | "danger";
  shape?: "round" | "square";
  /** md = 38→44px (3.10) · row = 30px, azioni di riga admin (3.12) */
  size?: "md" | "row";
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={props["aria-pressed"]}
      className={clsx(
        "hit-44 inline-flex shrink-0 items-center justify-center border transition-colors",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35 disabled:opacity-50",
        size === "md" ? "size-(--h-icon) [&_svg]:size-5" : "size-[1.875rem] rounded-[0.5625rem] [&_svg]:size-4",
        size === "md" && (shape === "round" ? "rounded-full" : "rounded-ctl"),
        active
          ? "border-arancio-pieno bg-arancio-pieno text-white"
          : clsx("border-blu-200 bg-white hover:bg-blu-100", tone === "danger" ? "text-rosa" : "text-blu-800"),
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** 3.13 · stepper dosi − valore + (bersagli grandi, usabili con le mani occupate) */
export function Stepper({
  value,
  onDecrement,
  onIncrement,
  decrementLabel = "Meno",
  incrementLabel = "Più",
  disableDecrement,
}: {
  value: ReactNode;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementLabel?: string;
  incrementLabel?: string;
  disableDecrement?: boolean;
}) {
  const btn =
    "inline-flex size-(--h-btn) items-center justify-center rounded-ctl border border-blu-200 bg-white text-xl font-bold text-blu-800 hover:bg-blu-100 disabled:opacity-40";
  return (
    <div className="inline-flex items-center gap-2.5 font-bold">
      <button type="button" className={btn} onClick={onDecrement} aria-label={decrementLabel} disabled={disableDecrement}>
        −
      </button>
      <span className="tabular min-w-[3ch] text-center">{value}</span>
      <button type="button" className={btn} onClick={onIncrement} aria-label={incrementLabel}>
        +
      </button>
    </div>
  );
}
