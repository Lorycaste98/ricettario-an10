"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLocalStore } from "@/lib/local-store";

// Avanzamento passi di una ricetta, persistito:
//  - admin loggato  → DB per account via /api/recipes/[id]/progress (sync tra dispositivi)
//  - visitatore     → localStorage sul dispositivo (stesso pattern di preferiti/lista spesa)
// Il progresso è per INDICE di step (gli id sono instabili: il PUT ricetta li ricrea);
// `stepsCount` fa da guardia anti-stale: se la procedura cambia si riparte da zero.
//
// Lo stato admin è uno store **module-level** per recipeId (useSyncExternalStore):
// più istanze dell'hook sulla stessa ricetta — la pagina di dettaglio e il pannello
// «Sto cucinando» (lib/cooking-session.ts) — vedono e scrivono lo stesso Set, live.

interface StoredProgress {
  doneSteps: number[];
  stepsCount: number;
}

const EMPTY: StoredProgress = { doneSteps: [], stepsCount: 0 };
const EMPTY_SET: ReadonlySet<number> = new Set();
const SAVE_DEBOUNCE_MS = 800;

function parseStored(raw: string): StoredProgress {
  try {
    const p = JSON.parse(raw) as Partial<StoredProgress>;
    if (!Array.isArray(p.doneSteps) || typeof p.stepsCount !== "number") return EMPTY;
    return { doneSteps: p.doneSteps.filter((n) => Number.isInteger(n) && n >= 0), stepsCount: p.stepsCount };
  } catch {
    return EMPTY;
  }
}

/** Applica la guardia anti-stale e converte in Set di indici validi. */
function toSet(stored: StoredProgress, stepsCount: number): Set<number> {
  if (stored.stepsCount !== stepsCount) return new Set();
  return new Set(stored.doneSteps.filter((i) => i < stepsCount));
}

// ── Store admin condiviso (per recipeId) ────────────────────────────────────

const serverDone = new Map<number, ReadonlySet<number>>();
const pending = new Map<number, StoredProgress>();
const saveTimers = new Map<number, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();

function publishServer(recipeId: number, done: ReadonlySet<number>) {
  serverDone.set(recipeId, done);
  for (const l of listeners) l();
}

function subscribeServer(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function flush(recipeId: number, keepalive = false) {
  const payload = pending.get(recipeId);
  if (!payload) return;
  pending.delete(recipeId);
  clearTimeout(saveTimers.get(recipeId));
  saveTimers.delete(recipeId);
  // Errori silenziosi (es. 401 da auto-logout): il progresso resta comunque in memoria
  fetch(`/api/recipes/${recipeId}/progress`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive,
  }).catch(() => {});
}

export function useRecipeProgress(
  recipeId: number,
  stepsCount: number
): [done: ReadonlySet<number>, setDone: (next: ReadonlySet<number>) => void] {
  const { isAdmin, loading } = useAuth();

  // Hook chiamati incondizionatamente (regola dei hook): entrambe le sorgenti
  // esistono sempre, si sceglie quale coppia esporre in base a isAdmin.

  // ── Visitatore: localStorage ──
  const [localStored, writeLocal] = useLocalStore<StoredProgress>(
    `ricettario:recipe-progress:${recipeId}`,
    EMPTY,
    parseStored
  );

  // ── Admin: store condiviso + sync col server ──
  const adminDone = useSyncExternalStore(
    subscribeServer,
    () => serverDone.get(recipeId) ?? EMPTY_SET,
    () => EMPTY_SET
  );

  // Carica il progresso salvato quando la sessione admin è nota.
  // Se c'è un salvataggio in sospeso lo stato in memoria è più nuovo del server: non sovrascrivere.
  useEffect(() => {
    if (loading || !isAdmin) return;
    let cancelled = false;
    fetch(`/api/recipes/${recipeId}/progress`)
      .then((r) => (r.ok ? (r.json() as Promise<StoredProgress>) : EMPTY))
      .then((stored) => {
        if (!cancelled && !pending.has(recipeId)) publishServer(recipeId, toSet(stored, stepsCount));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [loading, isAdmin, recipeId, stepsCount]);

  // Flush del salvataggio in sospeso quando si lascia la pagina
  useEffect(() => {
    const onHide = () => flush(recipeId, true);
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
      flush(recipeId, true);
    };
  }, [recipeId]);

  const setDone = useCallback(
    (next: ReadonlySet<number>) => {
      const stored: StoredProgress = { doneSteps: [...next].sort((a, b) => a - b), stepsCount };
      if (isAdmin) {
        publishServer(recipeId, new Set(next));
        pending.set(recipeId, stored);
        clearTimeout(saveTimers.get(recipeId));
        saveTimers.set(recipeId, setTimeout(() => flush(recipeId), SAVE_DEBOUNCE_MS));
      } else {
        writeLocal(stored);
      }
    },
    [isAdmin, recipeId, stepsCount, writeLocal]
  );

  const done = isAdmin ? adminDone : toSet(localStored, stepsCount);
  return [done, setDone];
}
