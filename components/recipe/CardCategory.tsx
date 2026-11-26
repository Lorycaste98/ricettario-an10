import { clsx } from "clsx";

/**
 * 6.13 · etichetta di categoria: nome su fondo tinto col colore della categoria (scelta il 26/11/2026
 * fra pallino, occhiello, filetto e fascia). Stessa etichetta sulla card 8.1, sulla riga 8.10 e
 * nella testata del dettaglio 9.5. Nelle liste sta **in fondo**: dice a che categoria appartiene la
 * ricetta, ma non è l'informazione principale.
 *
 * Il colore della categoria lo sceglie l'admin (esadecimale libero): testo e fondo si ricavano con
 * `color-mix` in oklch — verso il nero per il testo (contrasto), verso il bianco per il fondo.
 */
type Cat = { name: string; color: string };

const ink = (c: string) => `color-mix(in oklch, ${c} 62%, black)`;
const tint = (c: string) => `color-mix(in oklch, ${c} 14%, white)`;
/** non pronta: grigio al posto del colore, come il resto della card */
const MUTED = "oklch(60% 0.01 228)";

function Label({ cat, muted }: { cat: Cat; muted?: boolean }) {
  const color = muted ? MUTED : cat.color;
  return (
    <span
      className="min-w-0 truncate rounded-[0.375rem] px-[0.5em] py-[0.15em] leading-tight font-bold"
      style={{ background: tint(color), color: ink(color) }}
    >
      {cat.name}
    </span>
  );
}

/**
 * Card e righe delle liste: una riga sola, la prima categoria e «+N» se ce ne sono altre.
 * La misura del testo la dà il chiamante (`className`).
 */
export function CategoryLabel({ cats, muted, className }: { cats: Cat[]; muted?: boolean; className?: string }) {
  if (cats.length === 0) return null;
  const more = cats.length - 1;
  return (
    <span className={clsx("flex max-w-full min-w-0 items-center gap-1", className)}>
      <Label cat={cats[0]} muted={muted} />
      {more > 0 && <span className="shrink-0 font-bold text-grigio">+{more}</span>}
    </span>
  );
}

/** Testata del dettaglio (9.5): tutte le categorie, vanno a capo. */
export function HeaderCategories({ cats }: { cats: Cat[] }) {
  return (
    <span className="flex flex-wrap gap-1.5 text-[0.8125rem]">
      {cats.map((c) => (
        <Label key={c.name} cat={c} />
      ))}
    </span>
  );
}
