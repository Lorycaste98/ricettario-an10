"use client";
import { useCallback, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, PartyPopper, Scale, X } from "lucide-react";
import {
  finishRecipe,
  isTimerStep,
  removeRecipe,
  requestNotificationPermission,
  useCookingScheduler,
  useCookingSession,
  useKeepAwake,
  useOpenCookingDockListener,
  wakeLockSupported,
  type CookingRecipe,
  type CookingTimer,
} from "@/lib/cooking-session";
import { useRecipeProgress } from "@/lib/recipe-progress";
import { useAuth } from "@/components/AuthProvider";
import { formatMinutes, toStepKind } from "@/lib/types";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { StepTimer } from "@/components/cooking/StepTimer";
import { CurrentStep } from "@/components/cooking/CurrentStep";
import { An10Logo } from "@/components/brand/An10Logo";
import { Button, IconButton } from "@/components/ds/Button";
import { Switch } from "@/components/ds/Controls";
import { StepNumber, StepProgress } from "@/components/ds/Progress";
import { StepKindTag, Tag } from "@/components/ds/Tag";
import { TimerAlert } from "@/components/ds/Feedback";

/**
 * «Sto cucinando»: pannello (dialog) con una card per ricetta in corso, montato una volta in
 * app/layout.tsx. Si apre dalla fila / mini-barra della cornice (`components/shell/CookingBar.tsx`)
 * e dal bottone pentola delle card, tutti via `openCookingDock()`. Monta anche lo scheduler dei timer
 * (`useCookingScheduler`): scadenze, suono e notifiche passano tutti da qui.
 */

// Card ricetta del pannello (restyle fase 4): stessa scheda bianca della modalità cucina
const cardCls = "flex min-w-0 flex-col gap-3 rounded-card border border-blu-150 bg-white p-[0.875em]";

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

  if (!session.hydrated || session.recipes.length === 0) return null;

  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)} title={`Sto cucinando · ${count}`} size="md" bodyClassName="flex flex-col gap-3 bg-blu-50">
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

/** Timer scaduti in cima al pannello: 10.5, giallo pieno (si vede da lontano) */
function FinishedTimers({ timers }: { timers: CookingTimer[] }) {
  if (timers.length === 0) return null;
  return (
    <section aria-label="Timer finiti" className="flex flex-col gap-2">
      {timers.map((t) => (
        <TimerAlert
          key={`${t.recipeId}-${t.stepIndex}`}
          title="Timer finito"
          detail={t.label}
          action={<StepTimer recipeId={t.recipeId} stepIndex={t.stepIndex} mins={Math.round(t.durationMs / 60_000)} />}
        />
      ))}
    </section>
  );
}

function NotificationHint() {
  const [perm, ask] = useNotificationPermission();
  if (perm !== "default") return null;
  return (
    <div className="flex flex-col items-start gap-2 rounded-ctl bg-blu-100 px-3 py-2.5 text-[0.8125rem] text-grigio">
      <p>
        Le notifiche avvisano quando un timer finisce mentre usi un&apos;altra scheda o finestra. A telefono bloccato non
        arrivano: per questo, mentre un timer corre, lo schermo resta acceso.
      </p>
      <Button size="sm" variant="secondary" onClick={ask}>
        Attiva le notifiche
      </Button>
    </div>
  );
}

/** Interruttore «schermo acceso durante i timer» (4.13: impostazione del dispositivo), solo dove c'è Wake Lock. */
function KeepAwakeToggle() {
  const [keepAwake, setKeepAwake] = useKeepAwake();
  const supported = useSyncExternalStore(noopSubscribe, wakeLockSupported, () => false);
  if (!supported) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-blu-150 pt-3">
      <p className="text-[0.8125rem] text-grigio">Schermo acceso mentre un timer è in corso, così suona anche se non tocchi il telefono.</p>
      <Switch checked={keepAwake} onChange={setKeepAwake} label="Schermo acceso" hideLabel />
    </div>
  );
}

const NEXT_PREVIEW = 2;

/**
 * «Poi»: i prossimi passi in una riga ciascuno (testo troncato). Il tap su una riga
 * mostra il testo completo sotto, senza aprire altri dialog. Nessun «Fatto» qui:
 * non deve sembrare un passo da spuntare.
 */
function NextSteps({ steps, from }: { steps: CookingRecipe["steps"]; from: number }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const next = steps.slice(from, from + NEXT_PREVIEW);
  if (next.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-bold tracking-[0.08em] text-grigio uppercase">Poi</p>
      <ul className="flex flex-col">
        {next.map((s, i) => {
          const idx = from + i;
          const open = expanded === idx;
          const kind = toStepKind(s.kind);
          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => setExpanded(open ? null : idx)}
                aria-expanded={open}
                className="flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-ctl px-1 py-1 text-left text-[0.875rem] hover:bg-blu-100"
              >
                <StepNumber n={idx + 1} state="todo" />
                <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <span className={open ? "whitespace-pre-line" : "w-full truncate"}>{s.text}</span>
                  {(kind !== "PREP" || s.mins) && <StepKindTag kind={kind} duration={s.mins ? formatMinutes(s.mins) : undefined} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
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
      <div className="flex items-center gap-3">
        <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-ctl bg-blu-100 text-blu-600">
          {recipe.photo ? (
            <Image src={recipe.photo} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            <An10Logo variant="simbolo" title="" className="w-1/2" />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Link href={`/ricette/${recipeId}`} onClick={onNavigate} className="truncate font-bold hover:text-blu-700">
            {recipe.name}
          </Link>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-(length:--fs-meta) text-grigio">
            {steps.length > 0 && (
              <span className="tabular">{allDone ? "Tutti i passi fatti" : `Passo ${current + 1} di ${steps.length}`}</span>
            )}
            {scaleFactor && (
              <Tag tone="scale" icon={<Scale />} title="Quantità ricalcolate sul dettaglio ricetta">
                dosi ×{Math.round(scaleFactor * 100) / 100}
              </Tag>
            )}
          </span>
        </div>
        <IconButton size="row" tone="danger" label="Togli dalla lista" onClick={remove}>
          <X />
        </IconButton>
      </div>

      {steps.length > 0 && <StepProgress total={steps.length} done={done.size} current={current >= 0 ? current : undefined} />}

      {steps.length === 0 ? (
        <p className="rounded-card border border-dashed border-blu-200 bg-blu-50 px-3 py-2.5 text-[0.875rem] text-grigio">
          Nessuna procedura da seguire.
        </p>
      ) : allDone ? (
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-verde-200 bg-verde-50 p-[0.875em]">
          <PartyPopper className="size-6 shrink-0 text-verde" aria-hidden />
          <p className="min-w-0 flex-1 font-bold">Ricetta completata</p>
          <Button icon={<Check />} onClick={() => void finish()} loading={finishing}>
            Finito e rimuovi
          </Button>
          {finishError && <p className="w-full text-xs text-rosa">Non sono riuscito a registrare la cottura, riprova.</p>}
        </div>
      ) : (
        step && (
          <CurrentStep
            size="sm"
            n={current + 1}
            kind={toStepKind(step.kind)}
            mins={step.mins}
            text={step.text}
            actions={
              <>
                {isTimerStep(step) && step.mins && <StepTimer recipeId={recipeId} stepIndex={current} mins={step.mins} />}
                <span className="ml-auto flex gap-2">
                  <Button variant="secondary" icon={<ChevronLeft />} onClick={back} disabled={lastDone === undefined} aria-label="Indietro di un passo">
                    <span className="hidden min-[420px]:inline">Indietro</span>
                  </Button>
                  <Button icon={<Check />} onClick={markDone}>
                    Fatto
                  </Button>
                </span>
              </>
            }
          />
        )
      )}

      {/* Anteprima dei prossimi passi: solo lettura, si avanza sempre dal passo corrente */}
      {step && <NextSteps steps={steps} from={current + 1} />}

      {/* Timer di altri passi ancora vivi */}
      {otherTimers.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {otherTimers.map((t) => (
            <li key={t.stepIndex} className="flex flex-wrap items-center justify-between gap-2 text-[0.875rem]">
              <span className="text-grigio">Passo {t.stepIndex + 1}</span>
              <StepTimer recipeId={recipeId} stepIndex={t.stepIndex} mins={Math.round(t.durationMs / 60_000)} />
            </li>
          ))}
        </ul>
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
