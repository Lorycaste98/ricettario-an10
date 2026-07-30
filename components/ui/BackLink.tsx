import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Classi del bottone "torna indietro": pill "vetro chiaro" alta 34px.
 *  Esportate per gli skeleton (`loading.tsx`), che devono avere la stessa forma. */
export const backLinkCls =
  "inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/50 bg-white/70 px-3 py-1.5 text-sm font-medium text-sky-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/90";

/** Bottone "torna indietro" condiviso (dettaglio ricetta, dettaglio menù,
 *  modalità cucina): unico stile, così non si confonde con lo sfondo a gradiente. */
export function BackLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`${backLinkCls}${className ? ` ${className}` : ""}`}>
      <ArrowLeft size={16} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
