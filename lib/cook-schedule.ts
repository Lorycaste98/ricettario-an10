// Calcolo del "quando iniziare" una ricetta in funzione della data/ora di servizio
// di un menù. Condiviso tra pagina dettaglio menù ed eventuali altri usi.

import { type StepKind } from "@/lib/types";

export interface SchedulableStep {
  mins: number | null;
  kind: StepKind;
}

export interface SchedulableRecipe {
  prep: number | null;
  cook: number | null;
  steps?: SchedulableStep[];
}

/**
 * Tempo totale (in minuti) che intercorre tra l'inizio delle preparazioni e il
 * servizio: somma di TUTTI i minuti degli step (prep + cottura + attesa).
 * Se gli step non hanno minuti, ripiega su `prep + cook`.
 */
export function totalLeadMinutes(recipe: SchedulableRecipe): number {
  const stepsSum = (recipe.steps ?? []).reduce((s, st) => s + (st.mins ?? 0), 0);
  if (stepsSum > 0) return stepsSum;
  return (recipe.prep ?? 0) + (recipe.cook ?? 0);
}

export interface StartInfo {
  /** Istante in cui iniziare (Date). */
  start: Date;
  /** Lead time totale in minuti. */
  leadMins: number;
  /** true se l'inizio cade in un giorno di calendario diverso dal servizio. */
  differentDay: boolean;
}

/**
 * Calcola quando iniziare a preparare `recipe` per essere pronti all'ora di
 * servizio `serveAt`. Ritorna null se il lead time è 0.
 */
export function computeStart(recipe: SchedulableRecipe, serveAt: Date): StartInfo | null {
  const leadMins = totalLeadMinutes(recipe);
  if (leadMins <= 0) return null;
  const start = new Date(serveAt.getTime() - leadMins * 60_000);
  const differentDay =
    start.getFullYear() !== serveAt.getFullYear() ||
    start.getMonth() !== serveAt.getMonth() ||
    start.getDate() !== serveAt.getDate();
  return { start, leadMins, differentDay };
}

/**
 * Combina la data del menù (ISO o Date) con un orario di servizio "HH:mm".
 * Se `servingTime` è assente usa mezzanotte (granularità giorno).
 * Ritorna { serveAt, hasTime } o null se la data manca.
 */
export function resolveServeAt(
  date: string | Date | null,
  servingTime: string | null
): { serveAt: Date; hasTime: boolean } | null {
  if (!date) return null;
  const base = typeof date === "string" ? new Date(date) : new Date(date.getTime());
  if (isNaN(base.getTime())) return null;
  const match = servingTime?.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    base.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return { serveAt: base, hasTime: true };
  }
  base.setHours(0, 0, 0, 0);
  return { serveAt: base, hasTime: false };
}

const DATE_FMT: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
const TIME_FMT: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

/**
 * Etichetta leggibile "quando iniziare". Esempi:
 *  - con ora, giorno diverso: "Inizia il 23 dic alle 18:40"
 *  - con ora, stesso giorno:  "Inizia alle 18:40"
 *  - senza ora, giorno diverso: "Inizia il 23 dic"
 *  - senza ora, stesso giorno:  "Stesso giorno"
 */
export function startLabel(info: StartInfo, hasTime: boolean): string {
  const day = info.start.toLocaleDateString("it-IT", DATE_FMT);
  const time = info.start.toLocaleTimeString("it-IT", TIME_FMT);
  if (hasTime) {
    return info.differentDay ? `Inizia il ${day} alle ${time}` : `Inizia alle ${time}`;
  }
  return info.differentDay ? `Inizia il ${day}` : "Stesso giorno";
}
