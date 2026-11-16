"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlarmClock, Check, ChevronLeft, ListX, PartyPopper, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { toStepKind } from "@/lib/types";
import {
  formatQty,
  resolveLinkQty,
  splitIngredientIds,
  type StepIngredientLink,
} from "@/lib/step-ingredients";
import { formatClock } from "@/lib/cook-timeline";
import { useLocalStore } from "@/lib/local-store";
import { StartTimeEditor } from "@/components/menu/StartTimeEditor";
import { CurrentStep, StepNeeds } from "@/components/cooking/CurrentStep";
import { An10Logo } from "@/components/brand/An10Logo";
import { PotIcon } from "@/components/icons";
import { Button, IconButton } from "@/components/ds/Button";
import { StepProgress } from "@/components/ds/Progress";
import { QuickRecipeTag, Tag } from "@/components/ds/Tag";

// Card ricetta della modalità cucina (restyle fase 4): bianca come le altre schede.
// `min-w-0`: senza, la traccia della griglia si allarga alla min-content della card
// (parole lunghe nel testo dello step) e la card finisce oltre il bordo dello schermo.
const cookCardCls = "flex min-w-0 flex-col gap-3 rounded-card border border-blu-150 bg-white p-[1em]";

interface Step {
  id: number;
  text: string;
  mins: number | null;
  kind: string;
  order: number;
  /**
   * Ingredienti necessari al passo (id di `Recipe.ingredients` + quantità usata in
   * questo passo, già scalata sulle porzioni del menù); assente = nessun legame
   */
  stepIngredients?: StepIngredientLink[];
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

/**
 * "500 g" (già scalata) e nome, separati: in cucina si legge prima il numero.
 * `qty` è quella del passo quando indicata, altrimenti quella piena dell'ingrediente
 * (o «il resto» se sono altri passi a ripartirla) — vedi `resolveLinkQty`.
 */
function ingredientParts(ing: CookIngredient, qty: number | null, split: boolean): { amount: string; name: string } {
  const resolved = resolveLinkQty(qty, ing.qty, split);
  const amount =
    resolved != null
      ? [formatQty(resolved), ing.unit].filter(Boolean).join(" ")
      : ing.qty != null
      ? "il resto"
      : ing.unit ?? "";
  return { amount, name: ing.name };
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
    return <p className="text-[0.9375rem] text-grigio">Questo menù non ha ancora ricette.</p>;
  }

  return (
    <div className="grid gap-(--gap) @min-[760px]:grid-cols-2">
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
    <div className={cookCardCls}>
      {/* Testata: stessa anatomia della card con i passi */}
      <div className="flex items-center gap-3">
        <Thumb photo={recipe.photo} />
        <div className="min-w-0 flex-1">
          <span className="block truncate font-bold">{recipe.name}</span>
          <QuickRecipeTag />
        </div>
      </div>

      {/* Al posto del passo corrente: qui non c'è nulla da seguire */}
      <div className="flex flex-1 items-center gap-2 rounded-card border border-dashed border-blu-200 bg-blu-50 p-3 text-[0.875rem] text-grigio">
        <ListX className="size-4 shrink-0" aria-hidden />
        Nessuna procedura da seguire.
      </div>

      {cooked ? (
        <Button variant="secondary" icon={<Check />} onClick={() => void undoCooked()} loading={cookLoading} className="border-verde-200 text-verde">
          Cucinata · annulla
        </Button>
      ) : (
        <Button icon={<PotIcon />} onClick={() => void markCooked()} loading={cookLoading}>
          Segna cucinata
        </Button>
      )}
    </div>
  );
}

/** Miniatura 44px della card: foto o logo AN10 su azzurro (come le card senza foto) */
function Thumb({ photo }: { photo: string | null }) {
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-ctl bg-blu-100 text-blu-600">
      {photo ? <Image src={photo} alt="" fill className="object-cover" sizes="44px" /> : <An10Logo variant="simbolo" title="" className="w-1/2" />}
    </span>
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
  const splitIds = splitIngredientIds(steps);
  const stepIngredients = step
    ? (step.stepIngredients ?? [])
        .map((link) => {
          const ing = recipe.ingredients?.find((i) => i.id === link.ingredientId);
          return ing ? { ing, qty: link.qty } : null;
        })
        .filter((x): x is { ing: CookIngredient; qty: number | null } => !!x)
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

  const needs = stepIngredients.map(({ ing, qty }) => {
    const { amount, name } = ingredientParts(ing, qty, splitIds.has(ing.id));
    return { key: ing.id, amount, name, optional: ing.optional };
  });

  return (
    <div className={cookCardCls}>
      <div className="flex items-center gap-3">
        <Thumb photo={recipe.photo} />
        <div className="min-w-0 flex-1">
          <Link href={`/ricette/${recipe.id}`} className="block truncate font-bold hover:text-blu-700">
            {recipe.name}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {total > 0 && (
              <span className="tabular text-(length:--fs-meta) text-grigio">
                {atCompletion ? "Procedura completata" : `Passo ${progress.stepIdx + 1} di ${total}`}
              </span>
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
          <IconButton size="row" label="Ricomincia" onClick={restart}>
            <RotateCcw />
          </IconButton>
        )}
      </div>

      {total > 0 && (
        <StepProgress total={total} done={Math.min(progress.stepIdx, total)} current={atCompletion ? undefined : progress.stepIdx} />
      )}

      {step ? (
        <CurrentStep
          size="sm"
          className="flex-1"
          n={progress.stepIdx + 1}
          kind={toStepKind(step.kind)}
          mins={step.mins}
          text={step.text}
          tags={
            stepAt && (
              <Tag tone="wait" icon={<AlarmClock />}>
                <span className="tabular">inizia alle {formatClock(stepAt)}</span>
              </Tag>
            )
          }
          needs={needs.length > 0 ? <StepNeeds items={needs} /> : undefined}
          footer={
            nextAt && (
              <>
                Prossimo passo alle <b className="tabular text-blu-950">{formatClock(nextAt)}</b>
              </>
            )
          }
          actions={
            <>
              <Button variant="secondary" icon={<ChevronLeft />} onClick={goBack} disabled={progress.stepIdx === 0}>
                Indietro
              </Button>
              <Button size="lg" icon={<Check />} onClick={goNext} className="ml-auto">
                Fatto
              </Button>
            </>
          }
        />
      ) : (
        <div
          className={clsx(
            "flex flex-1 flex-wrap items-center gap-3 rounded-card border p-[0.875em]",
            progress.cooked ? "border-verde-200 bg-verde-50" : "border-blu-150 bg-blu-50"
          )}
        >
          <PartyPopper className={clsx("size-6 shrink-0", progress.cooked ? "text-verde" : "text-blu-700")} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{progress.cooked ? "Cottura registrata" : "Tutti i passi fatti"}</p>
            {!progress.cooked && <p className="text-[0.875rem] text-grigio">La segno come cucinata?</p>}
          </div>
          {progress.cooked ? (
            <Button size="sm" variant="secondary" onClick={() => void undoCooked()} loading={cookLoading}>
              Annulla
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" icon={<ChevronLeft />} onClick={goBack}>
                Indietro
              </Button>
              <Button icon={<PotIcon />} onClick={() => void markCooked()} loading={cookLoading}>
                Segna cucinata
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
