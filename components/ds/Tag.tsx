import { clsx } from "clsx";
import { ChefHat, EyeOff, Star } from "lucide-react";
import type { ReactNode } from "react";
import { CuttingBoardIcon, LadleIcon, RisingDoughIcon, StoveIcon } from "@/components/icons";

/**
 * Etichette del restyle (tavola sezione 6). Una sola forma (pill, 2em di altezza in em),
 * tante tinte; ogni tinta ha un solo significato (DESIGN.md D6).
 */
export type TagTone =
  | "prep" //    6.1 preparazione (azzurro)
  | "cook" //    6.1 cottura (arancio chiaro)
  | "wait" //    6.1 attesa (giallo)
  | "gold" //    6.2 voto ospiti
  | "mine" //    6.3 il mio voto
  | "hidden" //  6.4 non pronta
  | "optional" // 6.5 opzionale
  | "quick" //   6.6 veloce
  | "scale" //   6.8 dosi ricalcolate
  | "role" //    6.9 ruolo (superadmin)
  | "roleLight" // 6.9 ruolo (admin)
  | "over"; //   6.10 quantità oltre il totale

const TONE: Record<TagTone, string> = {
  prep: "bg-blu-120 text-blu-800",
  cook: "bg-cottura-50 text-cottura-ink",
  wait: "bg-giallo-100 text-giallo-ink",
  gold: "bg-oro-50 text-giallo-ink",
  mine: "bg-mio-50 text-mio-ink",
  hidden: "bg-neutro-50 text-grigio",
  optional: "border border-dashed border-blu-250 bg-white text-grigio",
  quick: "bg-arancio-50 text-cottura-ink",
  scale: "border border-arancio-200 bg-arancio-50 text-cottura-ink",
  role: "bg-blu-800 text-white",
  roleLight: "bg-blu-120 text-blu-800",
  over: "border border-rosa-200 bg-rosa-50 text-rosa",
};

export function Tag({
  tone,
  icon,
  children,
  className,
  title,
}: {
  tone: TagTone;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={clsx(
        "inline-flex h-[2em] max-w-full shrink-0 items-center gap-[0.4em] rounded-full px-[0.75em] text-[0.75rem] font-bold whitespace-nowrap [&_svg]:size-[1.15em] [&_svg]:shrink-0",
        TONE[tone],
        className
      )}
    >
      {icon}
      {children !== undefined && <span className="truncate">{children}</span>}
    </span>
  );
}

const KIND = {
  PREP: { tone: "prep", label: "Preparazione", Icon: CuttingBoardIcon },
  COOK: { tone: "cook", label: "Cottura", Icon: StoveIcon },
  WAIT: { tone: "wait", label: "Attesa", Icon: RisingDoughIcon },
} as const;

/** 6.1 · tipo di passo con i minuti già formattati dal chiamante (es. «1h 30min») */
export function StepKindTag({ kind, duration }: { kind: keyof typeof KIND; duration?: string }) {
  const k = KIND[kind];
  return (
    <Tag tone={k.tone} icon={<k.Icon />}>
      {duration ? `${k.label} · ${duration}` : k.label}
    </Tag>
  );
}

/** 6.2 · media voti ospiti (+ numero di recensioni) */
export function GuestRatingTag({ value, count }: { value: number; count?: number }) {
  return (
    <Tag tone="gold" icon={<Star />} title={count ? `Media ${value.toFixed(1)} su ${count} recensioni` : undefined}>
      <span className="tabular">{value.toFixed(1)}{count ? ` · ${count}` : ""}</span>
    </Tag>
  );
}

/** 6.3 · il mio voto (voto personale dell'admin, mai nella media pubblica) */
export function MyRatingTag({ value }: { value: number }) {
  return (
    <Tag tone="mine" icon={<ChefHat />} title={`Il mio voto: ${value}/10`}>
      <span className="tabular">{value}</span>
    </Tag>
  );
}

/** 6.4 · non pronta / non pronto */
export function HiddenTag({ label = "Non pronta", iconOnly = false }: { label?: string; iconOnly?: boolean }) {
  return <Tag tone="hidden" icon={<EyeOff />} title={label}>{iconOnly ? undefined : label}</Tag>;
}

/** 6.6 · ricetta veloce (solo nome, senza scheda) */
export function QuickRecipeTag({ label = "veloce" }: { label?: string }) {
  return <Tag tone="quick" icon={<LadleIcon />}>{label}</Tag>;
}

/** 6.7 · contatore (es. timer finiti). Rosa: richiede attenzione. */
export function Counter({ value, label }: { value: number; label: string }) {
  return (
    <span
      aria-label={label}
      className="tabular inline-flex h-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-full bg-rosa px-1.5 text-xs font-bold text-white"
    >
      {value}
    </span>
  );
}
