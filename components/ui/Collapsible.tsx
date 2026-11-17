"use client";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

/**
 * Pannello a comparsa (accordion singolo, restyle fase 8): riga `blu-50` sempre visibile che fa
 * da interruttore + contenuto animato con la tecnica grid-rows (0fr↔1fr, anima l'altezza "auto").
 * I figli restano montati (così i caroselli misurano bene la larghezza) ma diventano `inert` da
 * chiusi (fuori dal tab order).
 */
export function Collapsible({
  header,
  children,
  defaultOpen = false,
  className,
}: {
  /** Contenuto dell'header (a sinistra del chevron), reso dentro il bottone-toggle. */
  header: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={clsx("overflow-hidden rounded-ctl border border-blu-150 bg-blu-50", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-blu-100"
      >
        <span className="min-w-0 flex-1">{header}</span>
        <ChevronDown
          aria-hidden
          className={clsx("size-[1.125rem] shrink-0 text-blu-600 transition-transform duration-300 motion-reduce:transition-none", open && "rotate-180")}
        />
      </button>
      <div
        className={clsx(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden" inert={!open || undefined}>
          <div className="px-3 pt-0.5 pb-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
