"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
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
/** testo ricavato dal colore della categoria (anche per la testata delle card «Sto cucinando») */
export const categoryInk = ink;
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
      {more > 0 && <MoreCategories cats={cats} muted={muted} />}
    </span>
  );
}

/**
 * «+N ⓘ»: tocca e si apre un fumetto con tutte le categorie (in portale su `body`, posizione fissa
 * sotto il bottone, dentro lo schermo). La card è un link: il tocco non deve navigare.
 * Si chiude con un tocco fuori, Esc, scorrendo o ritoccando.
 */
function MoreCategories({ cats, muted }: { cats: Cat[]; muted?: boolean }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const open = pos !== null;

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (open) return setPos(null);
    const r = btn.current?.getBoundingClientRect();
    if (r) setPos({ x: r.left + r.width / 2, y: r.bottom + 6 });
  };

  // dentro lo schermo: si sposta di lato se sborda
  useLayoutEffect(() => {
    const el = pop.current;
    if (!el || !pos) return;
    const w = el.offsetWidth;
    const left = Math.min(Math.max(pos.x - w / 2, 8), window.innerWidth - w - 8);
    el.style.left = `${left}px`;
  }, [pos]);

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!pop.current?.contains(t) && !btn.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        btn.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={`Altre ${cats.length - 1} categorie: ${cats.slice(1).map((c) => c.name).join(", ")}`}
        className="hit-44 inline-flex shrink-0 items-center gap-[0.2em] rounded-[0.375rem] px-[0.3em] py-[0.15em] leading-tight font-bold text-blu-700 hover:bg-blu-150"
      >
        +{cats.length - 1}
        <Info className="size-[1.1em]" strokeWidth={2.4} aria-hidden />
      </button>
      {pos &&
        createPortal(
          <div
            ref={pop}
            role="dialog"
            aria-label="Categorie"
            // portale: gli eventi risalgono comunque l'albero React fino al link della card
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="ds fixed z-50 flex max-w-[min(18rem,calc(100vw-1rem))] flex-wrap gap-1.5 rounded-ctl border border-blu-150 bg-white p-2 text-[0.75rem] shadow-[0_10px_30px_oklch(25%_0.038_228/.18)] motion-safe:animate-[menu-in_160ms_ease-out]"
            style={{ top: pos.y, left: pos.x }}
          >
            {cats.map((c) => (
              <Label key={c.name} cat={c} muted={muted} />
            ))}
          </div>,
          document.body
        )}
    </>
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
