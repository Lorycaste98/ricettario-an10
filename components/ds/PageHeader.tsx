import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * 9.5 · testata di pagina: (miniatura) · titolo e dettagli · azioni a destra.
 * Su contenitore stretto le azioni vanno a capo sotto il titolo. Le azioni sono il posto della
 * VisibilityToggle (4.8), di Modifica (3.4) e delle IconButton (3.10); al massimo un primario arancio.
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
  /** riga di dettagli (2.6), es. «Pane · 2h 22min · 1 teglia» */
  meta?: ReactNode;
  /** miniatura quadrata (foto o logo), già dimensionata dal chiamante */
  thumb?: ReactNode;
  /** BackLink (9.4) sopra il titolo */
  back?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={clsx("flex flex-col gap-2.5", className)}>
      {back && <div>{back}</div>}
      <div className="flex flex-wrap items-center gap-3">
        {thumb && <div className="size-[clamp(2.75rem,8cqi,3.75rem)] shrink-0 overflow-hidden rounded-ctl">{thumb}</div>}
        <div className="min-w-0 flex-1">
          <h1 className="text-(length:--fs-page) leading-tight font-bold text-pretty">{title}</h1>
          {meta && <p className="text-(length:--fs-meta) text-grigio">{meta}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
