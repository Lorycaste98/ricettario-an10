import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Scheda di sezione delle pagine di dettaglio (lista spesa, costi, note, recensioni): bianca,
 * bordo blu-150, titolo 2.3 con icona opzionale e azioni a destra. Spazi interni in em.
 * `tone="note"` = fondo giallo-100 delle note (13.7): il giallo qui è «appunto», come nella tavola.
 */
export function Panel({
  title,
  icon,
  meta,
  actions,
  tone = "default",
  id,
  className,
  children,
}: {
  title: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  tone?: "default" | "note";
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={clsx(
        "flex min-w-0 scroll-mt-24 flex-col gap-[0.9em] rounded-card border p-[1em]",
        tone === "note" ? "border-giallo-400/60 bg-giallo-100" : "border-blu-150 bg-white",
        className
      )}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {icon && (
          <span className={clsx("flex size-[1.25em] shrink-0 [&>svg]:size-full", tone === "note" ? "text-giallo-ink" : "text-blu-700")} aria-hidden>
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-(length:--fs-sec) leading-tight font-bold">{title}</h2>
          {meta && <p className="text-(length:--fs-meta) text-grigio">{meta}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}
