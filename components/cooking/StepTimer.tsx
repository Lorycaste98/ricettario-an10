"use client";
import { AlarmClock, BellRing, Pause, Play, Plus, X } from "lucide-react";
import {
  dismissTimer,
  extendTimer,
  findTimer,
  formatCountdown,
  pauseTimer,
  primeAlarm,
  remainingMs,
  requestNotificationPermission,
  resumeTimer,
  startTimer,
  useCookingSession,
  useNow,
} from "@/lib/cooking-session";
import { formatMinutes } from "@/lib/types";

/**
 * Controllo timer di un passo Attesa/Cottura (`isTimerStep`). Condiviso dalla
 * procedura del dettaglio ricetta e dal pannello «Sto cucinando».
 *
 * `ensureRecipe` viene chiamato prima di avviare: il timer vive nella sessione
 * «Sto cucinando», quindi la ricetta deve esserci (dal dettaglio la si aggiunge
 * al volo). Gli handler fermano la propagazione: il passo nel dettaglio è un
 * bottone che spunta/despunta, il click sul timer non deve toccarlo.
 */
export function StepTimer({
  recipeId,
  stepIndex,
  mins,
  ensureRecipe,
  className = "",
}: {
  recipeId: number;
  stepIndex: number;
  mins: number;
  ensureRecipe?: () => void;
  className?: string;
}) {
  const session = useCookingSession();
  const timer = session.hydrated ? findTimer(session, recipeId, stepIndex) : undefined;
  const now = useNow(timer?.status === "running");

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    fn();
  };

  const pill =
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold shadow-sm transition-colors";
  const iconBtn =
    "flex h-6 w-6 items-center justify-center rounded-full border border-white/60 bg-white/80 text-sky-700 shadow-sm hover:bg-white";

  if (!session.hydrated) return null;

  if (!timer) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={stop(() => {
          primeAlarm();
          void requestNotificationPermission();
          ensureRecipe?.();
          startTimer(recipeId, stepIndex);
        })}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            primeAlarm();
            void requestNotificationPermission();
            ensureRecipe?.();
            startTimer(recipeId, stepIndex);
          }
        }}
        className={`${pill} cursor-pointer border-orange-300/70 bg-orange-50 text-orange-700 hover:bg-orange-100 ${className}`}
      >
        <AlarmClock size={12} /> Avvia timer {formatMinutes(mins)}
      </span>
    );
  }

  if (timer.status === "done") {
    return (
      <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
        <span className={`${pill} animate-pulse border-rose-300 bg-rose-100 text-rose-700`}>
          <BellRing size={12} /> Tempo scaduto!
        </span>
        <button type="button" onClick={stop(() => extendTimer(recipeId, stepIndex, 5))} className={`${pill} border-white/60 bg-white/80 text-sky-800 hover:bg-white`}>
          <Plus size={11} /> 5 min
        </button>
        <button type="button" onClick={stop(() => dismissTimer(recipeId, stepIndex))} className={`${pill} border-green-300 bg-green-100 text-green-800 hover:bg-green-200`}>
          OK
        </button>
      </span>
    );
  }

  const left = remainingMs(timer, now);
  const paused = timer.status === "paused";
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`${pill} tabular-nums ${
          paused ? "border-sky-300 bg-sky-50 text-sky-700" : "border-orange-300 bg-orange-100 text-orange-800"
        }`}
      >
        <AlarmClock size={12} /> {formatCountdown(left)}
        {paused && <span className="font-medium">· in pausa</span>}
      </span>
      <button
        type="button"
        aria-label={paused ? "Riprendi timer" : "Metti in pausa"}
        onClick={stop(() => (paused ? resumeTimer(recipeId, stepIndex) : pauseTimer(recipeId, stepIndex)))}
        className={iconBtn}
      >
        {paused ? <Play size={12} /> : <Pause size={12} />}
      </button>
      <button type="button" aria-label="Aggiungi 1 minuto" onClick={stop(() => extendTimer(recipeId, stepIndex, 1))} className={iconBtn}>
        <Plus size={12} />
      </button>
      <button type="button" aria-label="Annulla timer" onClick={stop(() => dismissTimer(recipeId, stepIndex))} className={`${iconBtn} text-rose-500`}>
        <X size={12} />
      </button>
    </span>
  );
}
