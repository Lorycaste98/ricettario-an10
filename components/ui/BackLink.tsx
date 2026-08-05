"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { entryLabel, usePreviousPage } from "@/lib/nav-history";

/** Classi del bottone "torna indietro": pill "vetro chiaro" alta 34px.
 *  Esportate per gli skeleton (`loading.tsx`), che devono avere la stessa forma. */
export const backLinkCls =
  "inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/50 bg-white/70 px-3 py-1.5 text-sm font-medium text-sky-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/90";

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
        <ArrowLeft size={16} className="shrink-0" />
        <span className="truncate">{backLabel}</span>
      </button>
    );
  }

  return (
    <Link href={href} title={label} className={cls}>
      <ArrowLeft size={16} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
