"use client";

import { useId } from "react";
import { ClocheIcon } from "@/components/icons";
import { Letters } from "./An10Logo";

/**
 * Marchio dei menù: il simbolo «10» del logo AN10, **intatto**, con in testa l'icona dei menù
 * (`ClocheIcon` 5.23, la stessa della navigazione: nessun disegno nuovo) dritta sopra tutto il
 * «10» come un cappello. La cloche è in proporzione esatta: scalata ×13, il suo tratto (2 su 24)
 * diventa 26, lo stesso tratto del logo. Il «10» viene da `An10Logo` (`Letters`), la cloche dal componente
 * icona: se cambia uno dei due, il marchio segue. Colore = `currentColor`. Usato dove un menù
 * non ha foto (piatto grande della card 8.5, miniatura della testata del dettaglio menù).
 */
const HAT = 13; // la cloche (griglia 24) in unità del logo: tratto 2 × 13 = 26 = tratto del logo
export function An10MenuMark({ className, title = "" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="438 -186 288 418" className={className} role={title ? "img" : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : true}>
      <Letters id={id} part="10" />
      {/* il punto (12, 21) dell'icona, centro del vassoio, sta sopra il «10» (centrato fra 1 e 0) */}
      <ClocheIcon size={24 * HAT} x={582 - 12 * HAT} y={-6 - 21 * HAT} strokeWidth={2} overflow="visible" />
    </svg>
  );
}
