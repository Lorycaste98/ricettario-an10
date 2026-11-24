import { clsx } from "clsx";

/**
 * 6.11 · medaglia del voto ospiti appoggiata sul bordo del piatto (`RecipeCard` «Piatto» e
 * `RecipeRow` «Carta»):
 * tondo giallo con il bordo bianco, dietro il numero una **stella piena** di un giallo più scuro
 * (colore pieno, non trasparenza) che si intravede senza coprire le cifre.
 * Posizione e misura le decide il chiamante con `className` (sempre `absolute …` sul bordo del
 * piatto, più la larghezza; il resto scala in `em`/%). Niente `relative` qui: vincerebbe sull'`absolute`.
 * Il numero è in `em` del font-size impostato dal chiamante.
 */
export function RatingMedal({
  value,
  count,
  muted = false,
  className,
}: {
  value: number;
  count: number;
  /** ricetta non pronta: medaglia spenta (grigio-azzurro), come il resto della card/riga */
  muted?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "tabular flex aspect-square items-center justify-center rounded-full leading-none font-extrabold shadow-[0_0_0_3px_white,0_3px_6px_-2px_oklch(25%_0.038_228/.35)]",
        muted ? "bg-blu-120 text-grigio" : "bg-giallo-400 text-blu-950",
        className
      )}
      title={`Media ${value.toFixed(1)} su ${count} ${count === 1 ? "recensione" : "recensioni"}`}
    >
      {/* stella del progetto: cinque punte arrotondate, giallo più scuro, dietro il numero */}
      <svg viewBox="0 0 100 100" aria-hidden className={clsx("absolute inset-[9%] size-[82%]", muted ? "text-blu-200" : "text-[oklch(81%_0.165_86)]")}>
        <path
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinejoin="round"
          d="M50 7 L62.3 35.4 L93.1 38.2 L69.9 58.6 L76.6 88.8 L50 73 L23.4 88.8 L30.1 58.6 L6.9 38.2 L37.7 35.4 Z"
        />
      </svg>
      <span className="relative">{value.toFixed(1)}</span>
    </span>
  );
}
