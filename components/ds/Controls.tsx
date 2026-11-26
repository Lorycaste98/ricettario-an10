"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Controlli del restyle (tavola 4.8–4.13).
 * Regola (DESIGN.md D4): la visibilità «pronta / non pronta» è SEMPRE l'occhio (VisibilityToggle);
 * la levetta (Switch) è solo per le impostazioni.
 */

/**
 * 4.8 · occhio animato: aperto = pronta, chiuso con la barra = non pronta. Disegnato sulla griglia
 * di lucide (24, tratto 2): palpebra di sopra e di sotto come due archi, pupilla, tre ciglia e la
 * barra. Il passaggio è nelle classi `.eye-*` di `app/globals.css` (fermo con «Riduci movimento»).
 */
export function AnimatedEye({ closed, className }: { closed: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      data-closed={closed}
      className={clsx("eye", className)}
    >
      <path d="M2 12Q12 22 22 12" />
      <path className="eye-lid" d="M2 12Q12 2 22 12" />
      <circle className="eye-pupil" cx="12" cy="12" r="3" />
      <g className="eye-lash">
        <path d="M7 15.8 5.7 18.3M12 17v2.8M17 15.8l1.3 2.5" />
      </g>
      <path className="eye-bar" d="M3.5 3.5 20.5 20.5" pathLength={1} />
    </svg>
  );
}

/**
 * 4.8 · visibilità pronta / non pronta. Angoli da bottone piccolo (10px, come 3.9 e il «torna
 * indietro» 9.4): è un'azione, non un'etichetta.
 * - `compact` = solo icona sempre (righe di tabella);
 * - `iconOnlyNarrow` = solo icona su contenitore < 620px, con la scritta da lì in su (testate 9.5).
 * La scritta non cambia di colpo: le due etichette stanno sovrapposte nella stessa cella, quindi il
 * bottone ha **sempre la larghezza della più lunga** («Non pronta») e non si allarga né si stringe;
 * al cambio la vecchia esce e la nuova entra rotolando (non pronta sale da sotto, pronta scende da
 * sopra), insieme all'occhio che si chiude o si apre. Fermo con «Riduci movimento».
 */
export function VisibilityToggle({
  published,
  onToggle,
  disabled,
  compact = false,
  iconOnlyNarrow = false,
  labels = { on: "Pronta", off: "Non pronta" },
  className,
}: {
  published: boolean;
  onToggle: () => void;
  disabled?: boolean;
  compact?: boolean;
  iconOnlyNarrow?: boolean;
  labels?: { on: string; off: string };
  className?: string;
}) {
  const text = published ? labels.on : labels.off;
  const label = "col-start-1 row-start-1 transition-[opacity,translate] duration-[260ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={published}
      aria-label={text}
      title={published ? `${labels.on}: visibile ai visitatori. Tocca per nasconderla.` : `${labels.off}: nascosta ai visitatori. Tocca per pubblicarla.`}
      disabled={disabled}
      onClick={onToggle}
      className={clsx(
        "hit-44 inline-flex h-(--h-sm) shrink-0 items-center justify-center gap-[0.4em] overflow-hidden rounded-[0.625rem] border text-[0.875rem] font-bold transition-colors duration-300 disabled:cursor-progress",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35 [&_svg]:size-[1.2em] [&_svg]:shrink-0",
        compact ? "w-(--h-sm)" : "pr-[0.85em] pl-[0.6em]",
        iconOnlyNarrow && !compact && "@max-[620px]:w-(--h-sm) @max-[620px]:px-0",
        published
          ? "border-verde-200 bg-verde-50 text-verde hover:brightness-[.97]"
          : "border-dashed border-blu-200 bg-neutro-50 text-grigio hover:bg-blu-100",
        className
      )}
    >
      <AnimatedEye closed={!published} />
      {!compact && (
        <span aria-hidden className={clsx("grid", iconOnlyNarrow && "@max-[620px]:hidden")}>
          <span className={clsx(label, published ? "opacity-100" : "-translate-y-[0.9em] opacity-0")}>{labels.on}</span>
          <span className={clsx(label, published ? "translate-y-[0.9em] opacity-0" : "opacity-100")}>{labels.off}</span>
        </span>
      )}
    </button>
  );
}

/** 4.9 · spunta (ingredienti, lista spesa, selezione righe). Area toccabile ≥ 44px tramite il padding del label. */
export function Checkbox({
  checked,
  onChange,
  label,
  hideLabel = false,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={clsx("inline-flex cursor-pointer items-center gap-2.5", disabled && "cursor-not-allowed opacity-50", className)}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className={clsx(
          "inline-flex size-6 shrink-0 items-center justify-center rounded-[0.4375rem] border-2 transition-colors",
          "peer-focus-visible:ring-[3px] peer-focus-visible:ring-blu-600/35",
          checked ? "border-verde bg-verde text-white" : "border-blu-250 bg-white"
        )}
      >
        {checked && <Check className="size-4" strokeWidth={3} />}
      </span>
      <span className={clsx(hideLabel && "sr-only")}>{label}</span>
    </label>
  );
}

/** 4.10 · schede a segmenti (es. Ingredienti / Procedura su iPhone, filtri admin) */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={clsx("flex rounded-[0.6875rem] bg-blu-120 p-[3px]", className)}
      // Tastiera come un gruppo di radio: Tab entra sulla scelta attiva, le frecce cambiano scelta
      onKeyDown={(e) => {
        const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const i = options.findIndex((o) => o.value === value);
        const next = options[(i + step + options.length) % options.length];
        onChange(next.value);
        const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]");
        buttons[options.indexOf(next)]?.focus();
      }}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        // nessuna scelta attiva (valore fuori elenco): il primo resta raggiungibile con Tab
        const tabbable = on || (i === 0 && !options.some((x) => x.value === value));
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={tabbable ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={clsx(
              "hit-44 flex h-[calc(var(--h-field)-6px)] flex-1 items-center justify-center gap-[0.3em] rounded-[0.5rem] px-[0.75em] text-[0.875rem] font-semibold whitespace-nowrap transition-colors [&_svg]:size-[1.05em]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blu-600/40",
              on ? "bg-white text-blu-950 shadow-[0_1px_2px_oklch(25%_0.038_228/.12)]" : "text-blu-800 hover:bg-white/50"
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 4.11 · chip di filtro (attivo = blu scuro). `dot` = colore della categoria. `count` = quante
 * ricette (filtri a faccette 4.14); `disabled` = scelta che non darebbe risultati (tinta, mai opacità).
 */
export function Chip({
  active = false,
  onClick,
  dot,
  icon,
  count,
  disabled = false,
  children,
  onRemove,
  removeLabel = "Togli",
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  dot?: string;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
  children: ReactNode;
  /** se presente mostra la ✕ (11.7, categorie e tag scelti nel form) */
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}) {
  const base = clsx(
    "inline-flex h-(--h-sm) shrink-0 items-center gap-[0.4em] rounded-full border px-[0.85em] text-[0.875rem] font-semibold whitespace-nowrap transition-colors [&_svg]:size-[1.05em]",
    active
      ? "border-blu-800 bg-blu-800 text-white"
      : disabled
        ? "cursor-not-allowed border-dashed border-blu-200 bg-transparent text-grigio-chiaro"
        : "border-blu-200 bg-white text-blu-950 hover:bg-blu-100",
    className
  );
  const inner = (
    <>
      {dot && <span aria-hidden className="size-[0.6em] shrink-0 rounded-full" style={{ background: dot }} />}
      {icon}
      {children}
      {count !== undefined && (
        <span className={clsx("tabular font-normal", active ? "text-nav-ink" : disabled ? "text-grigio-chiaro" : "text-grigio")}>{count}</span>
      )}
    </>
  );
  if (onRemove) {
    return (
      <span className={base}>
        {inner}
        <button type="button" onClick={onRemove} aria-label={removeLabel} className="hit-44 -mr-[0.35em] rounded-full p-[0.2em] hover:bg-blu-150">
          <svg viewBox="0 0 24 24" className="size-[1em]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </span>
    );
  }
  return (
    <button type="button" aria-pressed={active} onClick={onClick} disabled={disabled} className={clsx("hit-44", base)}>
      {inner}
    </button>
  );
}

/** 4.12 · voto 1-10 a bottoni (ospiti e «il mio voto») */
export function RatingInput({
  value,
  onChange,
  label = "Voto da 1 a 10",
}: {
  value: number | null;
  onChange: (v: number) => void;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid max-w-full grid-cols-[repeat(10,minmax(1.75rem,2.375rem))] gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const on = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(n)}
            className={clsx(
              "tabular h-(--h-btn) rounded-[0.5625rem] border font-bold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35",
              on ? "border-arancio-pieno bg-arancio-pieno text-white" : "border-blu-200 bg-white hover:bg-blu-100"
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

/** 4.13 · interruttore a levetta, SOLO per impostazioni (schermo acceso, sezioni, statistiche) */
export function Switch({
  checked,
  onChange,
  label,
  hideLabel = false,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  hideLabel?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className={clsx("inline-flex cursor-pointer items-center gap-2.5 text-[0.875rem]", disabled && "cursor-not-allowed opacity-50")}>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className={clsx(
          "relative h-[1.625rem] w-[2.75rem] shrink-0 rounded-full transition-colors peer-focus-visible:ring-[3px] peer-focus-visible:ring-blu-600/35",
          checked ? "bg-verde" : "bg-blu-200"
        )}
      >
        <span
          className={clsx(
            "absolute top-[3px] size-5 rounded-full bg-white shadow-[0_1px_3px_oklch(25%_0.038_228/.25)] transition-[left] motion-reduce:transition-none",
            checked ? "left-[calc(100%-1.25rem-3px)]" : "left-[3px]"
          )}
        />
      </span>
      <span className={clsx(hideLabel && "sr-only")}>{label}</span>
    </label>
  );
}
