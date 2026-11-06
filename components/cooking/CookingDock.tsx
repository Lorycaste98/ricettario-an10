"use client";
import { useCallback, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellRing, Check, ChevronLeft, CookingPot, PartyPopper, Scale, Sun, Timer, X } from "lucide-react";
import {
  finishRecipe,
  finishedCount,
  formatCountdown,
  isTimerStep,
  remainingMs,
  removeRecipe,
  requestNotificationPermission,
  useCookingScheduler,
  useCookingSession,
  useKeepAwake,
  useNow,
  useOpenCookingDockListener,
  wakeLockSupported,
  type CookingRecipe,
  type CookingTimer,
} from "@/lib/cooking-session";
import { useRecipeProgress } from "@/lib/recipe-progress";
import { useAuth } from "@/components/AuthProvider";
import { formatMinutes, STEP_KIND_LABEL, type StepKind } from "@/lib/types";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { StepTimer } from "@/components/cooking/StepTimer";

/**
 * «Sto cucinando»: bottone flottante globale (montato una volta in app/layout.tsx)
 * + dialog con una card per ricetta in corso. Monta anche lo scheduler dei timer
 * (`useCookingScheduler`): scadenze, suono e notifiche passano tutti da qui.
 */

// Stesso "vetro chiaro" leggibile delle card della modalità cucina
const cardCls = "min-w-0 rounded-2xl border border-white/60 bg-white/75 backdrop-blur-md p-3.5 sm:p-4 shadow-sm";

const KIND_BADGE: Partial<Record<StepKind, string>> = {
  COOK: "bg-red-100 text-red-700",
  WAIT: "bg-amber-100 text-amber-700",
};

const noopSubscribe = () => () => {};

function useNotificationPermission(): [NotificationPermission | "unsupported" | null, () => void] {
  // Letta dal browser solo lato client; il bump forza la rilettura dopo la richiesta
  const [bump, setBump] = useState(0);
  const perm = useSyncExternalStore(
    noopSubscribe,
    () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
    () => null
  );
  const ask = () => {
    void requestNotificationPermission().then(() => setBump(bump + 1));
  };
  return [perm, ask];
}

export function CookingDock() {
  useCookingScheduler();
  const session = useCookingSession();
  const [open, setOpen] = useState(false);
  // Apertura da fuori (es. bottone pentola sulle card delle liste)
  useOpenCookingDockListener(useCallback(() => setOpen(true), []));
  const count = session.recipes.length;

  const running = session.timers.filter((t) => t.status === "running" && t.endsAt !== null);
  const nearest = running.reduce<CookingTimer | null>(
    (min, t) => (min === null || (t.endsAt ?? 0) < (min.endsAt ?? 0) ? t : min),
    null
  );
  const now = useNow(nearest !== null);
  const finished = finishedCount(session);

  if (!session.hydrated || session.recipes.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Sto cucinando: ${session.recipes.length} ricette${finished ? `, ${finished} timer finiti` : ""}`}
        className="fixed right-4 z-40 flex items-center gap-2 rounded-full bg-orange-500 py-2.5 pl-3 pr-3.5 text-white shadow-lg shadow-orange-900/30 ring-1 ring-white/40 transition-colors hover:bg-orange-600 active:bg-orange-700"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <span className="relative">
          <CookingPot size={22} />
          {finished > 0 && (
            <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-orange-500">
              {finished > 99 ? "99+" : finished}
            </span>
          )}
        </span>
        {/* Numero di ricette in lista */}
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold tabular-nums text-orange-600">
          {count}
        </span>
        {nearest ? (
          <span className="text-xs font-semibold tabular-nums">{formatCountdown(remainingMs(nearest, now))}</span>
        ) : (
          <span className="hidden text-xs font-semibold sm:inline">Sto cucinando</span>
        )}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Sto cucinando (${count})`} size="md" bodyClassName="space-y-3">
        <FinishedTimers timers={session.timers.filter((t) => t.status === "done")} />
        {[...session.recipes]
          .sort((a, b) => a.addedAt - b.addedAt)
          .map((r) => (
            <CookingRecipeCard
              key={r.recipeId}
              recipe={r}
              timers={session.timers.filter((t) => t.recipeId === r.recipeId)}
              onNavigate={() => setOpen(false)}
            />
          ))}
        <KeepAwakeToggle />
        <NotificationHint />
      </Modal>
    </>
  );
}

function FinishedTimers({ timers }: { timers: CookingTimer[] }) {
  if (timers.length === 0) return null;
  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50/90 p-3 shadow-sm">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-rose-800">
        <BellRing size={15} /> Timer finiti
      </h3>
      <ul className="space-y-2">
        {timers.map((t) => (
          <li key={`${t.recipeId}-${t.stepIndex}`} className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 text-sm text-rose-900">{t.label}</span>
            <StepTimer recipeId={t.recipeId} stepIndex={t.stepIndex} mins={Math.round(t.durationMs / 60_000)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function NotificationHint() {
  const [perm, ask] = useNotificationPermission();
  if (perm !== "default") return null;
  return (
    <p className="pt-1 text-xs text-sky-700">
      <button type="button" onClick={ask} className="font-semibold text-orange-600 underline underline-offset-2 hover:text-orange-700">
        Attiva notifiche
      </button>{" "}
      per essere avvisato quando un timer finisce mentre usi un&apos;altra scheda o finestra. A telefono bloccato non arrivano: per questo, mentre un timer corre, lo schermo resta acceso.
    </p>
  );
}

/** Interruttore «schermo acceso durante i timer» (solo dove il browser supporta Wake Lock). */
function KeepAwakeToggle() {
  const [keepAwake, setKeepAwake] = useKeepAwake();
  const supported = useSyncExternalStore(noopSubscribe, wakeLockSupported, () => false);
  if (!supported) return null;
  return (
    <label className="flex cursor-pointer items-start gap-2 pt-1 text-xs text-sky-800">
      <input
        type="checkbox"
        checked={keepAwake}
        onChange={(e) => setKeepAwake(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
      />
      <span>
        <Sun size={12} className="mr-1 inline-block align-text-bottom text-orange-500" />
        Tieni lo schermo acceso mentre un timer è in corso, così suona anche se non tocchi il telefono.
      </span>
    </label>
  );
}

function CookingRecipeCard({
  recipe,
  timers,
  onNavigate,
}: {
  recipe: CookingRecipe;
  timers: CookingTimer[];
  onNavigate: () => void;
}) {
  const { recipeId, steps } = recipe;
  const [done, setDone] = useRecipeProgress(recipeId, steps.length);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState(false);
  const scaleFactor = recipe.scale?.factor;

  const current = steps.findIndex((_, i) => !done.has(i));
  const allDone = steps.length > 0 && current === -1;
  const step = current >= 0 ? steps[current] : undefined;
  const lastDone = [...done].filter((i) => i < steps.length).sort((a, b) => b - a)[0];
  // Timer di altri passi ancora vivi (es. lievitazione partita e sei andato avanti)
  const otherTimers = timers.filter((t) => t.stepIndex !== current);
  const hasActiveTimers = timers.some((t) => t.status !== "done");

  const markDone = () => {
    if (current < 0) return;
    setDone(new Set(done).add(current));
  };
  const back = () => {
    if (lastDone === undefined) return;
    const next = new Set(done);
    next.delete(lastDone);
    setDone(next);
  };
  const remove = () => (hasActiveTimers ? setConfirmRemove(true) : removeRecipe(recipeId));
  // «Finito e rimuovi»: admin → registra la cottura (+1); visitatore → toglie e basta
  const finish = async () => {
    setFinishing(true);
    setFinishError(false);
    const ok = await finishRecipe(recipeId, isAdmin);
    setFinishing(false);
    if (!ok) {
      setFinishError(true);
      return;
    }
    setDone(new Set());
    if (isAdmin) router.refresh(); // contatore cotture sulla pagina ricetta, se aperta
  };

  return (
    <article className={cardCls}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-sky-100">
          {recipe.photo ? (
            <Image src={recipe.photo} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sky-500">
              <CookingPot size={18} />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/ricette/${recipeId}`}
            onClick={onNavigate}
            className="block truncate text-sm font-semibold text-sky-950 hover:text-orange-600"
          >
            {recipe.name}
          </Link>
          {scaleFactor && (
            <span
              title="Quantità ricalcolate sul dettaglio ricetta"
              className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700"
            >
              <Scale size={10} /> dosi ×{Math.round(scaleFactor * 100) / 100}
            </span>
          )}
          {steps.length > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sky-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${(done.size / steps.length) * 100}%` }}
                />
              </div>
              <span className="shrink-0 text-[11px] font-medium tabular-nums text-sky-700">
                {allDone ? `${steps.length}/${steps.length}` : `passo ${current + 1} di ${steps.length}`}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={remove}
          aria-label="Togli dalla lista"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/60 bg-white/70 text-rose-500 shadow-sm hover:bg-white"
        >
          <X size={14} />
        </button>
      </div>

      {/* Riquadro passo */}
      {steps.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-sky-200 bg-white/60 px-3 py-2.5 text-sm text-sky-700">
          Nessuna procedura da seguire.
        </p>
      ) : allDone ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-green-300/60 bg-green-50/90 px-3 py-2.5">
          <PartyPopper size={18} className="text-green-600" />
          <p className="flex-1 text-sm font-semibold text-green-900">Ricetta completata</p>
          <button
            type="button"
            onClick={finish}
            disabled={finishing}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <Check size={13} /> {finishing ? "…" : "Finito e rimuovi"}
          </button>
          {finishError && (
            <p className="w-full text-xs text-rose-700">Non sono riuscito a registrare la cottura, riprova.</p>
          )}
        </div>
      ) : (
        step && (
          <div className="mt-3 rounded-xl border border-white/70 bg-white/70 px-3 py-2.5">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {current + 1}
              </span>
              {KIND_BADGE[step.kind] && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${KIND_BADGE[step.kind]}`}>
                  {STEP_KIND_LABEL[step.kind]}
                </span>
              )}
              {step.mins ? (
                <span className="inline-flex items-center gap-1 text-sky-700">
                  <Timer size={12} /> {formatMinutes(step.mins)}
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-relaxed text-sky-900">{step.text}</p>
            {isTimerStep(step) && step.mins && (
              <StepTimer recipeId={recipeId} stepIndex={current} mins={step.mins} className="mt-2" />
            )}
          </div>
        )
      )}

      {/* Timer di altri passi */}
      {otherTimers.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {otherTimers.map((t) => (
            <li key={t.stepIndex} className="flex flex-wrap items-center justify-between gap-2 text-xs text-sky-800">
              <span>Passo {t.stepIndex + 1}</span>
              <StepTimer recipeId={recipeId} stepIndex={t.stepIndex} mins={Math.round(t.durationMs / 60_000)} />
            </li>
          ))}
        </ul>
      )}

      {/* Azioni */}
      {steps.length > 0 && !allDone && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={back}
            disabled={lastDone === undefined}
            className="inline-flex items-center gap-1 rounded-lg border border-white/50 bg-white/70 px-3 py-1.5 text-xs font-medium text-sky-900 backdrop-blur-sm hover:bg-white/90 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Indietro
          </button>
          <button
            type="button"
            onClick={markDone}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
          >
            <Check size={14} /> Fatto
          </button>
        </div>
      )}

      <ConfirmModal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          removeRecipe(recipeId);
        }}
        title="Togliere la ricetta?"
        message={`«${recipe.name}» ha dei timer attivi: togliendola dalla lista verranno annullati.`}
        confirmLabel="Togli"
      />
    </article>
  );
}
