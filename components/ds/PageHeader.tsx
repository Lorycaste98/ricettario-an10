import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * 9.5 · testata di pagina, in due piani:
 * 1. **barra**: torna indietro (9.4) a sinistra, azioni a destra — sempre sulla stessa riga, così il
 *    titolo ha tutta la larghezza e non viene mai schiacciato dai bottoni;
 * 2. **titolo**: (miniatura) · titolo e dettagli.
 * Senza `back` (pagine delle liste) la barra non c'è e le azioni stanno a destra del titolo.
 * Le azioni sono il posto della VisibilityToggle (4.8) e, su contenitore stretto, del menù «⋯»
 * (3.14) con tutto il resto: la riga deve restare corta. Al massimo un primario arancio.
 */
export function PageHeader({
  title,
  meta,
  thumb,
  back,
  actions,
  className,
}: {
  title: ReactNode;
  /** dettagli sotto il titolo (2.6): una o più righe, es. categorie e «2h 8min · 6 porzioni» */
  meta?: ReactNode;
  /** miniatura quadrata (foto o logo), già dimensionata dal chiamante */
  thumb?: ReactNode;
  /** BackLink (9.4) */
  back?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={clsx("flex flex-col gap-3", className)}>
      {back && (
        <div className="flex min-h-(--h-sm) items-center justify-between gap-2">
          <div className="flex min-w-0">{back}</div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="flex items-center gap-3.5">
        {/* cx-hide: nella vista compatta dei dettagli la miniatura sparisce */}
        {thumb && <div className="cx-hide size-[clamp(3.75rem,12cqi,5rem)] shrink-0 overflow-hidden rounded-ctl">{thumb}</div>}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-(length:--fs-page) leading-tight font-bold text-pretty">{title}</h1>
          {meta && <div className="flex flex-col gap-1 text-(length:--fs-meta) text-grigio">{meta}</div>}
        </div>
        {/* senza «torna indietro» (pagine delle liste) le azioni stanno sulla riga del titolo, all'estremo opposto */}
        {!back && actions && <div className="flex shrink-0 items-center gap-2 self-center">{actions}</div>}
      </div>
    </header>
  );
}
