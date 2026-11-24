"use client";

import { useId, type CSSProperties } from "react";
import { Letters } from "./An10Logo";

/**
 * 9.6 · **Lente AN10**: la voce «Cerca» della navigazione (centro della barra in basso, cima della
 * barra laterale). Il simbolo «10» del logo, **intatto**, dentro il vetro di una lente con lo stesso
 * tratto del logo (26) e il manico a 45° come la lente di lucide. Uguale per visitatore e admin:
 * il cappello sopra la lente è stato provato e tolto (24/11/2026, schiacciato alle misure della
 * barra); «sei entrato» lo dicono il tono della barra e il cappello della quinta voce (D9).
 *
 * Si dimensiona in larghezza con `style` (altezza `auto`): nelle voci della barra la regola
 * `[&_svg]:size-…` la rimpicciolirebbe come le altre icone. Colore = `currentColor`.
 */
const CX = 582; // centro del «10» (viewBox del simbolo: 450 -4 264 264)
const CY = 128;
const R = 162; // raggio della lente (asse del tratto)

export function An10SearchMark({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const d = Math.SQRT1_2;
  return (
    <svg viewBox="407 -47 389 389" className={className} style={style} aria-hidden>
      <Letters id={id} part="10" />
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx={CX} cy={CY} r={R} strokeWidth={26} />
        <path d={`M${CX + R * d + 6} ${CY + R * d + 6} L781 327`} strokeWidth={30} />
      </g>
    </svg>
  );
}
