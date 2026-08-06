"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Carrot, ListOrdered, Check, TriangleAlert, PartyPopper, CookingPot, Timer, ChevronDown } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PriceTag } from "@/components/ui/PriceTag";
import { useRecipeProgress } from "@/lib/recipe-progress";
import { formatMinutes, toStepKind, STEP_KIND_LABEL, type StepKind } from "@/lib/types";
import { groupIngredientsBySection } from "@/lib/ingredient-sections";

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
  /** Sezione/preparazione (es. "Per l'impasto"); assente/nulla = nessuna sezione */
  section?: string | null;
}

interface Step {
  id: number;
  text: string;
  mins: number | null;
  kind?: string;
  order: number;
  /** Ingredienti necessari al passo (id di `ingredients`); assente/vuoto = nessun legame */
  ingredientIds?: number[];
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

/** "500 g" / "q.b." — quantità (già scalata) e unità di un ingrediente. */
function qtyLabel(ing: Ingredient, scaledQty: (qty: number | null) => string): string {
  if (ing.qty != null) return `${scaledQty(ing.qty)}${ing.unit ? ` ${ing.unit}` : ""}`;
  return ing.unit ?? "q.b.";
}

/** Griglia di righe ingrediente (una per lista intera o una per sezione). */
function IngredientList({
  items,
  scaledQty,
}: {
  items: Ingredient[];
  scaledQty: (qty: number | null) => string;
}) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((ing) => {
        const label = qtyLabel(ing, scaledQty);
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
  );
}

// ─── component ────────────────────────────────────────────────────────────────

export function RecipeProcedure({ recipeId, defaultServings, servingsUnit, ingredients, steps }: Props) {
  const router = useRouter();
  const [servings, setServings] = useState<number>(defaultServings ?? 4);
  // La procedura può essere lunga: dropdown chiuso di default (la barra di progresso resta visibile)
  const [stepsOpen, setStepsOpen] = useState(false);
  // Progresso per INDICE di step, persistito: admin → DB, visitatori → localStorage
  const [done, setDone] = useRecipeProgress(recipeId, steps.length);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null); // step index in attesa di conferma
  const [dismissed, setDismissed] = useState(false); // ha chiuso il banner (con "No" o dopo conferma cottura)
  const [cookConfirmed, setCookConfirmed] = useState(false); // la cottura è stata davvero registrata
  const [cookLoading, setCookLoading] = useState(false);

  // Ingredienti raggruppati per sezione/preparazione (un solo gruppo = nessuna sezione)
  const sections = useMemo(() => groupIngredientsBySection(ingredients), [ingredients]);
  // Lookup per i legami passo↔ingrediente (Step.ingredientIds)
  const ingredientById = useMemo(
    () => new Map(ingredients.map((i) => [i.id, i])),
    [ingredients]
  );

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
    <div className="space-y-6 sm:space-y-5">

      {/* ── Ingredienti ── */}
      <section className="rounded-2xl bg-white/75 border border-white/60 backdrop-blur-md p-5 sm:p-6 shadow-sm">
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

        {/* Senza sezioni resta la lista piatta di sempre; con le sezioni ogni
            preparazione ha il suo titolo e la sua griglia */}
        {sections.length <= 1 ? (
          <IngredientList items={ingredients} scaledQty={scaledQty} />
        ) : (
          <div className="space-y-4">
            {sections.map((group, i) => (
              <div key={group.section ?? `__none-${i}`}>
                {group.section && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                      {group.section}
                    </span>
                    <span className="h-px flex-1 bg-emerald-700/20" />
                  </div>
                )}
                <IngredientList items={group.items} scaledQty={scaledQty} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Procedura interattiva ── */}
      <section className="rounded-2xl bg-white/75 border border-white/60 backdrop-blur-md p-5 sm:p-6 shadow-sm">
        {/* Header: dropdown chiuso di default. Stile trasparente identico in aperto/chiuso
            così la barra di progresso resta sempre visibile allo stesso modo. */}
        {steps.length > 0 ? (
          <div>
            <SectionHeader
              title="Procedura"
              icon={<ListOrdered size={20} />}
              tone="sky"
              size="lg"
              className="mb-2"
              action={
                <span className="flex items-center gap-2">
                  {stepsOpen && done.size > 0 && (
                    <button
                      type="button"
                      onClick={restart}
                      title="Ricomincia da capo"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-white/50 text-sky-700 hover:bg-white/80 hover:text-sky-950 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  )}
                  {/* Toggle come le recensioni: badge (passi + %) + freccia FUORI dal badge */}
                  <button
                    type="button"
                    onClick={() => setStepsOpen((o) => !o)}
                    aria-expanded={stepsOpen}
                    aria-controls="procedura-steps"
                    title={stepsOpen ? "Chiudi la procedura" : "Apri la procedura"}
                    className="flex items-center gap-2"
                  >
                    <span className="rounded-full border border-white/50 bg-white/50 px-2.5 py-1 text-xs font-medium text-sky-700 tabular-nums">
                      {done.size}/{steps.length} passi · {Math.round((done.size / steps.length) * 100)}%
                    </span>
                    <ChevronDown size={18} className={`shrink-0 text-sky-500 transition-transform duration-300 ${stepsOpen ? "rotate-180" : ""}`} />
                  </button>
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
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            steps.length === 0 || stepsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden" inert={steps.length > 0 && !stepsOpen ? true : undefined}>
            <ol id="procedura-steps" className="space-y-3 pt-4">
              {steps.map((step, i) => {
            const checked = done.has(i);
            const isPending = pendingIdx === i;
            // Ingredienti legati al passo (opzionali: le ricette senza legami non mostrano nulla)
            const stepIngredients = (step.ingredientIds ?? [])
              .map((id) => ingredientById.get(id))
              .filter((ing): ing is Ingredient => !!ing);
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
                    {/* Ingredienti che servono in questo passo (quantità già scalate) */}
                    {stepIngredients.length > 0 && (
                      <div className={`mt-1.5 flex flex-wrap items-center gap-1.5 ${checked ? "opacity-50" : ""}`}>
                        <Carrot size={12} className="shrink-0 text-emerald-600" />
                        {stepIngredients.map((ing) => (
                          <span
                            key={ing.id}
                            className="inline-flex items-baseline gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2 py-0.5 text-[11px] text-emerald-950"
                          >
                            {/* Stessa lettura della modalità cucina: quantità in evidenza, nome in tono normale */}
                            <span className="font-bold tabular-nums text-emerald-700">{qtyLabel(ing, scaledQty)}</span>
                            {ing.name}
                          </span>
                        ))}
                      </div>
                    )}
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
          </div>
        </div>
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
