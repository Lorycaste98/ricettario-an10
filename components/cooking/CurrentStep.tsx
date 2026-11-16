import { clsx } from "clsx";
import type { ReactNode } from "react";
import { StepKindTag } from "@/components/ds/Tag";
import { StepNumber } from "@/components/ds/Progress";
import { formatMinutes, type StepKind } from "@/lib/types";

/**
 * 8.7 · passo corrente: bordo arancio, tipo di passo (6.1) in alto, numero 7.2 «adesso», testo
 * grande, sotto «Ti servono» e le azioni (timer + «Fatto»). Unico per dettaglio ricetta
 * (`RecipeProcedure`), modalità cucina (`MenuCookMode`) e pannello «Sto cucinando» (`CookingDock`).
 * `tags` = etichette in più accanto al tipo (es. «inizia alle 19:20»); `size="sm"` per le card
 * affiancate e il pannello, dove il testo grande ruberebbe troppo spazio.
 */
export function CurrentStep({
  n,
  kind,
  mins,
  text,
  tags,
  needs,
  footer,
  actions,
  size = "lg",
  as: As = "div",
  className,
}: {
  n: number;
  kind: StepKind;
  mins: number | null;
  text: string;
  tags?: ReactNode;
  /** riga «Ti servono» già composta (quantità in arancio) */
  needs?: ReactNode;
  /** nota sotto il testo (es. «Prossimo passo alle 19:40») */
  footer?: ReactNode;
  actions?: ReactNode;
  size?: "lg" | "sm";
  as?: "div" | "li";
  className?: string;
}) {
  const showKind = kind !== "PREP" || !!mins;
  return (
    <As className={clsx("min-w-0 rounded-card border-2 border-arancio bg-white p-[0.875em]", className)}>
      {(showKind || tags) && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {showKind && <StepKindTag kind={kind} duration={mins ? formatMinutes(mins) : undefined} />}
          {tags}
        </div>
      )}
      <div className="flex gap-2.5">
        <StepNumber n={n} state="current" />
        <p
          className={clsx(
            "min-w-0 leading-snug whitespace-pre-line [overflow-wrap:anywhere]",
            size === "lg" ? "text-(length:--fs-step)" : "text-[1.0625rem]"
          )}
        >
          {text}
        </p>
      </div>
      {needs && <div className="mt-2 pl-[2.375rem]">{needs}</div>}
      {footer && <div className="mt-2 pl-[2.375rem] text-(length:--fs-meta) text-grigio">{footer}</div>}
      {actions && <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>}
    </As>
  );
}

/** «Ti servono: 500 g farina · 2 uova» — quantità in arancio (arancio = quantità) */
export function StepNeeds({ items }: { items: { key: string | number; amount: string; name: string; optional?: boolean }[] }) {
  if (items.length === 0) return null;
  return (
    <p className="text-[0.8125rem] text-grigio">
      Ti servono:{" "}
      {items.map((it, k) => (
        <span key={it.key}>
          {k > 0 && " · "}
          {it.amount && <b className="tabular text-arancio">{it.amount}</b>} <span className="text-blu-950">{it.name}</span>
          {it.optional && <span className="text-grigio"> (opz.)</span>}
        </span>
      ))}
    </p>
  );
}
