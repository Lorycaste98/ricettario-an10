"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Carrot, ListOrdered, Check, TriangleAlert, PartyPopper, CookingPot, Timer } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PriceTag } from "@/components/ui/PriceTag";
import { useRecipeProgress } from "@/lib/recipe-progress";
import { formatMinutes, toStepKind, STEP_KIND_LABEL, type StepKind } from "@/lib/types";

// Stile badge per tipo step (la Preparazione resta senza badge per non affollare)
const KIND_BADGE: Partial<Record<StepKind, string>> = {
  COOK: "bg-red-100 text-red-700",
  WAIT: "bg-amber-100 text-amber-700",
};

interface Ingredient {
  id: number;
  name: string;
  qty: number | null;
  unit: string | null;
  description: string | null;
  optional: boolean;
}

interface Step {
  id: number;
  text: string;
  mins: number | null;
  kind?: string;
  order: number;
}

interface Props {
  recipeId: number;
  defaultServings: number | null;
  /** Unità delle porzioni (es. "teglie da 28cm"); nulla = persone/porzioni */
  servingsUnit?: string | null;
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

export function RecipeProcedure({ recipeId, defaultServings, servingsUnit, ingredients, steps }: Props) {
  const router = useRouter();
  const [servings, setServings] = useState<number>(defaultServings ?? 4);
  // Progresso per INDICE di step, persistito: admin → DB, visitatori → localStorage
  const [done, setDone] = useRecipeProgress(recipeId, steps.length);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null); // step index in attesa di conferma
  const [dismissed, setDismissed] = useState(false); // ha chiuso il banner (con "No" o dopo conferma cottura)
  const [cookConfirmed, setCookConfirmed] = useState(false); // la cottura è stata davvero registrata
  const [cookLoading, setCookLoading] = useState(false);

  // Scala la quantità in base alle porzioni selezionate
  const scaledQty = (qty: number | null): string => {
    if (qty == null) return "";
    if (!defaultServings || servings === defaultServings) return formatQty(qty);
    return formatQty((qty * servings) / defaultServings);
  };

  // Toggle di uno step (per indice: gli id degli step cambiano ad ogni salvataggio ricetta)
  const handleStepClick = (stepIndex: number) => {
    if (done.has(stepIndex)) {
      // de-spunta questo E tutti i successivi (a cascata, senza conferma)
      const next = new Set(done);
      for (let i = stepIndex; i < steps.length; i++) next.delete(i);
      setDone(next);
      return;
    }
    const prevUndone = [...Array(stepIndex).keys()].filter((i) => !done.has(i));
    if (prevUndone.length > 0) {
      setPendingIdx(stepIndex);
    } else {
      setDone(new Set(done).add(stepIndex));
    }
  };

  // Conferma: segna tutti gli step fino a pendingIdx (incluso)
  const confirmUpTo = () => {
    if (pendingIdx === null) return;
    const next = new Set(done);
    for (let i = 0; i <= pendingIdx; i++) next.add(i);
    setDone(next);
    setPendingIdx(null);
  };

  const restart = () => {
    setDone(new Set());
    setPendingIdx(null);
  };

  const allDone = steps.length > 0 && steps.every((_, i) => done.has(i));

  const markCooked = async () => {
    setCookLoading(true);
    const res = await fetch(`/api/recipes/${recipeId}/cook`, { method: "POST" });
    setCookLoading(false);
    if (res.ok) {
      setCookConfirmed(true);
      router.refresh(); // aggiorna il contatore "volte cucinata" (RecipeActions è un server component)
    }
  };

  const dismiss = () => setDismissed(true);

  return (
    <div className="space-y-8">

      {/* ── Ingredienti ── */}
      <section className="rounded-2xl bg-white/60 border border-white/40 backdrop-blur-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <SectionHeader title="Ingredienti" icon={<Carrot size={20} />} tone="emerald" size="lg" />

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
                <span className="text-xs text-sky-700 font-medium mr-1 max-w-36 truncate">
                  {servingsUnit?.trim() || "Porzioni"}
                </span>
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
                <span className="min-w-0 text-sm text-sky-900">
                  {ing.name}
                  {ing.optional && <PriceTag className="ml-1.5" />}
                  {ing.description && (
                    <span className="block text-sky-600 font-normal">{ing.description}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Procedura interattiva ── */}
      <section className="rounded-2xl bg-white/60 border border-white/40 backdrop-blur-sm p-5 sm:p-6">
        {/* Header sticky: la barra di progresso resta visibile anche con tanti step */}
        {steps.length > 0 ? (
          <div
            className="sticky z-20 -mx-5 -mt-5 mb-5 rounded-t-2xl border-b border-white/40 bg-white/75 px-5 pt-4 pb-3 backdrop-blur-md shadow-sm shadow-black/[0.03] sm:-mx-6 sm:-mt-6 sm:px-6"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 56px)" }}
          >
            <SectionHeader
              title="Procedura"
              icon={<ListOrdered size={20} />}
              tone="sky"
              size="lg"
              className="mb-2"
              action={
                <span className="flex items-center gap-2">
                  {done.size > 0 && (
                    <button
                      type="button"
                      onClick={restart}
                      title="Ricomincia da capo"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-white/50 text-sky-700 hover:bg-white/80 hover:text-sky-950 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  )}
                  <span className="text-xs font-medium text-sky-700 tabular-nums">
                    {done.size}/{steps.length} passi · {Math.round((done.size / steps.length) * 100)}%
                  </span>
                </span>
              }
            />
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
                style={{ width: `${(done.size / steps.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <SectionHeader title="Procedura" icon={<ListOrdered size={20} />} tone="sky" size="lg" className="mb-5" />
        )}
        <ol className="space-y-3">
          {steps.map((step, i) => {
            const checked = done.has(i);
            const isPending = pendingIdx === i;
            return (
              <li key={step.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleStepClick(i)}
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
                    {checked ? <Check size={14} /> : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed transition-all duration-200 ${
                      checked ? "line-through text-sky-500 opacity-60" : "text-sky-900"
                    }`}>
                      {step.text}
                    </p>
                    {(() => {
                      const kind = toStepKind(step.kind);
                      const badge = KIND_BADGE[kind];
                      if (!step.mins && !badge) return null;
                      return (
                        <div className={`mt-0.5 flex items-center gap-2 text-xs ${checked ? "opacity-50" : ""}`}>
                          {badge && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge}`}>
                              {STEP_KIND_LABEL[kind]}
                            </span>
                          )}
                          {step.mins && step.mins > 0 && (
                            <span className={`inline-flex items-center gap-1 ${checked ? "text-sky-400" : "text-sky-600"}`}>
                              <Timer size={12} /> {formatMinutes(step.mins)}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </button>

                {/* Avviso inline step intermedio */}
                {isPending && (
                  <div className="ml-11 rounded-xl border border-amber-300/60 bg-amber-50/80 backdrop-blur-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="flex-1 text-sm text-amber-900">
                      <TriangleAlert size={14} className="mr-1 inline-block align-text-bottom" /> Anche i{" "}
                      <strong>{[...Array(i).keys()].filter((j) => !done.has(j)).length} passi precedenti</strong>{" "}
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
      </section>

      {/* ── Banner completamento ── */}
      {allDone && !dismissed && !cookConfirmed && (
        <div className="rounded-2xl border border-green-300/50 bg-green-100/70 backdrop-blur-sm px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <PartyPopper size={30} className="text-green-600" />
          <div className="flex-1">
            <p className="font-bold text-green-900">Hai completato la ricetta!</p>
            <p className="text-sm text-green-800 mt-0.5">Vuoi segnare una cottura?</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={dismiss} className="rounded-lg border border-green-300/60 bg-white/60 px-4 py-2 text-sm font-medium text-green-800 hover:bg-white/80 transition-colors">
              No, grazie
            </button>
            <button onClick={markCooked} disabled={cookLoading} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
              {cookLoading ? "…" : <span className="inline-flex items-center gap-1.5"><CookingPot size={15} /> Sì, segna!</span>}
            </button>
          </div>
        </div>
      )}

      {/* ── Conferma cottura ── */}
      {cookConfirmed && (
        <div className="rounded-2xl border border-orange-300/50 bg-orange-100/60 backdrop-blur-sm px-6 py-4 flex items-center gap-3">
          <CookingPot size={22} className="text-orange-600" />
          <p className="text-sm font-medium text-orange-900">Cottura registrata! Ottimo lavoro.</p>
        </div>
      )}
    </div>
  );
}
