"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { displayUnit, isLongUnit } from "@/lib/units";
import { Check, ChevronDown, PartyPopper, RotateCcw, Scale, TriangleAlert, X } from "lucide-react";
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
import { formatMinutes, toStepKind } from "@/lib/types";
import { groupIngredientsBySection } from "@/lib/ingredient-sections";
import { resolveLinkQty, splitIngredientIds, type StepIngredientLink } from "@/lib/step-ingredients";
import { Button, Stepper } from "@/components/ds/Button";
import { Segmented } from "@/components/ds/Controls";
import { StepKindTag, Tag } from "@/components/ds/Tag";
import { CurrentStep } from "@/components/cooking/CurrentStep";
import { StepNumber, StepProgress } from "@/components/ds/Progress";
import { Banner } from "@/components/ds/Feedback";
import { PotIcon } from "@/components/icons";
import { flyToCookingBar } from "@/lib/cooking-fly";

/**
 * Ingredienti + procedura del dettaglio ricetta (restyle fase 3, prototipo `docs/design/ricetta.html`).
 * È un contenitore (`@container`): da 620px in su ingredienti e procedura sono AFFIANCATI, sotto
 * diventano due schede (4.10). Il passo corrente è la scheda 8.7 con timer grande e «Fatto» (3.1);
 * i passi fatti e futuri restano visibili. Logica invariata: avanzamento per indice
 * (`useRecipeProgress`), conferma dei passi saltati, «Sto cucinando», riproporzionamento con un
 * unico fattore, timer dei passi, quantità per passo, sezioni degli ingredienti.
 */

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
  /** Ingredienti necessari al passo (id di `ingredients` + quantità usata qui); assente/vuoto = nessun legame */
  stepIngredients?: StepIngredientLink[];
}

interface Props {
  recipeId: number;
  /** Nome e foto di copertina: servono allo snapshot di «Sto cucinando» */
  recipeName: string;
  recipePhoto: string | null;
  /** per la testata della card in «Sto cucinando» */
  recipeCategories?: { name: string; color: string }[];
  recipeTags?: string[];
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
  const r = Math.round(n * 10) / 10;
  return String(r);
}

/**
 * Quantità (già scalata) e unità di un ingrediente, separate: `num` null = solo l'unità («q.b.»).
 * L'unità passa da `displayUnit` (gr → g, qb → q.b., minuscole).
 */
function qtyParts(ing: Ingredient, scaledQty: (qty: number | null) => string): { num: string | null; unit: string | null } {
  const unit = displayUnit(ing.unit);
  // qty 0 (vecchie ricette con «0 q.b.»): non è una quantità, si mostra solo l'unità
  if (ing.qty != null && ing.qty !== 0) return { num: scaledQty(ing.qty), unit };
  return { num: null, unit: unit ?? "q.b." };
}

/**
 * 8.6 · quantità nella colonna stretta: unità corte accanto al numero («500 g», «q.b.»), unità
 * lunghe («cucchiaino», «spicchi») a capo **sotto** il numero, più piccole: nella colonna da 4.5rem
 * «1 cucchiaino» usciva e finiva sopra il nome dell'ingrediente.
 */
function QtyText({ num, unit }: { num: string | null; unit: string | null }) {
  if (num != null && isLongUnit(unit))
    return (
      <span className="flex flex-col leading-tight">
        <span>{num}</span>
        <span className="text-[0.75rem] font-semibold break-words">{unit}</span>
      </span>
    );
  return <span className={clsx(num == null && isLongUnit(unit) && "text-[0.8125rem] break-words whitespace-normal")}>{num != null ? `${num}${unit ? ` ${unit}` : ""}` : unit}</span>;
}

/**
 * Quantità del legame passo↔ingrediente: quella indicata per questo passo, oppure il totale
 * dell'ingrediente se nessun passo lo ripartisce (`resolveLinkQty`). Ripartito ma senza quantità
 * su questo passo → «il resto»: ripetere il totale pieno ingannerebbe.
 */
function linkQtyLabel(link: StepIngredientLink, ing: Ingredient, split: boolean, scaledQty: (qty: number | null) => string): string {
  const qty = resolveLinkQty(link.qty, ing.qty, split);
  const unit = displayUnit(ing.unit);
  if (qty != null && qty !== 0) return `${scaledQty(qty)}${unit ? ` ${unit}` : ""}`;
  return ing.qty ? "il resto" : unit ?? "q.b.";
}

const caption = "text-xs font-semibold tracking-[0.08em] text-grigio uppercase";

/** 8.6 · righe ingrediente (una lista intera o una per sezione). La quantità si tocca per riproporzionare. */
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
  editingId: number | null;
  onEdit: (id: number | null) => void;
  onApply: (ing: Ingredient, value: number) => void;
  anchorId: number | null;
}) {
  return (
    <ul className="flex flex-col">
      {items.map((ing) => {
        const parts = qtyParts(ing, scaledQty);
        const scalable = ing.qty != null && ing.qty > 0;
        return (
          <li key={ing.id} className="flex min-w-0 items-baseline gap-2.5 border-b border-blu-150 py-2 last:border-0">
            <span className="w-[4.5rem] shrink-0">
              {editingId === ing.id ? (
                <QtyEditor
                  initial={scaledQty(ing.qty)}
                  unit={displayUnit(ing.unit)}
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
                  className={clsx(
                    "tabular -my-0.5 min-h-6 rounded px-0.5 py-0.5 text-left font-bold whitespace-nowrap text-arancio underline decoration-arancio-200 decoration-dotted underline-offset-4 hover:text-arancio-scuro",
                    anchorId === ing.id && "bg-arancio-50"
                  )}
                >
                  <QtyText {...parts} />
                </button>
              ) : (
                <span className="tabular block font-bold whitespace-nowrap text-arancio">
                  <QtyText {...parts} />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              {ing.name}
              {ing.optional && (
                <Tag tone="optional" className="ml-1.5 align-middle">
                  opzionale
                </Tag>
              )}
              {ing.description && <span className="block text-[0.8125rem] text-grigio">{ing.description}</span>}
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
      className="inline-flex items-baseline gap-1"
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
        className="tabular w-14 rounded-md border border-arancio bg-white px-1 py-0.5 font-bold text-blu-950 focus:ring-2 focus:ring-arancio/40 focus:outline-none"
      />
      {unit && <span className="text-xs font-bold text-arancio">{unit}</span>}
    </form>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

export function RecipeProcedure({ recipeId, recipeName, recipePhoto, recipeCategories, recipeTags, defaultServings, servingsUnit, ingredients, steps }: Props) {
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
  // Contenitore stretto: schede Ingredienti / Procedura (si parte dalla procedura se è già iniziata)
  const [tab, setTab] = useState<"ing" | "proc" | null>(null);
  // Progresso per INDICE di step, persistito: admin → DB, visitatori → localStorage
  const [done, setDone] = useRecipeProgress(recipeId, steps.length);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null); // step index in attesa di conferma
  // vista compatta: passi aperti a mano (gli altri restano su una riga)
  const [openSteps, setOpenSteps] = useState<Set<number>>(() => new Set());
  const toggleOpenStep = (i: number) => {
    const next = new Set(openSteps);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setOpenSteps(next);
  };
  const [dismissed, setDismissed] = useState(false); // ha chiuso il banner (con "No" o dopo conferma cottura)
  const [cookConfirmed, setCookConfirmed] = useState(false); // la cottura è stata davvero registrata
  const [cookLoading, setCookLoading] = useState(false);

  const snapshot = useMemo(
    () => ({
      recipeId,
      name: recipeName,
      photo: recipePhoto,
      categories: recipeCategories,
      tags: recipeTags,
      steps: steps.map((s) => ({ text: s.text, mins: s.mins, kind: toStepKind(s.kind) })),
    }),
    [recipeId, recipeName, recipePhoto, recipeCategories, recipeTags, steps]
  );
  // Visita del dettaglio: se la ricetta è già in lista ne rinfresca i passi (modifiche alla ricetta)
  useEffect(() => {
    refreshRecipe(snapshot);
  }, [snapshot]);

  // Ingresso in lista: si porta dietro un eventuale ricalcolo già fatto a schermo
  // (da qui in poi lo tiene la sessione; lo stato locale si azzera così all'uscita
  // dalla lista si torna alle quantità originali)
  // `from` = elemento toccato, da cui parte la pentola che vola nella fila in cima (lib/cooking-fly.ts)
  const enterCooking = (from?: Element | null) => {
    if (cooking) return;
    addRecipe(snapshot, localScale);
    setLocalScale(null);
    flyToCookingBar(from ?? (document.activeElement instanceof HTMLButtonElement ? document.activeElement : null));
  };
  const startCooking = (e: React.MouseEvent<HTMLElement>) => {
    enterCooking(e.currentTarget);
    setTab("proc");
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

  // Primo passo non fatto = passo corrente (scheda 8.7)
  const current = steps.findIndex((_, i) => !done.has(i));
  const activeTab = tab ?? (cooking || done.size > 0 ? "proc" : "ing");
  const hasScalable = ingredients.some((i) => i.qty != null && i.qty > 0);

  const ingredientsColumn = (
    <section aria-labelledby="ingredienti-titolo" className="flex min-w-0 flex-col gap-3">
      <h2 id="ingredienti-titolo" className={caption}>
        Ingredienti
      </h2>
      {defaultServings && servings != null && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Stepper
            value={formatQty(servings)}
            onDecrement={() => setServingsTo(Math.max(1, Math.ceil(servings - 1e-9) - 1))}
            onIncrement={() => setServingsTo(Math.floor(servings + 1e-9) + 1)}
            disableDecrement={servings <= 1}
            decrementLabel="Una porzione in meno"
            incrementLabel="Una porzione in più"
          />
          <span className="max-w-[12rem] truncate text-[0.875rem] text-grigio">{servingsUnit?.trim() || "porzioni"}</span>
        </div>
      )}
      {scaled ? (
        <Banner
          action={
            <Button size="sm" variant="secondary" icon={<RotateCcw />} onClick={resetScale}>
              Ripristina
            </Button>
          }
        >
          <span className="flex items-center gap-1.5">
            <Scale className="size-4 shrink-0" aria-hidden />
            <span>
              Dosi ×{formatQty(Math.round(factor * 100) / 100)}
              {anchor && anchor.qty != null && (
                <>
                  {" "}
                  su <b>{formatQty(anchor.qty * factor)}{anchor.unit ? ` ${displayUnit(anchor.unit)}` : ""} {anchor.name}</b>
                </>
              )}
            </span>
          </span>
        </Banner>
      ) : (
        hasScalable && <p className="cx-hide text-[0.8125rem] text-grigio">Tocca una quantità per scrivere quella che hai: il resto si ricalcola.</p>
      )}
      {sections.length <= 1 ? (
        <IngredientList items={ingredients} scaledQty={scaledQty} editingId={editingId} onEdit={setEditingId} onApply={applyIngredientQty} anchorId={anchorId} />
      ) : (
        <div className="flex flex-col gap-3">
          {sections.map((group, i) => (
            <div key={group.section ?? `__none-${i}`}>
              {group.section && <h3 className="mb-0.5 text-[0.8125rem] font-bold text-blu-800">{group.section}</h3>}
              <IngredientList items={group.items} scaledQty={scaledQty} editingId={editingId} onEdit={setEditingId} onApply={applyIngredientQty} anchorId={anchorId} />
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const stepChips = (step: Step, muted: boolean) => {
    const list = (step.stepIngredients ?? [])
      .map((link) => {
        const ing = ingredientById.get(link.ingredientId);
        return ing ? { link, ing } : null;
      })
      .filter((x): x is { link: StepIngredientLink; ing: Ingredient } => !!x);
    if (list.length === 0) return null;
    return (
      <p className={clsx("text-[0.8125rem] text-grigio", muted && "opacity-70")}>
        Ti servono:{" "}
        {list.map(({ link, ing }, k) => (
          <span key={ing.id}>
            {k > 0 && " · "}
            <b className="tabular text-arancio">{linkQtyLabel(link, ing, splitIds.has(ing.id), scaledQty)}</b>{" "}
            <span className="text-blu-950">{ing.name}</span>
          </span>
        ))}
      </p>
    );
  };

  const procedureColumn = (
    <section aria-labelledby="procedura-titolo" className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="procedura-titolo" className={clsx(caption, "flex-1")}>
          Procedura{steps.length > 0 && ` · ${done.size} di ${steps.length} fatti`}
        </h2>
        {done.size > 0 && (
          <Button size="sm" variant="ghost" icon={<RotateCcw />} onClick={restart}>
            Ricomincia
          </Button>
        )}
      </div>
      {steps.length > 0 && <StepProgress total={steps.length} done={done.size} current={current >= 0 ? current : undefined} />}

      {/* «Sto cucinando»: ingresso o stato */}
      {session.hydrated &&
        steps.length > 0 &&
        (cooking ? (
          <div className="flex flex-wrap items-center gap-2 rounded-ctl border border-blu-200 bg-blu-100 px-3 py-2">
            <PotIcon className="size-5 shrink-0 text-blu-700" aria-hidden />
            <p className="min-w-0 flex-1 text-[0.875rem] font-semibold text-blu-800">Stai cucinando questa ricetta</p>
            <Button size="sm" variant="secondary" icon={<X />} onClick={() => removeRecipe(recipeId)} title="Toglie la ricetta dalla lista senza registrare la cottura">
              Togli
            </Button>
            <Button size="sm" variant="tonal" icon={<Check />} onClick={finishAndRemove} loading={finishing} title={isAdmin ? "Registra una cottura e toglie la ricetta dalla lista" : "Toglie la ricetta dalla lista"}>
              Finito e rimuovi
            </Button>
            {finishError && <p className="w-full text-xs text-rosa">Non sono riuscito a registrare la cottura, riprova.</p>}
          </div>
        ) : (
          <div>
            {/* tonale: l'arancio della zona è del «Fatto» del passo corrente (D2, una sola azione arancio) */}
            <Button variant="tonal" icon={<PotIcon />} onClick={startCooking}>
              Inizia a cucinare
            </Button>
          </div>
        ))}

      <ol className="flex flex-col gap-1">
        {steps.map((step, i) => {
          const checked = done.has(i);
          const isCurrent = i === current;
          const isPending = pendingIdx === i;
          const kind = toStepKind(step.kind);
          const timerStep = isTimerStep({ mins: step.mins, kind: step.kind ?? "PREP" }) && !!step.mins;
          const hasTimer = session.hydrated && !!findTimer(session, recipeId, i);

          if (isCurrent) {
            return (
              <CurrentStep
                as="li"
                key={step.id}
                className="my-1.5"
                n={i + 1}
                kind={kind}
                mins={step.mins}
                text={step.text}
                needs={stepChips(step, false)}
                actions={
                  <>
                    {timerStep && <StepTimer recipeId={recipeId} stepIndex={i} mins={step.mins!} ensureRecipe={() => enterCooking()} size="lg" />}
                    <Button size="lg" icon={<Check />} onClick={() => handleStepClick(i)} className={timerStep ? "" : "ml-auto"}>
                      Fatto
                    </Button>
                  </>
                }
              />
            );
          }

          // vista compatta: passo su una riga (.cx-clamp), la freccia (.cx-only) lo apre e mostra «Ti servono»
          const open = openSteps.has(i);
          const long = step.text.length > 38 || step.text.includes("\n") || (step.stepIngredients?.length ?? 0) > 0;
          return (
            <li key={step.id} className="flex flex-col gap-1.5">
              <div className="flex items-start">
              <button
                type="button"
                onClick={() => handleStepClick(i)}
                aria-pressed={checked}
                title={checked ? "Tocca per rimetterlo da fare (anche i successivi)" : "Tocca per segnarlo fatto"}
                className={clsx(
                  "flex min-w-0 flex-1 gap-2.5 rounded-ctl px-1.5 py-2 text-left transition-colors hover:bg-blu-100",
                  isPending && "bg-giallo-100 hover:bg-giallo-100"
                )}
              >
                <StepNumber n={i + 1} state={checked ? "done" : "todo"} />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span data-open={open || undefined} className={clsx("cx-clamp whitespace-pre-line", checked ? "text-grigio" : "text-blu-950")}>
                    {step.text}
                  </span>
                  {(kind !== "PREP" || step.mins) && !checked && (
                    <span>
                      <StepKindTag kind={kind} duration={step.mins ? formatMinutes(step.mins) : undefined} />
                    </span>
                  )}
                  {!checked && <span className={clsx(!open && "cx-hide")}>{stepChips(step, false)}</span>}
                </span>
              </button>
              {long && (
                <button
                  type="button"
                  onClick={() => toggleOpenStep(i)}
                  aria-expanded={open}
                  aria-label={open ? `Chiudi il passo ${i + 1}` : `Apri il passo ${i + 1}`}
                  className="cx-only hit-44 mt-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-[0.5625rem] text-blu-700 hover:bg-blu-100 [&_svg]:size-4"
                >
                  <ChevronDown className={clsx("transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
                </button>
              )}
              </div>
              {/* Timer di un passo non corrente: solo se è già partito (es. lievitazione mentre vai avanti) */}
              {timerStep && hasTimer && (
                <div className="pl-[2.875rem]">
                  <StepTimer recipeId={recipeId} stepIndex={i} mins={step.mins!} ensureRecipe={() => enterCooking()} />
                </div>
              )}
              {isPending && (
                <div className="ml-[2.875rem] flex flex-wrap items-center gap-2.5 rounded-ctl border border-giallo-400 bg-giallo-100 px-3 py-2.5">
                  <p className="min-w-0 flex-1 text-[0.875rem] text-giallo-ink">
                    <TriangleAlert className="mr-1 inline size-4 align-text-bottom" aria-hidden />
                    Anche i <b>{[...Array(i).keys()].filter((j) => !done.has(j)).length} passi precedenti</b> non fatti verranno segnati come fatti.
                  </p>
                  <Button size="sm" variant="secondary" onClick={() => setPendingIdx(null)}>
                    Annulla
                  </Button>
                  <Button size="sm" onClick={confirmUpTo}>
                    Sì, segna tutti
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {steps.length === 0 && <p className="text-grigio">Nessun passo per questa ricetta.</p>}

      {/* Completata */}
      {allDone && !dismissed && !cookConfirmed && (
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-verde-200 bg-verde-50 px-4 py-3.5">
          <PartyPopper className="size-7 shrink-0 text-verde" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-blu-950">Hai completato la ricetta!</p>
            <p className="text-[0.875rem] text-grigio">Vuoi segnare una cottura?</p>
          </div>
          <Button variant="secondary" onClick={dismiss}>
            No, grazie
          </Button>
          <Button icon={<PotIcon />} onClick={markCooked} loading={cookLoading}>
            Sì, segna
          </Button>
        </div>
      )}
      {cookConfirmed && (
        <div role="status" className="flex items-center gap-2.5 rounded-card border border-verde-200 bg-verde-50 px-4 py-3 font-semibold text-verde">
          <PotIcon className="size-5" aria-hidden /> Cottura registrata! Ottimo lavoro.
        </div>
      )}
    </section>
  );

  return (
    <div className="@container">
      {/* Contenitore stretto: due schede */}
      <Segmented
        label="Sezione della ricetta"
        value={activeTab}
        onChange={setTab}
        className="cx-tabs mb-3 @min-[620px]:hidden"
        options={[
          { value: "ing", label: "Ingredienti" },
          { value: "proc", label: "Procedura" },
        ]}
      />
      <div className="grid gap-x-(--gap) gap-y-4 @min-[620px]:grid-cols-[clamp(13rem,36%,20rem)_1fr]">
        <div className={clsx("cx-panel rounded-card bg-blu-100 p-3.5 @min-[620px]:block", activeTab === "ing" ? "block" : "hidden")}>{ingredientsColumn}</div>
        <div className={clsx("cx-panel @min-[620px]:block", activeTab === "proc" ? "block" : "hidden")}>{procedureColumn}</div>
      </div>
    </div>
  );
}
