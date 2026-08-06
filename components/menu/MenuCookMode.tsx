"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, PartyPopper, UtensilsCrossed, Check, CookingPot, AlarmClock, Timer, ListX, Carrot } from "lucide-react";
import { formatMinutes, toStepKind, STEP_KIND_LABEL, type StepKind } from "@/lib/types";
import { formatClock } from "@/lib/cook-timeline";
import { useLocalStore } from "@/lib/local-store";
import { QuickTag } from "@/components/ui/QuickTag";
import { StartTimeEditor } from "@/components/menu/StartTimeEditor";

// Card ricetta della modalità cucina: stesso "vetro chiaro" leggibile delle altre
// card con testo scuro (lista spesa, costi, dettaglio ricetta). Con bg-white/30 il
// testo sparisce nella fascia bassa del gradiente di pagina.
// `min-w-0`: senza, la traccia della griglia si allarga alla min-content della card
// (parole lunghe nel testo dello step) e la card finisce oltre il bordo dello schermo.
const cookCardCls =
  "min-w-0 rounded-2xl border border-white/60 bg-white/75 backdrop-blur-md p-3.5 sm:p-5 shadow-sm";

const KIND_BADGE: Partial<Record<StepKind, string>> = {
  COOK: "bg-red-100 text-red-700",
  WAIT: "bg-amber-100 text-amber-700",
};

interface Step {
  id: number;
  text: string;
  mins: number | null;
  kind: string;
  order: number;
  /** Ingredienti necessari al passo (id di `Recipe.ingredients`); assente = nessun legame */
  ingredientIds?: number[];
}

/** Ingrediente della ricetta con le quantità già scalate sulle porzioni del menù. */
export interface CookIngredient {
  id: number;
  name: string;
  qty: number | null;
  unit: string | null;
  optional: boolean;
}

interface Recipe {
  id: number;
  name: string;
  photo: string | null;
  cookCount: number;
  quick?: boolean;
  ingredients?: CookIngredient[];
  steps: Step[];
}

/** "500 g" (già scalata) e nome, separati: in cucina si legge prima il numero. */
function ingredientParts(ing: CookIngredient): { amount: string; name: string } {
  const qty = ing.qty != null ? formatQty(ing.qty) : null;
  return { amount: [qty, ing.unit].filter(Boolean).join(" "), name: ing.name };
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

interface Progress {
  stepIdx: number;
  cooked: boolean;
}

const EMPTY_PROGRESS: Record<number, Progress> = {};

function storageKey(menuId: number) {
  return `ricettario:cook-mode:${menuId}`;
}

function parseProgress(raw: string): Record<number, Progress> {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) return {};
  return parsed as Record<number, Progress>;
}

export interface RecipeStart {
  start: Date;
  isCustom: boolean;
  leadMins: number;
}

export function MenuCookMode({
  menuId,
  recipes,
  stepTimes,
  starts,
  serveAt,
  onStartChange,
  onStartReset,
}: {
  menuId: number;
  recipes: Recipe[];
  /** Orario di inizio di ogni step per ricetta (dalla timeline del CookPlanner) */
  stepTimes?: Record<number, Date[]>;
  /** Inizio pianificato di ogni ricetta: abilita il chip orario editabile sulla card */
  starts?: Record<number, RecipeStart>;
  serveAt?: Date;
  onStartChange?: (recipeId: number, start: Date) => void;
  onStartReset?: (recipeId: number) => void;
}) {
  const [progress, setProgress] = useLocalStore<Record<number, Progress>>(
    storageKey(menuId),
    EMPTY_PROGRESS,
    parseProgress
  );

  const update = (recipeId: number, patch: Partial<Progress>) => {
    const current = progress[recipeId] ?? { stepIdx: 0, cooked: false };
    setProgress({ ...progress, [recipeId]: { ...current, ...patch } });
  };

  if (recipes.length === 0) {
    return <p className="text-sm text-sky-100">Questo menù non ha ancora ricette.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {recipes.map((recipe) =>
        recipe.quick ? (
          <QuickRecipeCookCard
            key={recipe.id}
            recipe={recipe}
            cooked={progress[recipe.id]?.cooked ?? false}
            onCookedChange={(cooked) => update(recipe.id, { cooked })}
          />
        ) : (
          <RecipeCookCard
            key={recipe.id}
            recipe={recipe}
            progress={progress[recipe.id] ?? { stepIdx: 0, cooked: false }}
            onChange={(patch) => update(recipe.id, patch)}
            stepTimes={stepTimes?.[recipe.id]}
            start={starts?.[recipe.id]}
            serveAt={serveAt}
            onStartChange={onStartChange && ((s) => onStartChange(recipe.id, s))}
            onStartReset={onStartReset && (() => onStartReset(recipe.id))}
          />
        )
      )}
    </div>
  );
}

// Ricetta "veloce": nessuna procedura/step, quindi niente stepper — solo
// nome + azione diretta "segna cucinata" (evita la banner fuorviante
// "tutti i passi completati" quando in realtà non ce n'era nessuno).
function QuickRecipeCookCard({
  recipe,
  cooked,
  onCookedChange,
}: {
  recipe: Recipe;
  cooked: boolean;
  onCookedChange: (cooked: boolean) => void;
}) {
  const [cookLoading, setCookLoading] = useState(false);

  const markCooked = async () => {
    setCookLoading(true);
    const res = await fetch(`/api/recipes/${recipe.id}/cook`, { method: "POST" });
    setCookLoading(false);
    if (res.ok) onCookedChange(true);
  };

  const undoCooked = async () => {
    setCookLoading(true);
    const res = await fetch(`/api/recipes/${recipe.id}/cook`, { method: "DELETE" });
    setCookLoading(false);
    if (res.ok) onCookedChange(false);
  };

  return (
    <div className={`${cookCardCls} flex flex-col gap-3`}>
      {/* Header: stessa anatomia della card con stepper */}
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-sky-100">
          {recipe.photo ? (
            <Image src={recipe.photo} alt={recipe.name} fill className="object-cover" sizes="44px" />
          ) : (
            <div className="flex h-full items-center justify-center text-sky-500"><UtensilsCrossed size={18} /></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-sky-950">{recipe.name}</span>
          <QuickTag className="mt-0.5" />
        </div>
      </div>

      {/* Al posto del riquadro dello step: qui non c'è nulla da seguire */}
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-dashed border-sky-300/70 bg-white/45 p-3 text-[13px] text-sky-700">
        <ListX size={16} className="shrink-0 text-sky-600" />
        Nessuna procedura da seguire.
      </div>

      {cooked ? (
        <button
          type="button"
          onClick={undoCooked}
          disabled={cookLoading}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-green-400/50 bg-green-100/60 px-3 py-2 text-xs font-medium text-green-800 hover:bg-green-100 disabled:opacity-50 transition-colors"
        >
          <Check size={13} /> Cucinata
        </button>
      ) : (
        <button
          type="button"
          onClick={markCooked}
          disabled={cookLoading}
          className="flex w-full items-center justify-center rounded-lg bg-orange-500 px-3 py-2 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {cookLoading ? "…" : <span className="inline-flex items-center gap-1"><CookingPot size={13} /> Segna cucinata</span>}
        </button>
      )}
    </div>
  );
}

function RecipeCookCard({
  recipe,
  progress,
  onChange,
  stepTimes,
  start,
  serveAt,
  onStartChange,
  onStartReset,
}: {
  recipe: Recipe;
  progress: Progress;
  onChange: (patch: Partial<Progress>) => void;
  stepTimes?: Date[];
  start?: RecipeStart;
  serveAt?: Date;
  onStartChange?: (start: Date) => void;
  onStartReset?: () => void;
}) {
  const [cookLoading, setCookLoading] = useState(false);
  const { steps } = recipe;
  const total = steps.length;
  const atCompletion = progress.stepIdx >= total;
  const step = atCompletion ? null : steps[progress.stepIdx];
  // Ingredienti del passo corrente: si guarda la lista sotto mano, quindi la
  // card dice quali servono adesso (quantità già scalate sulle porzioni del menù)
  const stepIngredients = step
    ? (step.ingredientIds ?? [])
        .map((id) => recipe.ingredients?.find((ing) => ing.id === id))
        .filter((ing): ing is CookIngredient => !!ing)
    : [];
  const stepAt = !atCompletion ? stepTimes?.[progress.stepIdx] : undefined;
  const nextAt = !atCompletion ? stepTimes?.[progress.stepIdx + 1] : undefined;

  const goBack = () => onChange({ stepIdx: Math.max(0, progress.stepIdx - 1) });
  const goNext = () => onChange({ stepIdx: Math.min(total, progress.stepIdx + 1) });
  const restart = () => onChange({ stepIdx: 0, cooked: false });

  const markCooked = async () => {
    setCookLoading(true);
    const res = await fetch(`/api/recipes/${recipe.id}/cook`, { method: "POST" });
    setCookLoading(false);
    if (res.ok) onChange({ cooked: true });
  };

  const undoCooked = async () => {
    setCookLoading(true);
    const res = await fetch(`/api/recipes/${recipe.id}/cook`, { method: "DELETE" });
    setCookLoading(false);
    if (res.ok) onChange({ cooked: false });
  };

  return (
    <div className={`${cookCardCls} flex flex-col gap-3`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-sky-100">
          {recipe.photo ? (
            <Image src={recipe.photo} alt={recipe.name} fill className="object-cover" sizes="44px" />
          ) : (
            <div className="flex h-full items-center justify-center text-sky-500"><UtensilsCrossed size={18} /></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/ricette/${recipe.id}`} className="block truncate text-sm font-semibold text-sky-950 hover:text-orange-600 transition-colors">
            {recipe.name}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {total > 0 && (
              <p className="text-[11px] text-sky-700 tabular-nums">
                {atCompletion ? "Procedura completata" : `Passo ${progress.stepIdx + 1}/${total}`}
              </p>
            )}
            {/* Ora di inizio: modificabile a mano anche da qui (stesso editor della timeline) */}
            {start && onStartChange && onStartReset && (
              <StartTimeEditor
                recipeName={recipe.name}
                start={start.start}
                isCustom={start.isCustom}
                leadMins={start.leadMins}
                serveAt={serveAt}
                onChange={onStartChange}
                onReset={onStartReset}
                variant="card"
              />
            )}
          </div>
        </div>
        {(progress.stepIdx > 0 || progress.cooked) && (
          <button
            type="button"
            onClick={restart}
            title="Ricomincia"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/50 text-sky-700 hover:bg-white/80 transition-colors"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>

      {/* Barra di progresso */}
      {total > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
            style={{ width: `${(Math.min(progress.stepIdx, total) / total) * 100}%` }}
          />
        </div>
      )}

      {/* Step corrente o banner di completamento */}
      {step ? (
        <div className="min-w-0 rounded-xl bg-white/60 border border-white/50 p-3 sm:p-3.5 flex-1">
          <p className="text-[13px] sm:text-sm leading-relaxed text-sky-900 [overflow-wrap:anywhere]">{step.text}</p>
          {(() => {
            const kind = toStepKind(step.kind);
            const badge = KIND_BADGE[kind];
            if (!step.mins && !badge && !stepAt) return null;
            return (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {stepAt && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
                    <AlarmClock size={11} /> inizia alle {formatClock(stepAt)}
                  </span>
                )}
                {badge && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge}`}>{STEP_KIND_LABEL[kind]}</span>}
                {step.mins && step.mins > 0 && <span className="inline-flex items-center gap-1 text-sky-600"><Timer size={11} /> {formatMinutes(step.mins)}</span>}
              </div>
            );
          })()}
          {stepIngredients.length > 0 && (
            <div className="mt-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-2">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                <Carrot size={11} /> Ti servono
              </p>
              {/* Una pastiglia per ingrediente: affiancati a testo nudo due nomi
                  corti sembrano una cosa sola ("100 g burro 2 uova"). Quantità
                  in evidenza e nome in tono normale — in cucina si cerca il numero */}
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {stepIngredients.map((ing) => {
                  const { amount, name } = ingredientParts(ing);
                  return (
                    <li
                      key={ing.id}
                      className="inline-flex items-baseline gap-1.5 rounded-lg border border-emerald-200 bg-white/80 px-2 py-1 text-[13px]"
                    >
                      {amount && (
                        <span className="shrink-0 font-bold tabular-nums text-emerald-700">{amount}</span>
                      )}
                      <span className="text-emerald-950">{name}</span>
                      {ing.optional && <span className="text-[10px] text-emerald-600">(opz.)</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {nextAt && (
            <p className="mt-2 border-t border-white/60 pt-1.5 text-[11px] text-sky-700">
              Prossimo passo alle <strong className="tabular-nums">{formatClock(nextAt)}</strong>
            </p>
          )}
        </div>
      ) : (
        <div className="min-w-0 rounded-xl border border-green-300/50 bg-green-100/60 backdrop-blur-sm p-3 sm:p-3.5 flex-1 flex items-center gap-2.5 sm:gap-3">
          <PartyPopper size={20} className="text-green-700 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] sm:text-sm font-semibold text-green-900">
              {progress.cooked ? "Cottura registrata!" : "Tutti i passi completati"}
            </p>
            {!progress.cooked && <p className="text-xs text-green-800">Segna la ricetta come cucinata?</p>}
          </div>
          {progress.cooked ? (
            <button
              type="button"
              onClick={undoCooked}
              disabled={cookLoading}
              className="shrink-0 rounded-lg border border-green-400/50 bg-white/60 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-white/80 disabled:opacity-50 transition-colors"
            >
              Annulla
            </button>
          ) : (
            <button
              type="button"
              onClick={markCooked}
              disabled={cookLoading}
              className="shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {cookLoading ? "…" : <span className="inline-flex items-center gap-1"><CookingPot size={13} /> Segna cucinata</span>}
            </button>
          )}
        </div>
      )}

      {/* Navigazione step */}
      {total > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={goBack}
            disabled={progress.stepIdx === 0}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-white/40 bg-white/40 px-3 py-2 text-xs font-medium text-sky-800 hover:bg-white/60 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={14} /> Indietro
          </button>
          {!atCompletion && (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-xs font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Fatto <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
