"use client";

import { clsx } from "clsx";
import { Lock, Search, ChevronDown } from "lucide-react";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

/**
 * Campi del restyle (tavola sezione 4). Sottili: altezza --h-field (34→40px), padding 0.6em.
 * Il testo digitato resta a 16px su touch (guardia anti-zoom iOS in globals.css): non forzare
 * `text-*` sui campi. Per i form admin fitti vedi `data-compact-fields` in CLAUDE.md.
 */
const box =
  "w-full min-w-0 rounded-[0.625rem] border border-blu-200 bg-white text-base text-blu-950 placeholder:text-grigio-chiaro " +
  "transition-[border-color,box-shadow] focus:outline-none focus:border-blu-600 focus:ring-[3px] focus:ring-blu-600/18 " +
  "disabled:bg-blu-100 disabled:text-grigio aria-invalid:border-rosa aria-invalid:ring-[3px] aria-invalid:ring-rosa/12";

/** 4.1–4.3 · contenitore con etichetta, aiuto ed errore. Passa l'id al campo tramite render prop. */
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const descId = hint || error ? `${id}-d` : undefined;
  return (
    <div className={clsx("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[0.8125rem] font-semibold text-grigio">
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": descId })}
      {(error || hint) && (
        <p id={descId} className={clsx("text-xs", error ? "text-rosa" : "text-grigio")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

/** 4.1 · campo di testo */
export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className, ...props },
  ref
) {
  return <input ref={ref} className={clsx(box, "h-(--h-field) px-[0.6em]", className)} {...props} />;
});

/** 4.6 · testo lungo: cresce, non ha altezza fissa */
export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
  { className, rows = 3, ...props },
  ref
) {
  return <textarea ref={ref} rows={rows} className={clsx(box, "px-[0.6em] py-[0.45em] leading-snug", className)} {...props} />;
});

/** 4.4 · scelta a tendina nativa (sul telefono apre il selettore di sistema) */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <div className={clsx("relative min-w-0", className)}>
      <select ref={ref} className={clsx(box, "h-(--h-field) appearance-none pr-[2em] pl-[0.6em]")} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-[0.6em] size-4 -translate-y-1/2 text-grigio" aria-hidden />
    </div>
  );
});

/** 4.5 · ricerca: fondo azzurro, nessun bordo */
export const SearchField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function SearchField(
  { className, ...props },
  ref
) {
  return (
    <div className={clsx("relative min-w-0", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-[0.65em] size-[1.05em] -translate-y-1/2 text-grigio" aria-hidden />
      <input
        ref={ref}
        type="search"
        className={clsx(box, "h-(--h-field) border-transparent bg-blu-100 pl-[2.1em] pr-[0.6em]")}
        {...props}
      />
    </div>
  );
});

/** 4.7 · valore calcolato in sola lettura (es. tempi automatici dai passi) */
export function ReadonlyValue({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "flex h-(--h-field) items-center gap-2 rounded-[0.625rem] border border-dashed border-blu-200 bg-blu-100 px-[0.6em] text-blu-800",
        className
      )}
    >
      <Lock className="size-[1em] shrink-0" aria-hidden />
      <span className="tabular truncate">{children}</span>
    </div>
  );
}
