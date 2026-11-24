"use client";

import { useId } from "react";

/**
 * Marchio dei menù: il «10» del logo AN10 in cui lo **0 diventa una cloche**. L'1 è il coltello del
 * logo identico (manico tondo, incavo, rivetti: stessa geometria di `An10Logo`), la cupola ha la
 * curva alta dell'uovo, il pomello è il pallino del tuorlo, sotto la linea del piatto e il vassoio.
 * Stesso tratto (26) e terminazioni tonde del logo; colore = `currentColor`.
 * Usato dove un menù non ha foto (piatto grande della card 8.5).
 */
export function An10MenuMark({ className, title = "" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="450 -4 264 264" className={className} role={title ? "img" : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : true}>
      <defs>
        {/* stacco fra lama e manico del coltello */}
        <mask id={`${id}-a`} maskUnits="userSpaceOnUse" x={400} y={-50} width={400} height={400}>
          <rect x={400} y={-50} width={400} height={400} fill="#fff" />
          <circle cx={512} cy={172} r={23} fill="#000" />
        </mask>
        {/* rivetti del manico */}
        <mask id={`${id}-b`} maskUnits="userSpaceOnUse" x={400} y={-50} width={400} height={400}>
          <rect x={400} y={-50} width={400} height={400} fill="#fff" />
          <circle cx={512} cy={188} r={4} fill="#000" />
          <circle cx={512} cy={204} r={4} fill="#000" />
        </mask>
      </defs>
      {/* 1 = coltello */}
      <g {...stroke} mask={`url(#${id}-a)`}>
        <path d="M470 82 L512 40 V172" strokeWidth={28} />
      </g>
      <g {...stroke} mask={`url(#${id}-b)`}>
        <path d="M512 172 V208" strokeWidth={28} />
      </g>
      {/* 0 = cloche: cupola con la curva dell'uovo, pomello = tuorlo, piatto e vassoio */}
      <g {...stroke}>
        <path d="M576 170 C576 104 598 66 632 66 C666 66 688 104 688 170" strokeWidth={26} />
        <path d="M556 172 H708" strokeWidth={26} />
        <path d="M572 208 H692" strokeWidth={18} />
      </g>
      <circle cx={632} cy={36} r={17} fill="currentColor" />
    </svg>
  );
}
