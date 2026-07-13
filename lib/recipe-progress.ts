"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLocalStore } from "@/lib/local-store";

// Avanzamento passi di una ricetta, persistito:
//  - admin loggato  → DB per account via /api/recipes/[id]/progress (sync tra dispositivi)
//  - visitatore     → localStorage sul dispositivo (stesso pattern di preferiti/lista spesa)
// Il progresso è per INDICE di step (gli id sono instabili: il PUT ricetta li ricrea);
// `stepsCount` fa da guardia anti-stale: se la procedura cambia si riparte da zero.

interface StoredProgress {
  doneSteps: number[];
  stepsCount: number;
}

const EMPTY: StoredProgress = { doneSteps: [], stepsCount: 0 };
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

  // ── Admin: stato locale + sync col server ──
  const [serverDone, setServerDone] = useState<Set<number>>(new Set());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingRef = useRef<StoredProgress | null>(null);

  const flush = useCallback((keepalive = false) => {
    const payload = pendingRef.current;
    if (!payload) return;
    pendingRef.current = null;
    clearTimeout(saveTimer.current);
    // Errori silenziosi (es. 401 da auto-logout): il progresso resta comunque in memoria
    fetch(`/api/recipes/${recipeId}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive,
    }).catch(() => {});
  }, [recipeId]);

  // Carica il progresso salvato quando la sessione admin è nota
  useEffect(() => {
    if (loading || !isAdmin) return;
    let cancelled = false;
    fetch(`/api/recipes/${recipeId}/progress`)
      .then((r) => (r.ok ? (r.json() as Promise<StoredProgress>) : EMPTY))
      .then((stored) => {
        if (!cancelled) setServerDone(toSet(stored, stepsCount));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [loading, isAdmin, recipeId, stepsCount]);

  // Flush del salvataggio in sospeso quando si lascia la pagina
  useEffect(() => {
    const onHide = () => flush(true);
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
      flush(true);
    };
  }, [flush]);

  const setDone = useCallback(
    (next: ReadonlySet<number>) => {
      const stored: StoredProgress = { doneSteps: [...next].sort((a, b) => a - b), stepsCount };
      if (isAdmin) {
        setServerDone(new Set(next));
        pendingRef.current = stored;
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => flush(), SAVE_DEBOUNCE_MS);
      } else {
        writeLocal(stored);
      }
    },
    [isAdmin, stepsCount, flush, writeLocal]
  );

  const done = isAdmin ? serverDone : toSet(localStored, stepsCount);
  return [done, setDone];
}
