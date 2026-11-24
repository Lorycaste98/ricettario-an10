"use client";

import { useId } from "react";
import { ClocheIcon } from "@/components/icons";
import { Letters } from "./An10Logo";

/**
 * Marchio dei menù: il simbolo «10» del logo AN10, **intatto**, con in testa l'icona dei menù
 * (`ClocheIcon` 5.23, la stessa della navigazione: nessun disegno nuovo) appoggiata sullo 0 e
 * inclinata come un cappello. Il «10» viene da `An10Logo` (`Letters`), la cloche dal componente
 * icona: se cambia uno dei due, il marchio segue. Colore = `currentColor`. Usato dove un menù
 * non ha foto (piatto grande della card 8.5, miniatura della testata del dettaglio menù).
 */
const HAT = 8; // la cloche (griglia 24) in unità del logo: 24 × 8 = 192
export function An10MenuMark({ className, title = "" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="430 -108 300 336" className={className} role={title ? "img" : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : true}>
      <Letters id={id} part="10" />
      {/* il punto (12, 21) dell'icona, centro del vassoio, sta appena sopra l'uovo */}
      <g transform="translate(636 6) rotate(-12)">
        <ClocheIcon size={24 * HAT} x={-12 * HAT} y={-21 * HAT} strokeWidth={2.6} overflow="visible" />
      </g>
    </svg>
  );
}
