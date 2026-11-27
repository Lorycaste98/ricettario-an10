"use client";

import { useState } from "react";
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
import { motion, useIsPresent } from "motion/react";
import { PotIcon } from "@/components/icons";
import { An10LogoAnimated } from "@/components/brand/An10LogoAnimated";

/**
 * «Sto cucinando» nella cornice (tavola 8.4): fila blu in cima, una scheda per ricetta in corso.
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

/** 8.4 · scheda di una ricetta in corso: nome in evidenza, sotto il passo corrente; a destra il timer */
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
        // stretta: due schede quasi intere in vista, la terza si intravede (si capisce che scorre)
        "ticket-in flex w-[clamp(9.5rem,42cqi,17rem)] shrink-0 items-center gap-2 rounded-[0.625rem] border-l-4 bg-white px-2.5 py-1.5 text-left text-blu-950 hover:bg-blu-50",
        border
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8125rem] leading-snug font-bold">{recipe.name}</span>
        <span className="block truncate text-[0.6875rem] leading-snug text-grigio">
          {recipe.steps.length === 0
            ? "Nessuna procedura"
            : step
              ? `${current + 1}/${recipe.steps.length} · ${step.text}`
              : "Tutti i passi fatti"}
        </span>
      </span>
      <TimerText timer={timer} now={now} className="text-[0.875rem] text-ambra" />
    </button>
  );
}

/**
 * Fila in cima alla pagina (8.4 · a tutte le larghezze dal 27/11/2026: la vecchia mini-barra 9.3
 * mostrava solo la prima ricetta e un contatore). A sinistra, fermi, il **logo AN10** (quando la fila
 * c'è, il logo della testata sparisce: il logo resta uno per pagina) e la pentola col numero dei timer
 * finiti, punto d'arrivo della pentola che vola (`data-cooking-target`, `lib/cooking-fly.ts`); poi
 * una scheda per ricetta, che scorre in orizzontale. Resta in vista mentre si scorre.
 *
 * La monta AppShell dentro `AnimatePresence`: `animate` = è comparsa ora (prima ricetta aggiunta) e
 * il logo si disegna; quando esce (ultima ricetta tolta) il logo si smonta al contrario e poi la fila
 * si chiude. Con «Riduci movimento» niente di tutto questo.
 */
export function CookingRow({ sticky = true, animate = false }: { sticky?: boolean; animate?: boolean }) {
  const { recipes, now, finished, session } = useCookingData();
  const present = useIsPresent();
  return (
    <motion.div
      // all'apertura della pagina (animate falso) compare e sparisce senza animazioni
      initial={animate ? { height: 0 } : false}
      animate={{ height: "auto", transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ height: 0, transition: animate ? { duration: 0.28, ease: [0.4, 0, 1, 1], delay: 0.6 } : { duration: 0 } }}
      className={clsx(sticky && "sticky top-0 z-30", "shrink-0 overflow-hidden bg-blu-600")}
    >
      <div
        role="region"
        aria-label={`Sto cucinando: ${recipes.length} ${recipes.length === 1 ? "ricetta" : "ricette"}${finished ? `, ${finished} timer finiti` : ""}`}
        className="flex items-center gap-2 py-2 pl-(--pad)"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
      >
        <An10LogoAnimated
          title="Ricettario AN10"
          play={!present ? (animate ? "out" : "still") : animate ? "in" : "still"}
          className="h-6 w-auto shrink-0 text-white"
        />
        <button
          type="button"
          onClick={openCookingDock}
          aria-label="Apri il pannello «Sto cucinando»"
          className="relative ml-1 flex h-11 shrink-0 items-center border-l border-blu-300 pr-0.5 pl-2.5 text-white"
        >
          <span data-cooking-target className="flex">
            <PotIcon className="size-6" />
          </span>
          {finished > 0 && (
            <span className="tabular absolute top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rosa px-1 text-[10px] font-bold ring-2 ring-blu-600">
              {finished}
            </span>
          )}
        </button>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pr-(--pad) [scrollbar-width:none]">
          {recipes.map((r) => (
            <Ticket key={r.recipeId} recipe={r} timers={session.timers.filter((t) => t.recipeId === r.recipeId)} now={now} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/** true se c'è almeno una ricetta in corso */
export function useHasCooking() {
  const session = useCookingSession();
  return session.hydrated && session.recipes.length > 0;
}

/**
 * Per le animazioni della cornice: `cooking` e `changed` = la fila è comparsa o sparita **dopo** il
 * primo caricamento (all'apertura della pagina, con ricette già in corso, niente animazioni).
 */
export function useCookingPresence() {
  const session = useCookingSession();
  const cooking = session.hydrated && session.recipes.length > 0;
  const [prev, setPrev] = useState<boolean | null>(null);
  const [changed, setChanged] = useState(false);
  if (session.hydrated && prev !== cooking) {
    if (prev !== null) setChanged(true);
    setPrev(cooking);
  }
  return { hydrated: session.hydrated, cooking, changed };
}
