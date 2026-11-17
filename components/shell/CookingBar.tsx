"use client";

import { clsx } from "clsx";
import {
  finishedCount,
  formatCountdown,
  openCookingDock,
  remainingMs,
  useCookingSession,
  useNow,
  type CookingRecipe,
  type CookingTimer,
} from "@/lib/cooking-session";
import { useRecipeProgress } from "@/lib/recipe-progress";
import { PotIcon } from "@/components/icons";

/**
 * «Sto cucinando» nella cornice (tavola 8.4 e 9.3). Sostituisce il vecchio bottone flottante:
 * - pagina larga (≥ 620px di contenitore): fila blu in cima, una scheda per ricetta in corso;
 * - pagina stretta: mini-barra blu sopra la barra in basso.
 * Toccando si apre il pannello di sempre (`CookingDock`, via `openCookingDock`).
 * I dati vengono da `lib/cooking-session.ts` e `lib/recipe-progress.ts`, che non cambiano.
 */

function useCookingData() {
  const session = useCookingSession();
  const running = session.timers.filter((t) => t.status === "running" && t.endsAt !== null);
  const now = useNow(running.length > 0);
  const recipes = [...session.recipes].sort((a, b) => a.addedAt - b.addedAt);
  return { session, recipes, now, finished: finishedCount(session) };
}

/** Timer da mostrare per una ricetta: prima quelli finiti, poi il più vicino alla scadenza. */
function pickTimer(timers: CookingTimer[]): CookingTimer | undefined {
  const done = timers.find((t) => t.status === "done");
  if (done) return done;
  return [...timers].sort((a, b) => (a.endsAt ?? Infinity) - (b.endsAt ?? Infinity))[0];
}

function TimerText({ timer, now, className }: { timer: CookingTimer | undefined; now: number; className?: string }) {
  if (!timer) return null;
  if (timer.status === "done") return <span className={clsx("font-bold text-rosa", className)}>Finito!</span>;
  return <span className={clsx("tabular font-bold", className)}>{formatCountdown(remainingMs(timer, now))}</span>;
}

/** 8.4 · scheda di una ricetta in corso */
function Ticket({ recipe, timers, now }: { recipe: CookingRecipe; timers: CookingTimer[]; now: number }) {
  const [done] = useRecipeProgress(recipe.recipeId, recipe.steps.length);
  const current = recipe.steps.findIndex((_, i) => !done.has(i));
  const step = current >= 0 ? recipe.steps[current] : undefined;
  const timer = pickTimer(timers);
  const border = !step ? "border-l-verde" : step.kind === "WAIT" ? "border-l-giallo-400" : step.kind === "COOK" ? "border-l-arancio" : "border-l-blu-300";
  return (
    <button
      type="button"
      onClick={openCookingDock}
      className={clsx(
        "flex w-[clamp(12.5rem,30cqi,17rem)] shrink-0 items-center gap-2 rounded-[0.625rem] border-l-4 bg-white px-2.5 py-1.5 text-left text-[0.875rem] text-blu-950 hover:bg-blu-50",
        border
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.6875rem] text-grigio">
          {recipe.name}
          {step ? ` · ${current + 1} di ${recipe.steps.length}` : ""}
        </span>
        <span className="block truncate">{step ? step.text : "Tutti i passi fatti"}</span>
      </span>
      <TimerText timer={timer} now={now} className="text-ambra" />
    </button>
  );
}

/** Fila in cima alla pagina (contenitori larghi). Resta in vista mentre si scorre. */
export function CookingRow({ sticky = true }: { sticky?: boolean }) {
  const { session, recipes, now } = useCookingData();
  if (!session.hydrated || recipes.length === 0) return null;
  return (
    <div
      role="region"
      aria-label={`Sto cucinando: ${recipes.length} ricette`}
      className={clsx(sticky && "sticky top-0 z-30", "hidden gap-2 overflow-x-auto bg-blu-600 px-(--pad) py-2 [scrollbar-width:none] @min-[620px]:flex")}
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
    >
      <span className="flex shrink-0 items-center text-white" aria-hidden>
        <PotIcon className="size-6" />
      </span>
      {recipes.map((r) => (
        <Ticket key={r.recipeId} recipe={r} timers={session.timers.filter((t) => t.recipeId === r.recipeId)} now={now} />
      ))}
    </div>
  );
}

/** 9.3 · mini-barra sopra la barra in basso (contenitori stretti) */
export function CookingMiniBar() {
  const { session, recipes, now, finished } = useCookingData();
  if (!session.hydrated || recipes.length === 0) return null;
  const timer = pickTimer(session.timers);
  const lead = timer ? recipes.find((r) => r.recipeId === timer.recipeId) ?? recipes[0] : recipes[0];
  return (
    <button
      type="button"
      onClick={openCookingDock}
      aria-label={`Sto cucinando: ${recipes.length} ricette${finished ? `, ${finished} timer finiti` : ""}. Apri il pannello`}
      className="fixed inset-x-2.5 z-40 flex items-center gap-2.5 rounded-[0.875rem] bg-blu-600 px-3 py-2 text-left text-white shadow-lg @min-[620px]:hidden"
      style={{ bottom: "calc(var(--tabs-h) + env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
    >
      <span className="relative shrink-0">
        <PotIcon className="size-6" />
        {finished > 0 && (
          <span className="tabular absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rosa px-1 text-[10px] font-bold ring-2 ring-blu-600">
            {finished}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.6875rem] text-nav-ink">
          Sto cucinando · {recipes.length} {recipes.length === 1 ? "ricetta" : "ricette"}
        </span>
        <span className="block truncate font-semibold">{timer?.label ?? lead.name}</span>
      </span>
      <TimerText timer={timer} now={now} className="text-[1.1875rem] text-giallo-400" />
    </button>
  );
}

/** true se c'è almeno una ricetta in corso (serve alla cornice per lasciare spazio alla mini-barra) */
export function useHasCooking() {
  const session = useCookingSession();
  return session.hydrated && session.recipes.length > 0;
}
