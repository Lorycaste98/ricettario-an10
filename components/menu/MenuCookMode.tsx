"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, PartyPopper } from "lucide-react";
import { formatMinutes, toStepKind, STEP_KIND_LABEL, type StepKind } from "@/lib/types";
import { useLocalStore } from "@/lib/local-store";

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
}

interface Recipe {
  id: number;
  name: string;
  photo: string | null;
  cookCount: number;
  steps: Step[];
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

export function MenuCookMode({ menuId, recipes }: { menuId: number; recipes: Recipe[] }) {
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
    return <p className="text-sm text-sky-300/60">Questo menù non ha ancora ricette.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {recipes.map((recipe) => (
        <RecipeCookCard
          key={recipe.id}
          recipe={recipe}
          progress={progress[recipe.id] ?? { stepIdx: 0, cooked: false }}
          onChange={(patch) => update(recipe.id, patch)}
        />
      ))}
    </div>
  );
}

function RecipeCookCard({
  recipe,
  progress,
  onChange,
}: {
  recipe: Recipe;
  progress: Progress;
  onChange: (patch: Partial<Progress>) => void;
}) {
  const [cookLoading, setCookLoading] = useState(false);
  const { steps } = recipe;
  const total = steps.length;
  const atCompletion = progress.stepIdx >= total;
  const step = atCompletion ? null : steps[progress.stepIdx];

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
    <div className="rounded-2xl border border-white/25 bg-white/30 backdrop-blur-sm p-4 sm:p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-sky-100">
          {recipe.photo ? (
            <Image src={recipe.photo} alt={recipe.name} fill className="object-cover" sizes="44px" />
          ) : (
            <div className="flex h-full items-center justify-center text-lg">🍽️</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/ricette/${recipe.id}`} className="block truncate text-sm font-semibold text-sky-950 hover:text-orange-600 transition-colors">
            {recipe.name}
          </Link>
          {total > 0 && (
            <p className="text-[11px] text-sky-700/70 tabular-nums">
              {atCompletion ? "Procedura completata" : `Passo ${progress.stepIdx + 1}/${total}`}
            </p>
          )}
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
        <div className="rounded-xl bg-white/40 border border-white/30 p-3.5 flex-1">
          <p className="text-sm leading-relaxed text-sky-900">{step.text}</p>
          {(() => {
            const kind = toStepKind(step.kind);
            const badge = KIND_BADGE[kind];
            if (!step.mins && !badge) return null;
            return (
              <div className="mt-2 flex items-center gap-2 text-xs">
                {badge && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge}`}>{STEP_KIND_LABEL[kind]}</span>}
                {step.mins && step.mins > 0 && <span className="text-sky-600">⏱ {formatMinutes(step.mins)}</span>}
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="rounded-xl border border-green-300/50 bg-green-100/60 backdrop-blur-sm p-3.5 flex-1 flex items-center gap-3">
          <PartyPopper size={22} className="text-green-700 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-900">
              {progress.cooked ? "Cottura registrata!" : "Tutti i passi completati"}
            </p>
            {!progress.cooked && <p className="text-xs text-green-800/80">Segna la ricetta come cucinata?</p>}
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
              {cookLoading ? "…" : "🍳 Segna cucinata"}
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
