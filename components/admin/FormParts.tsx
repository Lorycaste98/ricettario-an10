"use client";

import { clsx } from "clsx";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ds/Button";
import { VisibilityToggle } from "@/components/ds/Controls";
import { CuttingBoardIcon, RisingDoughIcon, StoveIcon } from "@/components/icons";
import type { StepKind } from "@/lib/types";
import { STEP_KIND_LABEL } from "@/lib/types";

/**
 * Pezzi dei form di Gestione (tavola sezione 11), condivisi da `RecipeForm` e `MenuForm`.
 * Le misure dei controlli di riga sono quelle della tavola: 30px (1.875rem) per campi,
 * bottoni icona e maniglia, così ogni riga si legge come un blocco solo.
 */

/** Campo di riga (11.3, 11.4): più basso dei campi normali, testo dal knob `--field-font-size` del form */
export const rowFieldCls =
  "h-[1.875rem] min-w-0 rounded-[0.5rem] border border-blu-200 bg-white px-[0.5em] text-blu-950 placeholder:text-grigio-chiaro " +
  "transition-[border-color,box-shadow] focus:border-blu-600 focus:outline-none focus:ring-[3px] focus:ring-blu-600/18";

/**
 * 11.1 · barra del form, resta in alto. Tutta la larghezza del contenuto (i margini negativi
 * annullano il padding di `main`) e, sul telefono, sotto la fascia del notch.
 * Contenitore stretto: ✕ al posto di «Annulla» e occhio senza testo.
 */
export function FormBar({
  title,
  published,
  onTogglePublished,
  publishedLabels,
  onCancel,
  saving,
  saveLabel = "Salva",
}: {
  title: string;
  published: boolean;
  onTogglePublished: () => void;
  publishedLabels?: { on: string; off: string };
  onCancel: () => void;
  saving: boolean;
  saveLabel?: string;
}) {
  return (
    <div
      className="sticky top-0 z-30 mb-(--gap) flex items-center gap-2 border-b border-blu-150 bg-white px-(--pad) pb-2 shadow-[0_6px_18px_oklch(25%_0.038_228/.06)]"
      style={{
        // annulla il padding alto di `main` (stessa espressione di AppShell) e scende sotto il notch
        marginTop: "calc(-1 * max(2rem, calc(env(safe-area-inset-top, 0px) + 1rem)))",
        marginLeft: "calc(-1 * var(--main-px))",
        marginRight: "calc(-1 * max(var(--main-px), env(safe-area-inset-right, 0px)))",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
      }}
    >
      <button
        type="button"
        onClick={onCancel}
        aria-label="Annulla"
        className="-ml-1 inline-flex size-(--h-sm) shrink-0 items-center justify-center rounded-full text-blu-800 hover:bg-blu-100 @min-[620px]:hidden"
      >
        <X className="size-5" aria-hidden />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-(length:--fs-sec) font-bold">{title}</h1>
      <VisibilityToggle
        published={published}
        onToggle={onTogglePublished}
        labels={publishedLabels}
        className="@max-[619px]:hidden"
      />
      <VisibilityToggle
        published={published}
        onToggle={onTogglePublished}
        labels={publishedLabels}
        compact
        className="@min-[620px]:hidden"
      />
      <Button variant="secondary" onClick={onCancel} className="@max-[619px]:hidden">
        Annulla
      </Button>
      <Button type="submit" loading={saving}>
        {saveLabel}
      </Button>
    </div>
  );
}

/** 11.2 · blocco del form: scheda bianca con icona su quadratino azzurro, titolo e coda a destra */
export function FormCard({
  title,
  icon,
  aside,
  className,
  children,
}: {
  title: ReactNode;
  icon: ReactNode;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={clsx("min-w-0 rounded-card border border-blu-150 bg-white px-[1em] py-[0.875em]", className)}>
      <header className="mb-[0.6em] flex flex-wrap items-center gap-x-[0.5em] gap-y-1">
        <span
          aria-hidden
          className="flex size-[1.875rem] shrink-0 items-center justify-center rounded-[0.5625rem] bg-blu-120 text-blu-800 [&_svg]:size-[1.1rem]"
        >
          {icon}
        </span>
        <h2 className="text-(length:--fs-sec) leading-tight font-bold">{title}</h2>
        {aside && (
          <div className="ml-auto flex items-center gap-[0.5em] text-[0.8125rem] font-semibold text-grigio">{aside}</div>
        )}
      </header>
      {children}
    </section>
  );
}

/**
 * Chip piccolo dei form (opzionale, ingredienti del passo, «+ ingrediente»): tratteggiato da spento,
 * azzurro pieno da acceso. Se ha `onRemove` mostra la ✕.
 */
export function MiniChip({
  active = false,
  onClick,
  onRemove,
  removeLabel = "Togli",
  icon,
  tone = "default",
  title,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  icon?: ReactNode;
  /** `over` = quantità oltre il totale (6.10) */
  tone?: "default" | "over";
  title?: string;
  children: ReactNode;
}) {
  const cls = clsx(
    "inline-flex h-[1.625rem] max-w-full shrink-0 items-center gap-[0.25em] rounded-full border px-[0.6em] text-[0.75rem] font-bold whitespace-nowrap transition-colors [&_svg]:size-[1.1em] [&_svg]:shrink-0",
    tone === "over"
      ? "border-rosa-200 bg-rosa-50 text-rosa"
      : active
        ? "border-blu-200 bg-blu-120 text-blu-800"
        : "border-dashed border-blu-250 bg-white text-grigio hover:bg-blu-100 hover:text-blu-800"
  );
  if (onRemove) {
    return (
      <span className={clsx(cls, "pr-[0.2em]")} title={title}>
        {icon}
        <span className="truncate">{children}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="inline-flex size-[1.25rem] shrink-0 items-center justify-center rounded-full hover:bg-white/70"
        >
          <X aria-hidden />
        </button>
      </span>
    );
  }
  if (!onClick) {
    return (
      <span className={cls} title={title}>
        {icon}
        <span className="truncate">{children}</span>
      </span>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-pressed={active} title={title} className={cls}>
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}

const KIND_ICON = { PREP: CuttingBoardIcon, COOK: StoveIcon, WAIT: RisingDoughIcon } as const;

/** 11.4 · tipo di passo con le icone del progetto (tagliere, fornello, impasto che lievita) */
export function StepKindPicker({ value, onChange }: { value: StepKind; onChange: (k: StepKind) => void }) {
  return (
    <div role="radiogroup" aria-label="Tipo di passo" className="flex shrink-0 rounded-[0.5625rem] bg-blu-120 p-[2px]">
      {(Object.keys(KIND_ICON) as StepKind[]).map((k) => {
        const Icon = KIND_ICON[k];
        const on = k === value;
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={STEP_KIND_LABEL[k]}
            title={STEP_KIND_LABEL[k]}
            onClick={() => onChange(k)}
            className={clsx(
              "flex h-[1.625rem] w-[1.875rem] items-center justify-center rounded-[0.4375rem] text-blu-800 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blu-600/40",
              on ? "bg-white shadow-[0_1px_2px_oklch(25%_0.038_228/.15)]" : "hover:bg-white/50"
            )}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}

/** Messaggio d'errore del form (rosa = errore) */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-[0.875rem] border border-rosa-200 bg-rosa-50 px-3 py-2 text-[0.875rem] font-semibold text-rosa">
      {children}
    </div>
  );
}

/** 11.6 · tendina di «cerca e crea» (ingrediente, categoria, tag) */
export const dropdownCls =
  "absolute left-0 top-full z-50 mt-1 max-h-60 w-full min-w-[15rem] overflow-y-auto rounded-[0.75rem] border border-blu-200 bg-white p-1 shadow-[0_10px_26px_oklch(25%_0.038_228/.14)]";
export const dropdownItemCls =
  "flex w-full items-center gap-2 rounded-[0.5rem] px-2.5 py-2 text-left text-[0.9375rem] text-blu-950 transition-colors hover:bg-blu-100 disabled:opacity-50";
/** voce «Crea …» in fondo alla tendina */
export const dropdownNewCls = "font-semibold text-blu-600 [&_svg]:size-4 [&_svg]:shrink-0";
