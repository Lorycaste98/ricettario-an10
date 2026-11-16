import { clsx } from "clsx";
import { Check, Timer } from "lucide-react";
import type { ReactNode } from "react";

/** Messaggi (tavola sezione 10). La finestra di conferma (10.1) resta `components/ui/Modal`, restilizzata nella fase 2. */

/** 10.2 · avviso breve (presentazionale: il chiamante decide quando mostrarlo e toglierlo) */
export function Toast({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div
      role="status"
      className={clsx("inline-flex items-center gap-2.5 rounded-[0.875rem] bg-blu-950 px-4 py-3 text-[0.875rem] text-white shadow-lg", className)}
    >
      <Check className="size-4 shrink-0" aria-hidden />
      <span>{children}</span>
      {action && <span className="ml-2 font-bold text-blu-300">{action}</span>}
    </div>
  );
}

/** 10.3 · niente da mostrare: icona, titolo, frase e (al massimo) un'azione */
export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-2 rounded-card border border-dashed border-blu-200 bg-white px-5 py-6 text-center text-grigio [&>svg]:size-7 [&>svg]:text-blu-700",
        className
      )}
    >
      {icon}
      <p className="font-bold text-blu-950">{title}</p>
      {children && <p className="max-w-[32ch] text-[0.875rem]">{children}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** 10.4 · avviso dentro la pagina (es. «Dosi ricalcolate ×1,5») con un'azione a destra */
export function Banner({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2.5 rounded-[0.875rem] border border-arancio-200 bg-arancio-50 px-3 py-2 text-[0.875rem] text-cottura-ink",
        className
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

/** 10.5 · timer finito: giallo pieno, si vede da lontano */
export function TimerAlert({ title, detail, action }: { title: ReactNode; detail?: ReactNode; action?: ReactNode }) {
  return (
    // Su spazio stretto l'azione va a capo sotto il testo invece di schiacciarlo
    <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card bg-giallo-400 px-3.5 py-3 text-[oklch(30%_0.06_85)]">
      <Timer className="size-6 shrink-0" aria-hidden />
      <div className="min-w-[9rem] flex-1">
        <p className="font-bold">{title}</p>
        {detail && <p className="text-xs">{detail}</p>}
      </div>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
