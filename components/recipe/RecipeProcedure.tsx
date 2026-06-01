"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { formatMinutes } from "@/lib/types";

interface Ingredient {
  id: number;
  name: string;
  qty: number | null;
  unit: string | null;
}

interface Step {
  id: number;
  text: string;
  mins: number | null;
  order: number;
}

interface Props {
  recipeId: number;
  defaultServings: number | null;
  ingredients: Ingredient[];
  steps: Step[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatQty(n: number): string {
  if (n === 0) return "0";
  if (Number.isInteger(n)) return String(n);
  // arrotonda a 1 decimale
  const r = Math.round(n * 10) / 10;
  return String(r);
}

// ─── component ────────────────────────────────────────────────────────────────

export function RecipeProcedure({ recipeId, defaultServings, ingredients, steps }: Props) {
  const [servings, setServings] = useState<number>(defaultServings ?? 4);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [pendingIdx, setPendingIdx] = useState<number | null>(null); // step index in attesa di conferma
  const [cookSent, setCookSent] = useState(false);
  const [cookLoading, setCookLoading] = useState(false);

  // Scala la quantità in base alle porzioni selezionate
  const scaledQty = (qty: number | null): string => {
    if (qty == null) return "";
    if (!defaultServings || servings === defaultServings) return formatQty(qty);
    return formatQty((qty * servings) / defaultServings);
  };

  // Toggle di uno step
  const handleStepClick = (stepId: number, stepIndex: number) => {
    if (done.has(stepId)) {
      // de-spunta questo E tutti i successivi (a cascata, senza conferma)
      setDone((prev) => {
        const next = new Set(prev);
        steps.slice(stepIndex).forEach((s) => next.delete(s.id));
        return next;
      });
      return;
    }
    const prevUndone = steps.slice(0, stepIndex).filter((s) => !done.has(s.id));
    if (prevUndone.length > 0) {
      setPendingIdx(stepIndex);
    } else {
      setDone((prev) => { const next = new Set(prev); next.add(stepId); return next; });
    }
  };

  // Conferma: segna tutti gli step fino a pendingIdx (incluso)
  const confirmUpTo = () => {
    if (pendingIdx === null) return;
    setDone((prev) => {
      const next = new Set(prev);
      steps.slice(0, pendingIdx + 1).forEach((s) => next.add(s.id));
      return next;
    });
    setPendingIdx(null);
  };

  const allDone = steps.length > 0 && steps.every((s) => done.has(s.id));

  const markCooked = async () => {
    setCookLoading(true);
    await fetch(`/api/recipes/${recipeId}/cook`, { method: "POST" });
    setCookLoading(false);
    setCookSent(true);
  };

  const dismiss = () => setCookSent(true);

  return (
    <div className="space-y-8">

      {/* ── Ingredienti ── */}
      <section className="rounded-2xl bg-white/60 border border-white/40 backdrop-blur-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-sky-950">Ingredienti</h2>

          {/* Controllo porzioni */}
          {defaultServings && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Undo button — appare solo quando le porzioni sono cambiate */}
              <button
                type="button"
                onClick={() => setServings(defaultServings)}
                title={`Ripristina ${defaultServings} porzioni`}
                className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-white/50 text-sky-700 backdrop-blur-sm hover:bg-white/80 hover:text-sky-950 transition-all duration-200 ${
                  servings !== defaultServings ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/40 backdrop-blur-sm px-3 py-1.5">
                <span className="text-xs text-sky-700 font-medium mr-1">Porzioni</span>
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-white/60 text-sky-900 font-bold text-sm hover:bg-white/80 transition-colors disabled:opacity-30"
                  disabled={servings <= 1}
                >−</button>
                <span className="w-6 text-center font-bold text-sky-950 text-sm tabular-nums">{servings}</span>
                <button
                  type="button"
                  onClick={() => setServings((s) => s + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-white/60 text-sky-900 font-bold text-sm hover:bg-white/80 transition-colors"
                >+</button>
              </div>
            </div>
          )}
        </div>

        <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {ingredients.map((ing) => {
            const qtyStr = scaledQty(ing.qty);
            const label = ing.qty != null
              ? `${qtyStr}${ing.unit ? ` ${ing.unit}` : ""}`
              : (ing.unit ?? "q.b.");
            return (
              <li key={ing.id} className="flex items-baseline gap-1.5 min-w-0">
                <span className="shrink-0 text-xs font-semibold text-orange-500 tabular-nums whitespace-nowrap">
                  {label}
                </span>
                <span className="truncate text-sm text-sky-900">{ing.name}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Procedura interattiva ── */}
      <section className="rounded-2xl bg-white/60 border border-white/40 backdrop-blur-sm p-5 sm:p-6">
        <h2 className="mb-5 text-xl font-bold text-sky-950">Procedura</h2>
        <ol className="space-y-3">
          {steps.map((step, i) => {
            const checked = done.has(step.id);
            const isPending = pendingIdx === i;
            return (
              <li key={step.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleStepClick(step.id, i)}
                  className={`w-full text-left flex gap-4 rounded-xl p-3 transition-all duration-200 ${
                    checked
                      ? "bg-green-100/60 border border-green-200/50"
                      : isPending
                      ? "bg-amber-50/60 border border-amber-300/50"
                      : "bg-white/40 border border-white/30 hover:bg-white/60"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 transition-all duration-200 ${
                      checked ? "bg-green-500 text-white" : "bg-orange-500 text-white"
                    }`}
                  >
                    {checked ? "✓" : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed transition-all duration-200 ${
                      checked ? "line-through text-sky-500 opacity-60" : "text-sky-900"
                    }`}>
                      {step.text}
                    </p>
                    {step.mins && step.mins > 0 && (
                      <p className={`mt-0.5 text-xs ${checked ? "text-sky-400 opacity-50" : "text-sky-600"}`}>
                        ⏱ {formatMinutes(step.mins)}
                      </p>
                    )}
                  </div>
                </button>

                {/* Avviso inline step intermedio */}
                {isPending && (
                  <div className="ml-11 rounded-xl border border-amber-300/60 bg-amber-50/80 backdrop-blur-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="flex-1 text-sm text-amber-900">
                      ⚠️ Anche i{" "}
                      <strong>{steps.slice(0, i).filter((s) => !done.has(s.id)).length} passi precedenti</strong>{" "}
                      non completati verranno segnati come eseguiti.
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPendingIdx(null)}
                        className="rounded-lg border border-amber-300/50 bg-white/60 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-white/80 transition-colors"
                      >
                        Annulla
                      </button>
                      <button
                        type="button"
                        onClick={confirmUpTo}
                        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 transition-colors"
                      >
                        Sì, segna tutti
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/* Barra di progresso */}
        {steps.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-sky-600">{done.size} / {steps.length} passi completati</span>
              <span className="text-xs text-sky-600">{Math.round((done.size / steps.length) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-500"
                style={{ width: `${(done.size / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Banner completamento ── */}
      {allDone && !cookSent && (
        <div className="rounded-2xl border border-green-300/50 bg-green-100/70 backdrop-blur-sm px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="text-3xl">🎉</span>
          <div className="flex-1">
            <p className="font-bold text-green-900">Hai completato la ricetta!</p>
            <p className="text-sm text-green-800 mt-0.5">Vuoi segnare una cottura?</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={dismiss} className="rounded-lg border border-green-300/60 bg-white/60 px-4 py-2 text-sm font-medium text-green-800 hover:bg-white/80 transition-colors">
              No, grazie
            </button>
            <button onClick={markCooked} disabled={cookLoading} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
              {cookLoading ? "…" : "🍳 Sì, segna!"}
            </button>
          </div>
        </div>
      )}

      {/* ── Conferma cottura ── */}
      {cookSent && done.size === steps.length && (
        <div className="rounded-2xl border border-orange-300/50 bg-orange-100/60 backdrop-blur-sm px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">🍳</span>
          <p className="text-sm font-medium text-orange-900">Cottura registrata! Ottimo lavoro.</p>
        </div>
      )}
    </div>
  );
}
