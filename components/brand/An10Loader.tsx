"use client";

import { useId } from "react";
import { Letters } from "./An10Logo";

/**
 * 10.6 · **loader AN10**: il simbolo «10» del logo, intatto, dentro l'anello della lente (9.6) che
 * gira come un arco. Si posa al centro della zona del contenuto, sopra gli skeleton dei `loading.tsx`
 * (`PageLoader`), su un tondo bianco. Compare dopo 200 ms: un caricamento veloce mostra solo lo
 * skeleton, senza lampi. Insieme al tondo arriva una **velatura scura** sulla pagina (stato
 * «disattivo» finché non è caricata): la navigazione resta sopra (z 40) e si può usare.
 * Con «Riduci movimento» l'arco sta fermo.
 */
const CX = 582;
const CY = 128;
const R = 162;

export function An10Loader({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  // quadrato centrato sull'anello (raggio 162 + metà tratto 13): la lente del Cerca ha il manico, qui no
  return (
    <svg viewBox="407 -47 350 350" className={className} aria-hidden>
      <circle cx={CX} cy={CY} r={R} fill="none" strokeWidth={26} className="stroke-blu-150" />
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        strokeWidth={26}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="26 74"
        className="origin-center animate-spin stroke-blu-600 [transform-box:fill-box] motion-reduce:animate-none"
      />
      <g className="text-blu-800">
        <Letters id={id} part="10" />
      </g>
    </svg>
  );
}

/** Loader posato al centro dello spazio del contenuto (fuori dalla barra laterale e dalla barra in basso). */
export function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Caricamento"
      className="pointer-events-none fixed inset-0 z-20 grid animate-[skeleton-reveal_.25s_ease-out_.2s_both] place-items-center bg-blu-950/30 pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] min-[700px]:pb-0 min-[700px]:pl-[calc(clamp(4.5rem,calc(4.5rem+12*var(--f)),5.25rem)+env(safe-area-inset-left,0px))]"
    >
      <div className="grid size-[4.75rem] place-items-center rounded-full border border-blu-150 bg-white shadow-[0_10px_30px_oklch(25%_0.038_228/.16)]">
        <An10Loader className="size-[3.25rem]" />
      </div>
    </div>
  );
}
