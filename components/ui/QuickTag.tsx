import { clsx } from "clsx";

/**
 * Contaminuti a pomodoro: il glifo della ricetta "veloce".
 *
 * Disegnato su viewBox 16 e reso a 13px. È il **quadrante chiaro con la
 * lancetta** a farlo leggere come timer e non come semplice pomodoro: provato
 * anche con uno spicchio bianco di "tempo rimasto", ma a questa dimensione
 * diventava un tasto play. Colori letterali e non `currentColor`, perché è un
 * oggetto: sono il rosso del pomodoro e il verde del picciolo a renderlo
 * riconoscibile a colpo d'occhio.
 */
function TomatoTimer() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden className="shrink-0">
      {/* Corpo */}
      <circle cx="8" cy="9.4" r="5.4" fill="#e0483d" />
      {/* Quadrante */}
      <circle cx="8" cy="9.4" r="3.2" fill="#fff7ed" />
      {/* Lancetta */}
      <path d="M7.9 9.5L10.1 7.5" stroke="#9a2b22" strokeWidth="1.4" strokeLinecap="round" />
      {/* Foglie + picciolo */}
      <path d="M8 4.4C6.6 4.4 5.5 3.8 5 2.9 6.5 2.6 7.6 3.3 8 4.4Z" fill="#3f8f3a" />
      <path d="M8 4.4C9.4 4.4 10.5 3.8 11 2.9 9.5 2.6 8.4 3.3 8 4.4Z" fill="#3f8f3a" />
      <path d="M8 3.9V2.4" stroke="#3f8f3a" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Etichetta ricetta "veloce": pill semplice + contaminuti a pomodoro.
 * Niente forme ritagliate sul contorno — i tentativi con `clip-path` (comanda
 * strappata, bandierina su stuzzicadenti) a 10px si impastavano. La personalità
 * sta tutta nel glifo, il contenitore resta una pill leggibile. Label
 * parametrica ma da tenere **corta**: è un chip inline, non una frase.
 */
export function QuickTag({ label = "veloce", className }: { label?: string; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex max-w-full items-center gap-1 rounded-full bg-orange-100 py-px pl-1 pr-2 align-middle text-[10px] font-semibold leading-4 text-orange-700 ring-1 ring-inset ring-orange-200/80",
        className
      )}
    >
      <TomatoTimer />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
