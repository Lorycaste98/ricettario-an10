"use client";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Pannello a comparsa (accordion singolo): header sempre visibile che fa da
 * toggle + contenuto animato in apertura/chiusura con la tecnica grid-rows
 * (0fr↔1fr, anima l'altezza "auto"). I figli restano montati (così i caroselli
 * misurano bene la larghezza) ma diventano `inert` da chiusi (fuori dal tab order).
 */
export function Collapsible({
  header,
  children,
  defaultOpen = false,
  className = "",
}: {
  /** Contenuto dell'header (a sinistra del chevron), reso dentro il bottone-toggle. */
  header: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`overflow-hidden rounded-xl border border-white/50 bg-white/40 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-white/50"
      >
        <span className="min-w-0 flex-1">{header}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-sky-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden" inert={!open || undefined}>
          <div className="px-3 pb-3.5 pt-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
}
