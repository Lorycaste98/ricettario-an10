"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { toStepKind, type StepKind } from "@/lib/types";
import { useLocalStore } from "@/lib/local-store";

/**
 * «Sto cucinando»: ricette in corso (anche fuori da un menù) + timer dei passi
 * di Attesa/Cottura. Tutto sul **dispositivo** (localStorage), per admin e
 * visitatori, sincronizzato fra schede via evento `storage`.
 *
 * Store module-level con `useSyncExternalStore` (stesso pattern di
 * `lib/favorites.ts`): badge Navbar/bottone flottante, pannello e pagina
 * ricetta leggono lo stesso stato senza provider.
 *
 * - La ricetta porta con sé uno **snapshot dei passi** (testo/minuti/tipo): il
 *   pannello globale non ha i dati della pagina. Lo snapshot si rinfresca ogni
 *   volta che si apre il dettaglio ricetta (`addRecipe` è un upsert).
 * - L'**avanzamento** dei passi NON sta qui: resta in `lib/recipe-progress.ts`
 *   (admin → DB, visitatore → localStorage), così pagina e pannello coincidono.
 * - I timer sono a **orario di fine assoluto** (`endsAt`, epoch ms): sopravvivono
 *   a refresh/chiusura scheda. Un timer scaduto passa a `done` e conta nel badge
 *   finché non viene «visto» (`dismissTimer`).
 */

const STORAGE_KEY = "ricettario:cooking-session";

export interface CookingStep {
  text: string;
  mins: number | null;
  kind: StepKind;
}

/**
 * Riproporzionamento scelto sul dettaglio ricetta (solo a schermo): fattore di
 * scala + ingrediente su cui è stato ricalcolato (null = da porzioni).
 * Salvato qui così sopravvive ai cambi pagina finché la ricetta è in lista.
 */
export interface CookingScale {
  factor: number;
  anchorId: number | null;
}

export interface CookingRecipe {
  recipeId: number;
  name: string;
  photo: string | null;
  steps: CookingStep[];
  addedAt: number;
  /** null = quantità originali */
  scale: CookingScale | null;
}

/** Dati della ricetta passati da chi la aggiunge/rinfresca (`addedAt`/`scale` li gestisce lo store). */
export type CookingRecipeInput = Omit<CookingRecipe, "addedAt" | "scale">;

function parseScale(v: unknown): CookingScale | null {
  if (!isObj(v) || typeof v.factor !== "number" || !Number.isFinite(v.factor) || v.factor <= 0) return null;
  return { factor: v.factor, anchorId: typeof v.anchorId === "number" ? v.anchorId : null };
}

export type TimerStatus = "running" | "paused" | "done";

export interface CookingTimer {
  recipeId: number;
  stepIndex: number;
  /** Testo breve per pannello/notifica (nome ricetta · passo N) */
  label: string;
  durationMs: number;
  /** Fine prevista (epoch ms) se `running`; null se in pausa */
  endsAt: number | null;
  /** Tempo residuo quando in pausa */
  remainingMs: number;
  status: TimerStatus;
  /** Quando è scaduto (epoch ms), solo per `done` */
  firedAt: number | null;
}

export interface CookingState {
  recipes: CookingRecipe[];
  timers: CookingTimer[];
}

interface Snapshot extends CookingState {
  hydrated: boolean;
}

const EMPTY: Snapshot = { recipes: [], timers: [], hydrated: false };

let snapshot: Snapshot = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

// ── Persistenza ─────────────────────────────────────────────────────────────

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseState(raw: string | null): CookingState {
  if (!raw) return { recipes: [], timers: [] };
  try {
    const p: unknown = JSON.parse(raw);
    if (!isObj(p)) return { recipes: [], timers: [] };
    const recipes = (Array.isArray(p.recipes) ? p.recipes : [])
      .filter(isObj)
      .filter((r) => typeof r.recipeId === "number" && typeof r.name === "string" && Array.isArray(r.steps))
      .map((r): CookingRecipe => ({
        recipeId: r.recipeId as number,
        name: r.name as string,
        photo: typeof r.photo === "string" ? r.photo : null,
        steps: (r.steps as unknown[]).filter(isObj).map((s) => ({
          text: typeof s.text === "string" ? s.text : "",
          mins: typeof s.mins === "number" ? s.mins : null,
          kind: toStepKind(s.kind),
        })),
        addedAt: typeof r.addedAt === "number" ? r.addedAt : Date.now(),
        scale: parseScale(r.scale),
      }));
    const ids = new Set(recipes.map((r) => r.recipeId));
    const timers = (Array.isArray(p.timers) ? p.timers : [])
      .filter(isObj)
      .filter(
        (t) =>
          typeof t.recipeId === "number" &&
          ids.has(t.recipeId) &&
          typeof t.stepIndex === "number" &&
          typeof t.durationMs === "number" &&
          (t.status === "running" || t.status === "paused" || t.status === "done")
      )
      .map((t): CookingTimer => ({
        recipeId: t.recipeId as number,
        stepIndex: t.stepIndex as number,
        label: typeof t.label === "string" ? t.label : "",
        durationMs: t.durationMs as number,
        endsAt: typeof t.endsAt === "number" ? t.endsAt : null,
        remainingMs: typeof t.remainingMs === "number" ? t.remainingMs : (t.durationMs as number),
        status: t.status as TimerStatus,
        firedAt: typeof t.firedAt === "number" ? t.firedAt : null,
      }));
    return { recipes, timers };
  } catch {
    return { recipes: [], timers: [] };
  }
}

function readStorage(): CookingState {
  if (typeof window === "undefined") return { recipes: [], timers: [] };
  try {
    return parseState(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return { recipes: [], timers: [] };
  }
}

/** Timer `running` già oltre la fine → `done` (es. scaduti a pagina chiusa). */
function settleExpired(state: CookingState, now: number): { state: CookingState; fired: CookingTimer[] } {
  const fired: CookingTimer[] = [];
  const timers = state.timers.map((t) => {
    if (t.status === "running" && t.endsAt !== null && t.endsAt <= now) {
      const done: CookingTimer = { ...t, status: "done", remainingMs: 0, firedAt: t.endsAt };
      fired.push(done);
      return done;
    }
    return t;
  });
  return { state: fired.length ? { ...state, timers } : state, fired };
}

function publish(state: CookingState) {
  snapshot = { ...state, hydrated: true };
  for (const l of listeners) l();
}

function commit(state: CookingState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ recipes: state.recipes, timers: state.timers }));
  } catch {
    // storage pieno/negato: lo stato in memoria resta comunque aggiornato
  }
  publish(state);
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  // I timer scaduti a pagina chiusa diventano `done` (contano nel badge) senza suonare
  const { state, fired } = settleExpired(readStorage(), Date.now());
  if (fired.length) commit(state);
  else publish(state);
}

function onStorage(e: StorageEvent) {
  if (e.key !== null && e.key !== STORAGE_KEY) return;
  publish(readStorage());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  ensureLoaded();
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => EMPTY;

function current(): CookingState {
  ensureLoaded();
  return { recipes: snapshot.recipes, timers: snapshot.timers };
}

// ── Lettura ─────────────────────────────────────────────────────────────────

/** Stato completo. `hydrated` false su server/primo render: non disegnare badge prima. */
export function useCookingSession(): Snapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Numero di timer scaduti e non ancora visti: è il numero del badge. */
export function finishedCount(state: CookingState): number {
  return state.timers.filter((t) => t.status === "done").length;
}

export function findTimer(state: CookingState, recipeId: number, stepIndex: number): CookingTimer | undefined {
  return state.timers.find((t) => t.recipeId === recipeId && t.stepIndex === stepIndex);
}

/** Un passo ha il timer se è Attesa o Cottura con minuti. */
export function isTimerStep(step: { mins: number | null; kind?: string }): boolean {
  const kind = toStepKind(step.kind);
  return (kind === "WAIT" || kind === "COOK") && !!step.mins && step.mins > 0;
}

/** Millisecondi rimanenti di un timer a `now` (0 se scaduto). */
export function remainingMs(t: CookingTimer, now: number): number {
  if (t.status === "done") return 0;
  if (t.status === "paused" || t.endsAt === null) return t.remainingMs;
  return Math.max(0, t.endsAt - now);
}

/** "12:34" oppure "1:02:03" */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** Orologio che ticca ogni `intervalMs` solo mentre `active` (countdown visibili). */
export function useNow(active: boolean, intervalMs = 1000): number {
  const subscribeNow = useCallback(
    (cb: () => void) => {
      if (!active) return () => {};
      const id = window.setInterval(cb, intervalMs);
      return () => window.clearInterval(id);
    },
    [active, intervalMs]
  );
  // Arrotondato all'intervallo: snapshot stabile fra due tick (useSyncExternalStore lo esige)
  return useSyncExternalStore(
    subscribeNow,
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => 0
  );
}

// ── Scrittura ───────────────────────────────────────────────────────────────

/**
 * Aggiunge la ricetta o ne rinfresca lo snapshot (mantiene `addedAt` e la scala
 * già salvata). `scale` si passa solo all'ingresso, per portarsi dietro un
 * ricalcolo fatto prima di aggiungerla.
 */
export function addRecipe(r: CookingRecipeInput, scale?: CookingScale | null) {
  const s = current();
  const existing = s.recipes.find((x) => x.recipeId === r.recipeId);
  const steps = r.steps.map((st) => ({ text: st.text, mins: st.mins, kind: toStepKind(st.kind) }));
  const next: CookingRecipe = {
    recipeId: r.recipeId,
    name: r.name,
    photo: r.photo,
    steps,
    addedAt: existing?.addedAt ?? Date.now(),
    scale: existing ? existing.scale : (scale ?? null),
  };
  if (existing && JSON.stringify(existing) === JSON.stringify(next)) return;
  // Se il numero di passi è cambiato i timer per indice non sono più affidabili
  const timers =
    existing && existing.steps.length !== steps.length
      ? s.timers.filter((t) => t.recipeId !== r.recipeId)
      : s.timers;
  const recipes = existing
    ? s.recipes.map((x) => (x.recipeId === r.recipeId ? next : x))
    : [...s.recipes, next];
  commit({ recipes, timers });
}

/** Rinfresca lo snapshot solo se la ricetta è già in lista (visita del dettaglio). */
export function refreshRecipe(r: CookingRecipeInput) {
  if (current().recipes.some((x) => x.recipeId === r.recipeId)) addRecipe(r);
}

/** Toglie la ricetta e tutti i suoi timer. */
export function removeRecipe(recipeId: number) {
  const s = current();
  commit({
    recipes: s.recipes.filter((r) => r.recipeId !== recipeId),
    timers: s.timers.filter((t) => t.recipeId !== recipeId),
  });
}

/** Salva il riproporzionamento di una ricetta in lista (fattore 1 = quantità originali). */
export function setRecipeScale(recipeId: number, scale: CookingScale | null) {
  const s = current();
  const normalized = scale && Math.abs(scale.factor - 1) > 1e-9 ? scale : null;
  commit({
    ...s,
    recipes: s.recipes.map((r) => (r.recipeId === recipeId ? { ...r, scale: normalized } : r)),
  });
}

/**
 * «Finito e rimuovi»: registra la cottura (solo admin: l'API è protetta) e toglie
 * la ricetta dalla lista con i suoi timer. Ritorna false se la registrazione
 * fallisce — in quel caso la ricetta resta in lista. L'avanzamento dei passi lo
 * azzera il chiamante (vive in `recipe-progress.ts`).
 */
export async function finishRecipe(recipeId: number, countCook: boolean): Promise<boolean> {
  if (countCook) {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/cook`, { method: "POST" });
      if (!res.ok) return false;
    } catch {
      return false;
    }
  }
  removeRecipe(recipeId);
  return true;
}

export function isCooking(state: CookingState, recipeId: number): boolean {
  return state.recipes.some((r) => r.recipeId === recipeId);
}

/** Avvia (o riavvia da capo) il timer di un passo. La ricetta deve essere in lista. */
export function startTimer(recipeId: number, stepIndex: number) {
  const s = current();
  const recipe = s.recipes.find((r) => r.recipeId === recipeId);
  const step = recipe?.steps[stepIndex];
  if (!recipe || !step || !step.mins) return;
  const durationMs = step.mins * 60_000;
  const timer: CookingTimer = {
    recipeId,
    stepIndex,
    label: `${recipe.name} · passo ${stepIndex + 1}`,
    durationMs,
    endsAt: Date.now() + durationMs,
    remainingMs: durationMs,
    status: "running",
    firedAt: null,
  };
  commit({
    ...s,
    timers: [...s.timers.filter((t) => !(t.recipeId === recipeId && t.stepIndex === stepIndex)), timer],
  });
}

function updateTimer(recipeId: number, stepIndex: number, fn: (t: CookingTimer) => CookingTimer | null) {
  const s = current();
  const timers: CookingTimer[] = [];
  for (const t of s.timers) {
    if (t.recipeId === recipeId && t.stepIndex === stepIndex) {
      const n = fn(t);
      if (n) timers.push(n);
    } else timers.push(t);
  }
  commit({ ...s, timers });
}

export function pauseTimer(recipeId: number, stepIndex: number) {
  updateTimer(recipeId, stepIndex, (t) =>
    t.status === "running" ? { ...t, status: "paused", remainingMs: remainingMs(t, Date.now()), endsAt: null } : t
  );
}

export function resumeTimer(recipeId: number, stepIndex: number) {
  updateTimer(recipeId, stepIndex, (t) =>
    t.status === "paused" ? { ...t, status: "running", endsAt: Date.now() + t.remainingMs } : t
  );
}

/** Aggiunge minuti (anche a un timer scaduto: riparte). */
export function extendTimer(recipeId: number, stepIndex: number, minutes: number) {
  const add = minutes * 60_000;
  updateTimer(recipeId, stepIndex, (t) => {
    if (t.status === "paused") return { ...t, remainingMs: t.remainingMs + add };
    if (t.status === "done") return { ...t, status: "running", endsAt: Date.now() + add, remainingMs: add, firedAt: null };
    return { ...t, endsAt: (t.endsAt ?? Date.now()) + add };
  });
}

/** Annulla un timer, oppure segna come «visto» uno scaduto (esce dal badge). */
export function dismissTimer(recipeId: number, stepIndex: number) {
  updateTimer(recipeId, stepIndex, () => null);
}

// ── Scheduler (scadenze, suono, notifica) ───────────────────────────────────

let audioCtx: AudioContext | null = null;

/** Da chiamare in un gesto utente (es. «Avvia timer»): sblocca l'audio su iOS/Safari. */
export function primeAlarm() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx ??= new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();
  } catch {
    // audio non disponibile: resta il badge
  }
}

function ring() {
  try {
    if (audioCtx) {
      const t0 = audioCtx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, t0 + i * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.3, t0 + i * 0.35 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.35 + 0.25);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t0 + i * 0.35);
        osc.stop(t0 + i * 0.35 + 0.3);
      }
    }
  } catch {
    /* ignore */
  }
  try {
    navigator.vibrate?.([300, 150, 300]);
  } catch {
    /* ignore */
  }
}

function notify(fired: CookingTimer[]) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;
  const show = async () => {
    // Android Chrome vieta `new Notification()` ("Illegal constructor"): lì passa
    // solo dal service worker. Se uno è registrato si usa quello, altrimenti il costruttore.
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    for (const t of fired) {
      const opts = { body: t.label, tag: `cook-${t.recipeId}-${t.stepIndex}` };
      if (reg) await reg.showNotification("Timer finito", opts);
      else new Notification("Timer finito", opts);
    }
  };
  // Errori silenziosi: restano badge + suono
  show().catch(() => {});
}

function fire() {
  const { state, fired } = settleExpired(current(), Date.now());
  if (!fired.length) return;
  commit(state);
  ring();
  notify(fired);
}

/**
 * Montare **una volta** (nel bottone globale): programma un timeout sulla
 * prossima scadenza, la marca `done`, suona e (se la scheda è in background e
 * il permesso è concesso) mostra una notifica di sistema. Al ritorno in primo
 * piano ricontrolla: i browser rallentano i timeout delle schede nascoste.
 */
export function useCookingScheduler() {
  const { timers } = useCookingSession();
  const [keepAwake] = useKeepAwake();
  const anyRunning = timers.some((t) => t.status === "running");
  useScreenWakeLock(keepAwake && anyRunning);
  const nextEnd = timers.reduce<number | null>(
    (min, t) => (t.status === "running" && t.endsAt !== null && (min === null || t.endsAt < min) ? t.endsAt : min),
    null
  );
  useEffect(() => {
    if (nextEnd === null) return;
    const id = window.setTimeout(fire, Math.max(0, nextEnd - Date.now()) + 50);
    const onVisible = () => {
      if (document.visibilityState === "visible") fire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [nextEnd]);
}

/** Chiede il permesso notifiche (solo da gesto utente). Ritorna lo stato finale. */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

// ── Schermo acceso durante i timer ──────────────────────────────────────────

const KEEP_AWAKE_KEY = "ricettario:cooking-keep-awake";

/** Preferenza del dispositivo: tenere lo schermo acceso mentre un timer corre (default sì). */
export function useKeepAwake() {
  return useLocalStore<boolean>(KEEP_AWAKE_KEY, true, (raw) => raw !== "false", (v) => String(v));
}

export function wakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

/**
 * Screen Wake Lock finché `active`: su telefono/tablet lo schermo non si blocca da
 * solo, quindi la pagina resta viva e il timer suona in tempo (a schermo bloccato
 * il browser sospende la pagina e nessun timer JS può scattare). Il browser
 * rilascia il lock quando la scheda va in background: lo si richiede al ritorno.
 */
function useScreenWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !wakeLockSupported()) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== "visible" || (sentinel && !sentinel.released)) return;
      try {
        const s = await navigator.wakeLock.request("screen");
        if (cancelled) void s.release();
        else sentinel = s;
      } catch {
        // negato (risparmio energetico, iframe…): resta il comportamento normale
      }
    };
    void acquire();
    const onVisible = () => void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (sentinel && !sentinel.released) void sentinel.release();
    };
  }, [active]);
}

// ── Ingresso dalle liste e apertura del pannello ────────────────────────────

const OPEN_DOCK_EVENT = "ricettario:open-cooking-dock";

/** Apre il pannello «Sto cucinando» da qualunque punto (stesso pattern di `openPhotoViewer`). */
export function openCookingDock() {
  window.dispatchEvent(new Event(OPEN_DOCK_EVENT));
}

/** Ascolta le richieste di apertura del pannello (usato da `CookingDock`). */
export function useOpenCookingDockListener(onOpen: () => void) {
  useEffect(() => {
    window.addEventListener(OPEN_DOCK_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_DOCK_EVENT, onOpen);
  }, [onOpen]);
}

interface RecipeDetailPayload {
  id: number;
  name: string;
  photo?: string | null;
  photos?: { url: string }[];
  steps?: { text: string; mins: number | null; kind?: string }[];
}

/**
 * Aggiunge una ricetta conoscendo solo l'id (card delle liste, che non hanno i
 * passi): scarica il dettaglio da `GET /api/recipes/[id]` e crea lo snapshot.
 * Ritorna false se il dettaglio non è raggiungibile.
 */
export async function addRecipeById(recipeId: number): Promise<boolean> {
  if (current().recipes.some((r) => r.recipeId === recipeId)) return true;
  try {
    const res = await fetch(`/api/recipes/${recipeId}`);
    if (!res.ok) return false;
    const data = (await res.json()) as RecipeDetailPayload;
    addRecipe({
      recipeId,
      name: data.name,
      photo: data.photo ?? data.photos?.[0]?.url ?? null,
      steps: (data.steps ?? []).map((s) => ({ text: s.text, mins: s.mins, kind: toStepKind(s.kind) })),
    });
    return true;
  } catch {
    return false;
  }
}
