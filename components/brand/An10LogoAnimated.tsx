import { useId } from "react";

/**
 * Logo AN10 orizzontale **animato** (restyle fase 8), dal kit `docs/design/loghi/kit/logo-animato.html`:
 * le lettere si disegnano, poi arrivano mattarello, forchetta, coltello e uovo. Dura ~1,6 s, parte una
 * volta al montaggio e non si ripete mai (regola: solo nei momenti speciali, oggi la pagina di accesso).
 * Con `prefers-reduced-motion` il logo è fermo. Stessa geometria di `An10Logo` e di `public/brand/`.
 * Colore = `currentColor`. Classi e animazioni in `app/globals.css` (prefisso `an10a-`).
 */
export function An10LogoAnimated({
  className,
  title = "AN10",
  play = "in",
}: {
  className?: string;
  title?: string;
  /**
   * `in` = si disegna (default); `out` = al contrario, in ~0,65 s (uovo e posate escono, le lettere si
   * cancellano); `still` = fermo e intero (stesso disegno, per poterlo poi far uscire con `out`).
   * Usato anche dal logo che passa fra testata e fila «Sto cucinando» (`ShellBrand` in AppShell).
   */
  play?: "in" | "out" | "still";
}) {
  const id = useId().replace(/:/g, "");
  const m1 = `${id}-m1`;
  const m2 = `${id}-m2`;
  return (
    <svg viewBox="0 10 720 236" className={`overflow-visible ${play === "out" ? "an10a-out" : play === "still" ? "an10a-still" : ""} ${className ?? ""}`} role="img" aria-label={title}>
      <defs>
        <mask id={m1} maskUnits="userSpaceOnUse" x={-400} y={-400} width={1600} height={1000}>
          <rect x={-400} y={-400} width={1600} height={1000} fill="#fff" />
          <g className="an10a-pin">
            <path d="M50 162 H190" stroke="#000" strokeWidth={38} strokeLinecap="round" />
          </g>
          <g className="an10a-blade">
            <circle cx={512} cy={172} r={23} fill="#000" />
          </g>
        </mask>
        <mask id={m2} maskUnits="userSpaceOnUse" x={-400} y={-400} width={1600} height={1000}>
          <rect x={-400} y={-400} width={1600} height={1000} fill="#fff" />
          <g className="an10a-handle">
            <circle cx={512} cy={188} r={4} fill="#000" />
            <circle cx={512} cy={204} r={4} fill="#000" />
          </g>
        </mask>
      </defs>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" mask={`url(#${m1})`}>
        <path className="an10a-draw" pathLength={1} d="M40 220 L120 36 L200 220" strokeWidth={26} />
        <path className="an10a-draw an10a-d2" pathLength={1} d="M270 220 V36 L400 220 V84" strokeWidth={26} />
        <g className="an10a-fork">
          <path d="M382 36 V84 M400 36 V70 M418 36 V84" strokeWidth={12} />
          <path d="M382 84 Q400 100 418 84" strokeWidth={12} />
        </g>
        <g className="an10a-blade">
          <path d="M470 82 L512 40 V172" strokeWidth={28} />
        </g>
        <g className="an10a-egg">
          <path
            d="M632 40 C672 40 694 96 694 146 C694 190 668 218 632 218 C596 218 570 190 570 146 C570 96 592 40 632 40 Z"
            strokeWidth={26}
          />
        </g>
        <circle className="an10a-yolk" cx={632} cy={140} r={17} fill="currentColor" stroke="none" />
      </g>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" mask={`url(#${m2})`}>
        <g className="an10a-pin">
          <path d="M60 162 H180" strokeWidth={26} />
          <path d="M18 162 H36 M204 162 H222" strokeWidth={14} />
        </g>
        <g className="an10a-handle">
          <path d="M512 172 V208" strokeWidth={28} />
        </g>
      </g>
    </svg>
  );
}
