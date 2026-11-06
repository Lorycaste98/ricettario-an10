"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Scale, Carrot, ListOrdered, Check, TriangleAlert, PartyPopper, CookingPot, Timer, ChevronDown, X } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PriceTag } from "@/components/ui/PriceTag";
import { useRecipeProgress } from "@/lib/recipe-progress";
import {
  addRecipe,
  finishRecipe,
  findTimer,
  isCooking,
  isTimerStep,
  refreshRecipe,
  removeRecipe,
  setRecipeScale,
  useCookingSession,
  type CookingScale,
} from "@/lib/cooking-session";
import { useAuth } from "@/components/AuthProvider";
import { StepTimer } from "@/components/cooking/StepTimer";
import { formatMinutes, toStepKind, STEP_KIND_LABEL, type StepKind } from "@/lib/types";
import { groupIngredientsBySection } from "@/lib/ingredient-sections";
import {
  resolveLinkQty,
  splitIngredientIds,
  type StepIngredientLink,
} from "@/lib/step-ingredients";

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
  /**
   * Ingredienti necessari al passo (id di `ingredients` + quantità usata qui);
   * assente/vuoto = nessun legame
   */
  stepIngredients?: StepIngredientLink[];
}

interface Props {
  recipeId: number;
  /** Nome e foto di copertina: servono allo snapshot di «Sto cucinando» */
  recipeName: string;
  recipePhoto: string | null;
  defaultServings: number | null;
  /** Unità delle porzioni (es. "teglie da 28cm"); nulla = persone/porzioni */
  servingsUnit?: string | null;
  ingredients: Ingredient[];
  steps: Step[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function ingredientByIdRaw(list: Ingredient[], id: number): Ingredient | undefined {
  return list.find((i) => i.id === id);
}

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

/**
 * Quantità del legame passo↔ingrediente: quella indicata per questo passo, oppure
 * il totale dell'ingrediente se nessun passo lo ripartisce (`resolveLinkQty`).
 * Quando l'ingrediente è ripartito ma questo passo non dice quanto, «il resto»:
 * ripetere il totale pieno accanto a un passo che ne usa una frazione ingannerebbe.
 */
function linkQtyLabel(
  link: StepIngredientLink,
  ing: Ingredient,
  split: boolean,
  scaledQty: (qty: number | null) => string
): string {
  const qty = resolveLinkQty(link.qty, ing.qty, split);
  if (qty != null) return `${scaledQty(qty)}${ing.unit ? ` ${ing.unit}` : ""}`;
  return ing.qty != null ? "il resto" : ing.unit ?? "q.b.";
}

/** Griglia di righe ingrediente (una per lista intera o una per sezione). */
function IngredientList({
  items,
  scaledQty,
  editingId,
  onEdit,
  onApply,
  anchorId,
}: {
  items: Ingredient[];
  scaledQty: (qty: number | null) => string;
  /** Ingrediente di cui si sta scrivendo la quantità (riproporzionamento) */
  editingId: number | null;
  onEdit: (id: number | null) => void;
  /** Nuova quantità scritta dall'utente per `ing` → ricalcola il fattore */
  onApply: (ing: Ingredient, value: number) => void;
  /** Ingrediente su cui è stata ricalcolata la ricetta (evidenziato) */
  anchorId: number | null;
}) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((ing) => {
        const label = qtyLabel(ing, scaledQty);
        // Solo le quantità numeriche > 0 possono fare da riferimento (q.b. non scala)
        const scalable = ing.qty != null && ing.qty > 0;
        return (
          <li key={ing.id} className="flex items-baseline gap-1.5 min-w-0">
            {editingId === ing.id ? (
              <QtyEditor
                initial={scaledQty(ing.qty)}
                unit={ing.unit}
                onCancel={() => onEdit(null)}
                onSubmit={(v) => {
                  onApply(ing, v);
                  onEdit(null);
                }}
              />
            ) : scalable ? (
              <button
                type="button"
                onClick={() => onEdit(ing.id)}
                title="Tocca per scrivere la quantità che hai: il resto si ricalcola"
                className={`shrink-0 rounded text-xs font-semibold tabular-nums whitespace-nowrap underline decoration-dotted decoration-orange-300 underline-offset-4 hover:text-orange-600 ${
                  anchorId === ing.id ? "bg-orange-100 px-1 text-orange-700" : "text-orange-500"
                }`}
              >
                {label}
              </button>
            ) : (
              <span className="shrink-0 text-xs font-semibold text-orange-500 tabular-nums whitespace-nowrap">
                {label}
              </span>
            )}
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

/** Campo inline per scrivere la quantità di un ingrediente (Invio conferma, Esc annulla). */
function QtyEditor({
  initial,
  unit,
  onSubmit,
  onCancel,
}: {
  initial: string;
  unit: string | null;
  onSubmit: (value: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const submit = () => {
    const n = Number(value.replace(",", "."));
    if (Number.isFinite(n) && n > 0) onSubmit(n);
    else onCancel();
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="inline-flex shrink-0 items-baseline gap-1"
    >
      <input
        autoFocus
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        aria-label="Quantità che hai"
        className="w-16 rounded-md border border-orange-300 bg-white px-1.5 py-0.5 text-xs font-semibold text-sky-950 tabular-nums focus:outline-none focus:ring-2 focus:ring-orange-400/50"
      />
      {unit && <span className="text-xs font-semibold text-orange-600">{unit}</span>}
    </form>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

export function RecipeProcedure({ recipeId, recipeName, recipePhoto, defaultServings, servingsUnit, ingredients, steps }: Props) {
  const router = useRouter();
  const { isAdmin } = useAuth();

  // «Sto cucinando»: snapshot della ricetta per il pannello globale (lib/cooking-session.ts)
  const session = useCookingSession();
  const cooking = session.hydrated && isCooking(session, recipeId);
  const cookingEntry = cooking ? session.recipes.find((r) => r.recipeId === recipeId) : undefined;

  // Riproporzionamento (solo a schermo, la ricetta salvata non cambia): un unico
  // fattore di scala. Le porzioni ne derivano (default × fattore) e lo stepper ±1
  // lo riscrive; scrivere la quantità di un ingrediente lo ricalcola (nuova/originale).
  // Dove vive: ricetta in «Sto cucinando» → salvato nella sessione (sopravvive ai
  // cambi pagina, si azzera quando la ricetta esce); altrimenti stato locale, perso al reload.
  const [localScale, setLocalScale] = useState<CookingScale | null>(null);
  const activeScale = cooking ? (cookingEntry?.scale ?? null) : localScale;
  const factor = activeScale?.factor ?? 1;
  const anchorId = activeScale?.anchorId ?? null;
  const setScale = (next: CookingScale | null) => {
    if (cooking) setRecipeScale(recipeId, next);
    else setLocalScale(next);
  };
  const [editingId, setEditingId] = useState<number | null>(null);
  const servings = defaultServings ? defaultServings * factor : null;
  const scaled = Math.abs(factor - 1) > 1e-9;
  const setServingsTo = (n: number) => {
    if (!defaultServings) return;
    setScale({ factor: n / defaultServings, anchorId: null });
  };
  const applyIngredientQty = (ing: Ingredient, value: number) => {
    if (!ing.qty) return;
    setScale({ factor: value / ing.qty, anchorId: ing.id });
  };
  const resetScale = () => {
    setScale(null);
    setEditingId(null);
  };
  const anchor = anchorId != null ? ingredientByIdRaw(ingredients, anchorId) : undefined;
  // La procedura può essere lunga: dropdown chiuso di default (la barra di progresso resta visibile)
  const [stepsOpen, setStepsOpen] = useState(false);
  // Progresso per INDICE di step, persistito: admin → DB, visitatori → localStorage
  const [done, setDone] = useRecipeProgress(recipeId, steps.length);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null); // step index in attesa di conferma
  const [dismissed, setDismissed] = useState(false); // ha chiuso il banner (con "No" o dopo conferma cottura)
  const [cookConfirmed, setCookConfirmed] = useState(false); // la cottura è stata davvero registrata
  const [cookLoading, setCookLoading] = useState(false);

  const snapshot = useMemo(
    () => ({
      recipeId,
      name: recipeName,
      photo: recipePhoto,
      steps: steps.map((s) => ({ text: s.text, mins: s.mins, kind: toStepKind(s.kind) })),
    }),
    [recipeId, recipeName, recipePhoto, steps]
  );
  // Visita del dettaglio: se la ricetta è già in lista ne rinfresca i passi (modifiche alla ricetta)
  useEffect(() => {
    refreshRecipe(snapshot);
  }, [snapshot]);

  // Ingresso in lista: si porta dietro un eventuale ricalcolo già fatto a schermo
  // (da qui in poi lo tiene la sessione; lo stato locale si azzera così all'uscita
  // dalla lista si torna alle quantità originali)
  const enterCooking = () => {
    if (cooking) return;
    addRecipe(snapshot, localScale);
    setLocalScale(null);
  };
  const startCooking = () => {
    enterCooking();
    setStepsOpen(true);
  };

  // «Finito e rimuovi»: admin → registra la cottura (+1); visitatore → toglie e basta
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState(false);
  const finishAndRemove = async () => {
    setFinishing(true);
    setFinishError(false);
    const ok = await finishRecipe(recipeId, isAdmin);
    setFinishing(false);
    if (!ok) {
      setFinishError(true);
      return;
    }
    setDone(new Set());
    setPendingIdx(null);
    if (isAdmin) {
      setCookConfirmed(true);
      router.refresh(); // aggiorna il contatore "volte cucinata"
    }
  };

  // Ingredienti raggruppati per sezione/preparazione (un solo gruppo = nessuna sezione)
  const sections = useMemo(() => groupIngredientsBySection(ingredients), [ingredients]);
  // Lookup per i legami passo↔ingrediente (Step.stepIngredients)
  const ingredientById = useMemo(
    () => new Map(ingredients.map((i) => [i.id, i])),
    [ingredients]
  );
  // Ingredienti ripartiti fra più passi: cambia il significato di un legame senza
  // quantità ("tutto" → "il resto"), vedi `linkQtyLabel`
  const splitIds = useMemo(() => splitIngredientIds(steps), [steps]);

  // Scala la quantità col fattore corrente (porzioni o ingrediente di riferimento)
  const scaledQty = (qty: number | null): string => {
    if (qty == null) return "";
    return formatQty(scaled ? qty * factor : qty);
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
      enterCooking();
    }
  };

  // Conferma: segna tutti gli step fino a pendingIdx (incluso)
  const confirmUpTo = () => {
    if (pendingIdx === null) return;
    const next = new Set(done);
    for (let i = 0; i <= pendingIdx; i++) next.add(i);
    setDone(next);
    setPendingIdx(null);
    enterCooking();
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
      // Cucinata: esce da «Sto cucinando» e i passi si azzerano per la prossima volta
      removeRecipe(recipeId);
      setDone(new Set());
      router.refresh(); // aggiorna il contatore "volte cucinata" (RecipeActions è un server component)
    }
  };

  const dismiss = () => {
    setDismissed(true);
    removeRecipe(recipeId);
  };

  return (
    <div className="space-y-6 sm:space-y-5">

      {/* ── Ingredienti ── */}
      <section className="rounded-2xl bg-white/75 border border-white/60 backdrop-blur-md p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <SectionHeader title="Ingredienti" icon={<Carrot size={20} />} tone="emerald" size="lg" />

          {/* Controllo porzioni + ripristino scala */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Undo — appare solo quando le quantità sono state ricalcolate */}
            <button
              type="button"
              onClick={resetScale}
              title="Ripristina le quantità originali"
              aria-label="Ripristina le quantità originali"
              className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-white/50 text-sky-700 backdrop-blur-sm hover:bg-white/80 hover:text-sky-950 transition-all duration-200 ${
                scaled ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {defaultServings && servings != null && (
              <div className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/40 backdrop-blur-sm px-3 py-1.5">
                <span className="text-xs text-sky-700 font-medium mr-1 max-w-36 truncate">
                  {servingsUnit?.trim() || "Porzioni"}
                </span>
                <button
                  type="button"
                  onClick={() => setServingsTo(Math.max(1, Math.ceil(servings - 1e-9) - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-white/60 text-sky-900 font-bold text-sm hover:bg-white/80 transition-colors disabled:opacity-30"
                  disabled={servings <= 1}
                >−</button>
                <span className="min-w-6 text-center font-bold text-sky-950 text-sm tabular-nums">{formatQty(servings)}</span>
                <button
                  type="button"
                  onClick={() => setServingsTo(Math.floor(servings + 1e-9) + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-white/60 text-sky-900 font-bold text-sm hover:bg-white/80 transition-colors"
                >+</button>
              </div>
            )}
          </div>
        </div>

        {/* Riproporzionamento: suggerimento, oppure riepilogo della scala attiva */}
        {scaled ? (
          <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-orange-200 bg-orange-50/90 px-3 py-1.5 text-xs text-orange-900">
            <Scale size={13} className="shrink-0 text-orange-600" />
            <span>
              Quantità ricalcolate ×{formatQty(Math.round(factor * 100) / 100)}
              {anchor && anchor.qty != null && (
                <> su <strong>{formatQty(anchor.qty * factor)}{anchor.unit ? ` ${anchor.unit}` : ""} {anchor.name}</strong></>
              )}
              {" "}· la ricetta salvata non cambia
            </span>
            <button type="button" onClick={resetScale} className="font-semibold text-orange-700 underline underline-offset-2 hover:text-orange-800">
              Ripristina
            </button>
          </p>
        ) : (
          ingredients.some((i) => i.qty != null && i.qty > 0) && (
            <p className="mb-3 flex items-center gap-1.5 text-xs text-sky-700">
              <Scale size={13} className="shrink-0" /> Tocca una quantità per scrivere quella che hai: il resto si ricalcola.
            </p>
          )
        )}

        {/* Senza sezioni resta la lista piatta di sempre; con le sezioni ogni
            preparazione ha il suo titolo e la sua griglia */}
        {sections.length <= 1 ? (
          <IngredientList items={ingredients} scaledQty={scaledQty} editingId={editingId} onEdit={setEditingId} onApply={applyIngredientQty} anchorId={anchorId} />
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
                <IngredientList items={group.items} scaledQty={scaledQty} editingId={editingId} onEdit={setEditingId} onApply={applyIngredientQty} anchorId={anchorId} />
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
            {/* «Sto cucinando»: aggiunge la ricetta al pannello globale (timer + passo corrente) */}
            {session.hydrated && (
              cooking ? (
                <div className="mt-3 rounded-xl border border-orange-300/60 bg-orange-50/90 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CookingPot size={16} className="shrink-0 text-orange-600" />
                    <p className="min-w-0 flex-1 text-sm font-medium text-orange-900">Stai cucinando questa ricetta</p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => removeRecipe(recipeId)}
                        title="Toglie la ricetta dalla lista senza registrare la cottura"
                        className="inline-flex items-center gap-1 rounded-lg border border-orange-300/60 bg-white/80 px-2.5 py-1 text-xs font-medium text-orange-800 hover:bg-white transition-colors"
                      >
                        <X size={12} /> Togli
                      </button>
                      <button
                        type="button"
                        onClick={finishAndRemove}
                        disabled={finishing}
                        title={isAdmin ? "Registra una cottura e toglie la ricetta dalla lista" : "Toglie la ricetta dalla lista"}
                        className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
                      >
                        <Check size={12} /> {finishing ? "…" : "Finito e rimuovi"}
                      </button>
                    </div>
                  </div>
                  {finishError && (
                    <p className="mt-1.5 text-xs text-rose-700">Non sono riuscito a registrare la cottura, riprova.</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startCooking}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-orange-600 transition-colors"
                >
                  <CookingPot size={15} /> Inizia a cucinare
                </button>
              )
            )}
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
            const stepIngredients = (step.stepIngredients ?? [])
              .map((link) => {
                const ing = ingredientById.get(link.ingredientId);
                return ing ? { link, ing } : null;
              })
              .filter((x): x is { link: StepIngredientLink; ing: Ingredient } => !!x);
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
                        {stepIngredients.map(({ link, ing }) => (
                          <span
                            key={ing.id}
                            className="inline-flex items-baseline gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2 py-0.5 text-[11px] text-emerald-950"
                          >
                            {/* Stessa lettura della modalità cucina: quantità in evidenza, nome in tono normale */}
                            <span className="font-bold tabular-nums text-emerald-700">
                              {linkQtyLabel(link, ing, splitIds.has(ing.id), scaledQty)}
                            </span>
                            {ing.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>

                {/* Timer del passo (Attesa/Cottura con minuti): fratello del bottone, mai annidato.
                    Sui passi già fatti resta solo se c'è un timer attivo o scaduto. */}
                {isTimerStep({ mins: step.mins, kind: step.kind ?? "PREP" }) && !!step.mins && (!checked || (session.hydrated && findTimer(session, recipeId, i))) && (
                  <div className="ml-11">
                    <StepTimer
                      recipeId={recipeId}
                      stepIndex={i}
                      mins={step.mins}
                      ensureRecipe={enterCooking}
                    />
                  </div>
                )}

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
