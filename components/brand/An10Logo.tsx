"use client";

import { useId } from "react";

/**
 * Logo AN10 — ogni lettera nasconde un oggetto di cucina:
 * A = mattarello (la traversa), N = forchetta (i rebbi in cima), 1 = coltello (manico tondo + lama incavata),
 * 0 = uovo con il pallino. Stessa geometria dei file in `public/brand/` (generati da
 * `docs/design/loghi/kit/build_kit.py`): se cambi una coordinata qui, cambiala anche lì.
 *
 * Colore = `currentColor`: si colora con le classi di testo (`text-…`). I tre ritagli (stacco del
 * mattarello, incavo della lama, rivetti) sono maschere, quindi restano trasparenti su qualunque fondo.
 * Le maschere hanno id unici per istanza (`useId`): più loghi nella stessa pagina non si disturbano.
 */
export type An10LogoVariant = "orizzontale" | "impilato" | "simbolo";

const VIEWBOX: Record<An10LogoVariant, string> = {
  orizzontale: "0 10 720 236",
  impilato: "0 10 436 462",
  simbolo: "450 -4 264 264",
};

const S = 26; // tratto delle lettere
const EGG =
  "M632 40 C672 40 694 96 694 146 C694 190 668 218 632 218 C596 218 570 190 570 146 C570 96 592 40 632 40 Z";

/** Le lettere del logo (senza `<svg>` attorno), per comporle dentro altri marchi (`An10MenuMark`). */
export function Letters({ id, part }: { id: string; part: "AN" | "10" | "tutto" }) {
  const an = part !== "10";
  const ten = part !== "AN";
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <>
      <defs>
        <mask id={`${id}-a`} maskUnits="userSpaceOnUse" x={-50} y={-50} width={900} height={400}>
          <rect x={-50} y={-50} width={900} height={400} fill="#fff" />
          {an && <path d="M50 162 H190" stroke="#000" strokeWidth={S + 12} strokeLinecap="round" />}
          {ten && <circle cx={512} cy={172} r={23} fill="#000" />}
        </mask>
        <mask id={`${id}-b`} maskUnits="userSpaceOnUse" x={-50} y={-50} width={900} height={400}>
          <rect x={-50} y={-50} width={900} height={400} fill="#fff" />
          {ten && (
            <>
              <circle cx={512} cy={188} r={4} fill="#000" />
              <circle cx={512} cy={204} r={4} fill="#000" />
            </>
          )}
        </mask>
      </defs>
      <g {...stroke} mask={`url(#${id}-a)`}>
        {an && (
          <>
            <path d="M40 220 L120 36 L200 220" strokeWidth={S} />
            <path d="M270 220 V36 L400 220 V84" strokeWidth={S} />
            <path d="M382 36 V84 M400 36 V70 M418 36 V84" strokeWidth={12} />
            <path d="M382 84 Q400 100 418 84" strokeWidth={12} />
          </>
        )}
        {ten && (
          <>
            <path d="M470 82 L512 40 V172" strokeWidth={28} />
            <path d={EGG} strokeWidth={S} />
            <circle cx={632} cy={140} r={17} fill="currentColor" stroke="none" />
          </>
        )}
      </g>
      <g {...stroke} mask={`url(#${id}-b)`}>
        {an && (
          <>
            <path d="M60 162 H180" strokeWidth={S} />
            <path d="M18 162 H36 M204 162 H222" strokeWidth={14} />
          </>
        )}
        {ten && <path d="M512 172 V208" strokeWidth={28} />}
      </g>
    </>
  );
}

export function An10Logo({
  variant = "orizzontale",
  title = "AN10 · Ricettario",
  className,
}: {
  variant?: An10LogoVariant;
  /** Testo alternativo; passa `""` se il logo è decorativo (c'è già il nome accanto). */
  title?: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox={VIEWBOX[variant]}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title || undefined}
    >
      {variant === "orizzontale" && <Letters id={id} part="tutto" />}
      {variant === "simbolo" && <Letters id={id} part="10" />}
      {variant === "impilato" && (
        <>
          <Letters id={`${id}-an`} part="AN" />
          <g transform="translate(-364.5 226)">
            <Letters id={`${id}-10`} part="10" />
          </g>
        </>
      )}
    </svg>
  );
}
