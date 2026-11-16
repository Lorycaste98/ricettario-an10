import { clsx } from "clsx";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

/** Avanzamento (tavola sezione 7). Verde = fatto, arancio = adesso, azzurro = dopo. */

/** 7.1 · passi della ricetta, un segmento per passo */
export function StepProgress({ total, done, current, className }: { total: number; done: number; current?: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label={`${done} passi fatti su ${total}`}
      className={clsx("flex gap-1", className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={clsx(
            "h-[0.4375rem] flex-1 rounded-full",
            i < done ? "bg-verde" : i === (current ?? done) ? "bg-arancio" : "bg-blu-150"
          )}
        />
      ))}
    </div>
  );
}

/** 7.2 · numero del passo: fatto · adesso · dopo */
export function StepNumber({ n, state }: { n: number; state: "done" | "current" | "todo" }) {
  return (
    <span
      className={clsx(
        "tabular inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[0.8125rem] font-bold",
        state === "done" && "border-verde bg-verde text-white",
        state === "current" && "border-arancio bg-arancio text-white",
        state === "todo" && "border-blu-250 text-grigio"
      )}
    >
      {state === "done" ? <Check className="size-4" strokeWidth={3} aria-label={`Passo ${n} fatto`} /> : n}
    </span>
  );
}

/** 7.3 · barra semplice (es. spesa 21 di 26) */
export function ProgressBar({ value, max, label, className }: { value: number; max: number; label: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={clsx("h-2.5 overflow-hidden rounded-full bg-blu-150", className)}
    >
      <span className="block h-full rounded-full bg-verde transition-[width] motion-reduce:transition-none" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** 7.4 · timer ad anello: `fraction` = tempo rimasto (0–1), `children` = testo al centro */
export function TimerRing({ fraction, size = 80, children }: { fraction: number; size?: number; children?: ReactNode }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  return (
    <span className="tabular relative inline-flex items-center justify-center font-bold" style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="8" className="stroke-giallo-100" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - f)}
          className="stroke-giallo-400 transition-[stroke-dashoffset] motion-reduce:transition-none"
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}

/** 7.5 · segnaposto di caricamento (stessa forma del contenuto che arriva) */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={clsx("block animate-pulse rounded-ctl bg-blu-150 motion-reduce:animate-none", className)} />;
}
