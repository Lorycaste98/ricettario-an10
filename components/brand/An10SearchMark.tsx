"use client";

import { useId, type CSSProperties } from "react";
import { ChefHat } from "lucide-react";
import { Letters } from "./An10Logo";

/**
 * 9.6 · **Lente AN10**: la voce «Cerca» della navigazione (centro della barra in basso, cima della
 * barra laterale). Il simbolo «10» del logo, **intatto**, dentro il vetro di una lente con lo stesso
 * tratto del logo (26) e il manico a 45° come la lente di lucide. Con `chef` (sei entrato, D9) la
 * lente porta in testa il cappello da cuoco (`ChefHat` di lucide, come `An10ChefMark`), un po' più
 * piccolo (×10 invece di ×13) per non schiacciare la lente nella barra.
 *
 * Si dimensiona **in larghezza** (`w-…`, altezza automatica): così la lente resta della stessa misura
 * con e senza cappello, e il cappello cresce verso l'alto. Colore = `currentColor`.
 */
const CX = 582; // centro del «10» (viewBox del simbolo: 450 -4 264 264)
const CY = 128;
const R = 162; // raggio della lente (asse del tratto)
const HAT = 10;
const W = 389;
const TOP_LENS = -47;
const TOP_HAT = -268;

export function An10SearchMark({ chef = false, className, style }: { chef?: boolean; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const top = chef ? TOP_HAT : TOP_LENS;
  const d = Math.SQRT1_2;
  return (
    <svg viewBox={`407 ${top} ${W} ${342 - top}`} className={className} style={style} aria-hidden>
      <Letters id={id} part="10" />
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx={CX} cy={CY} r={R} strokeWidth={26} />
        <path d={`M${CX + R * d + 6} ${CY + R * d + 6} L781 327`} strokeWidth={30} />
      </g>
      {chef && <ChefHat size={24 * HAT} x={CX - 12 * HAT} y={TOP_LENS - 14 - 21 * HAT} strokeWidth={2.6} overflow="visible" />}
    </svg>
  );
}
