"use client";

import { useId } from "react";
import { Letters } from "./An10Logo";

/**
 * Marchio dei menù: il simbolo «10» del logo AN10, **intatto**, servito sotto una cloche.
 * Il logo non si tocca (stessa geometria di `An10Logo`, che fornisce le lettere): la cupola,
 * il pomello e il piatto gli stanno attorno con lo stesso tratto a vista (il simbolo è scalato,
 * quindi il tratto della cloche è quello del logo ridotto nella stessa proporzione) e le stesse
 * terminazioni tonde. Colore = `currentColor`. Usato dove un menù non ha foto (piatto grande della
 * card 8.5, miniatura della testata del dettaglio menù).
 */
const K = 0.42; // scala del simbolo dentro la cupola
const SW = 26 * K; // tratto della cloche = tratto del logo alla stessa scala

export function An10MenuMark({ className, title = "" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 240 216" className={className} role={title ? "img" : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : true}>
      {/* il simbolo «10» del logo, così com'è, sotto la cupola */}
      <svg x={120 - 131.5 * K} y={130 - 128 * K} width={264 * K} height={264 * K} viewBox="450 -4 264 264" overflow="visible">
        <Letters id={id} part="10" />
      </svg>
      {/* cloche: cupola, pomello, piatto */}
      <g {...stroke} strokeWidth={SW}>
        <path d="M22 182 C22 96 66 46 120 46 C174 46 218 96 218 182" />
        <path d="M10 190 H230" />
        <path d="M120 46 V34" />
      </g>
      <circle cx={120} cy={26} r={11} fill="currentColor" />
    </svg>
  );
}
