"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { entryLabel, usePreviousPage } from "@/lib/nav-history";

/** Classi del bottone "torna indietro" (tavola 9.4): bianco alto --h-sm (30→34px), angoli da bottone piccolo (10px, come 3.9: è un bottone, non una pill).
 *  Esportate per gli skeleton (`loading.tsx`), che devono avere la stessa forma. */
export const backLinkCls =
  "inline-flex h-(--h-sm) max-w-full items-center gap-1 rounded-[0.625rem] border border-blu-200 bg-white pr-[0.9em] pl-[0.55em] text-[0.875rem] font-semibold text-blu-800 transition-colors hover:bg-blu-100";

/**
 * Bottone "torna indietro" condiviso (dettaglio ricetta, dettaglio menù,
 * modalità cucina): unico stile, così non si confonde con lo sfondo a gradiente.
 *
 * Comportamento: se sappiamo da dove si è arrivati (cronologia interna, vedi
 * `lib/nav-history.ts`) il tasto fa un vero `router.back()` e mostra il nome di
 * quella pagina; altrimenti (link condiviso, refresh, ingresso diretto) resta il
 * link canonico `href`/`label`. Così arrivando su una ricetta dal dettaglio di un
 * menù si torna al menù, non alla lista di tutte le ricette.
 */
export function BackLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const previous = usePreviousPage();
  const cls = `${backLinkCls}${className ? ` ${className}` : ""}`;

  if (previous) {
    const backLabel = entryLabel(previous);
    return (
      <button type="button" onClick={() => router.back()} title={`Torna a ${backLabel}`} className={cls}>
        <ChevronLeft size={18} className="shrink-0" aria-hidden />
        <span className="truncate">{backLabel}</span>
      </button>
    );
  }

  return (
    <Link href={href} title={label} className={cls}>
      <ChevronLeft size={18} className="shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}
