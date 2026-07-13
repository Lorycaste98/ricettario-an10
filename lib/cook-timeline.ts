// Matematica della timeline "modalità cucina": data l'ora di servizio del menù
// e (opzionale) un inizio pianificato per ricetta (MenuRecipe.cookStartAt),
// calcola inizio/fine di ogni ricetta e l'orario di ogni step.
// Client-safe, riusa lib/cook-schedule.ts.

import { computeStart, totalLeadMinutes } from "@/lib/cook-schedule";
import { toStepKind, type StepKind } from "@/lib/types";

export interface TimelineStep {
  id: number;
  text: string;
  mins: number | null;
  kind: string;
  order: number;
}

export interface TimelineRecipe {
  id: number;
  name: string;
  photo: string | null;
  prep: number | null;
  cook: number | null;
  /** Inizio pianificato (ISO) salvato su MenuRecipe; null = automatico */
  cookStartAt: string | null;
  steps: TimelineStep[];
}

export interface TimelineSegment {
  stepIdx: number;
  text: string;
  kind: StepKind;
  /** Durata in minuti; 0 = step senza durata (renderizzato come sliver) */
  mins: number;
  /** Minuti dall'inizio della ricetta */
  offsetMins: number;
  startsAt: Date;
}

export interface RecipeSchedule {
  start: Date;
  end: Date;
  leadMins: number;
  /** true se l'inizio è stato impostato a mano (drag), false = calcolo automatico */
  isCustom: boolean;
  /** true se la ricetta finisce dopo l'ora di servizio */
  overshoot: boolean;
  segments: TimelineSegment[];
}

function toSchedulable(recipe: TimelineRecipe) {
  return {
    prep: recipe.prep,
    cook: recipe.cook,
    steps: recipe.steps.map((s) => ({ mins: s.mins, kind: toStepKind(s.kind) })),
  };
}

/** Inizio effettivo: pianificato (cookStartAt) → automatico (all'indietro dal servizio) → serveAt. */
export function defaultStart(recipe: TimelineRecipe, serveAt: Date): Date {
  if (recipe.cookStartAt) {
    const d = new Date(recipe.cookStartAt);
    if (!isNaN(d.getTime())) return d;
  }
  return computeStart(toSchedulable(recipe), serveAt)?.start ?? new Date(serveAt.getTime());
}

export function buildSchedule(recipe: TimelineRecipe, start: Date, serveAt: Date, isCustom: boolean): RecipeSchedule {
  const leadMins = totalLeadMinutes(toSchedulable(recipe));
  let offset = 0;
  const segments: TimelineSegment[] = recipe.steps.map((s, stepIdx) => {
    const mins = s.mins && s.mins > 0 ? s.mins : 0;
    const seg: TimelineSegment = {
      stepIdx,
      text: s.text,
      kind: toStepKind(s.kind),
      mins,
      offsetMins: offset,
      startsAt: new Date(start.getTime() + offset * 60_000),
    };
    offset += mins;
    return seg;
  });
  const end = new Date(start.getTime() + leadMins * 60_000);
  return { start, end, leadMins, isCustom, overshoot: end.getTime() > serveAt.getTime(), segments };
}

/** Orario di inizio di ogni step (per lo stepper della modalità cucina). */
export function stepStartTimes(recipe: TimelineRecipe, start: Date): Date[] {
  let offset = 0;
  return recipe.steps.map((s) => {
    const at = new Date(start.getTime() + offset * 60_000);
    offset += s.mins && s.mins > 0 ? s.mins : 0;
    return at;
  });
}

export function formatClock(d: Date): string {
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export function formatDayShort(d: Date): string {
  return d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric" });
}

/** Arrotonda un delta di minuti al multiplo di `snap` più vicino. */
export function snapMinutes(mins: number, snap = 5): number {
  return Math.round(mins / snap) * snap;
}
