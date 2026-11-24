"use client";

import { useId } from "react";
import { ChefHat } from "lucide-react";
import { Letters } from "./An10Logo";

/**
 * Marchio «sei entrato» (D9): il simbolo «10» del logo AN10, **intatto**, con in testa il cappello
 * da cuoco (`ChefHat` di lucide, la stessa icona della quinta voce della navigazione) dritto sopra
 * come un cappello. Gemello di `An10MenuMark`: stessa costruzione, stessa scala ×13 (tratto 2 su 24
 * → 26, il tratto del logo), appoggio centrato fra 1 e 0. Nessun disegno nuovo: se cambia il logo o
 * l'icona, il marchio segue. Il cappello sta un po' più staccato dal «10» rispetto alla cloche
 * (−30 invece di −6): con la base piatta, appoggiato, sembrava una riga in più del logo.
 * Colore = `currentColor`. Usato in cima alla barra laterale quando l'admin è entrato (il visitatore vede il «10» semplice).
 */
const HAT = 13;
export function An10ChefMark({ className, title = "" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="438 -280 288 540" className={className} role={title ? "img" : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : true}>
      <Letters id={id} part="10" />
      {/* il punto (12, 21) dell'icona, bordo inferiore del cappello, sta sopra il «10» (centrato fra 1 e 0) */}
      <ChefHat size={24 * HAT} x={582 - 12 * HAT} y={-30 - 21 * HAT} strokeWidth={2} overflow="visible" />
    </svg>
  );
}
