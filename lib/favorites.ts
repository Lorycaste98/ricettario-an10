"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/components/AuthProvider";

/**
 * Preferiti con due sorgenti, scelte in base alla sessione:
 *
 * - **admin loggato** → DB per account (`RecipeFavorite`, API `/api/favorites` +
 *   `/api/recipes/[id]/favorite`): la lista segue l'account su ogni dispositivo;
 * - **visitatore anonimo** → `localStorage`, come è sempre stato.
 *
 * Al login i preferiti locali vengono **ignorati** (nessun merge): conta solo la
 * lista dell'account. Il set locale resta però intatto nello storage, quindi al
 * logout ricompaiono i preferiti "del dispositivo".
 *
 * Store module-level condiviso da tutti i consumatori (badge Navbar, cuore sulle
 * card, pagina /preferiti) via `useSyncExternalStore`: un solo fetch e un solo
 * stato, senza provider. Finché `useAuth().loading` è vero la sorgente non è
 * ancora nota e `hydrated` resta `false` — è il gate che evita di disegnare
 * cuori e badge sbagliati per un istante.
 */

const STORAGE_KEY = "ricettario:favorites";

type Mode = "local" | "server";

interface Snapshot {
  ids: ReadonlySet<number>;
  hydrated: boolean;
}

const EMPTY_SET: ReadonlySet<number> = new Set();
/** Snapshot server/pre-idratazione: riferimento stabile, come vuole useSyncExternalStore */
const INITIAL: Snapshot = { ids: EMPTY_SET, hydrated: false };

let mode: Mode | null = null;
let snapshot: Snapshot = INITIAL;
/** Invalida i fetch in volo quando la sorgente cambia (login/logout a metà richiesta) */
let fetchToken = 0;

const listeners = new Set<() => void>();

function publish(ids: ReadonlySet<number>, hydrated: boolean) {
  snapshot = { ids, hydrated };
  for (const l of listeners) l();
}

function readLocal(): ReadonlySet<number> {
  if (typeof window === "undefined") return EMPTY_SET;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is number => typeof x === "number"));
  } catch {
    return new Set();
  }
}

function writeLocal(ids: ReadonlySet<number>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // storage pieno o negato: lo stato in memoria resta comunque aggiornato
  }
}

/** Un'altra scheda ha toccato i preferiti locali */
function onStorage(e: StorageEvent) {
  if (mode !== "local") return;
  if (e.key !== null && e.key !== STORAGE_KEY) return;
  publish(readLocal(), true);
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Snapshot {
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return INITIAL;
}

/** Imposta la sorgente dei preferiti; sul ramo server carica la lista dell'account. */
function setMode(next: Mode) {
  if (mode === next) return;
  mode = next;

  if (next === "local") {
    fetchToken++; // scarta un eventuale caricamento server in volo (logout)
    publish(readLocal(), true);
    return;
  }

  const token = ++fetchToken;
  publish(EMPTY_SET, false);
  fetch("/api/favorites")
    .then((res) => (res.ok ? res.json() : null))
    .then((data: unknown) => {
      if (token !== fetchToken) return;
      const raw = (data as { ids?: unknown } | null)?.ids;
      const ids = Array.isArray(raw) ? raw.filter((x): x is number => typeof x === "number") : [];
      publish(new Set(ids), true);
    })
    .catch(() => {
      if (token === fetchToken) publish(EMPTY_SET, true);
    });
}

function toggleFavorite(id: number) {
  if (mode === null) return; // sorgente non ancora nota: il click non è affidabile

  const wasFavorite = snapshot.ids.has(id);
  const next = new Set(snapshot.ids);
  if (wasFavorite) next.delete(id);
  else next.add(id);

  if (mode === "local") {
    writeLocal(next);
    publish(next, true);
    return;
  }

  // Server: update ottimistico, rollback se la scrittura fallisce
  publish(next, true);
  const token = fetchToken;
  fetch(`/api/recipes/${id}/favorite`, { method: wasFavorite ? "DELETE" : "PUT" })
    .then((res) => {
      if (!res.ok) throw new Error("save failed");
    })
    .catch(() => {
      // Niente rollback se nel frattempo la sorgente è cambiata o l'utente ha
      // già ri-toccato quel cuore (lo stato attuale è di nuovo quello di partenza).
      if (token !== fetchToken || snapshot.ids.has(id) === wasFavorite) return;
      const reverted = new Set(snapshot.ids);
      if (wasFavorite) reverted.add(id);
      else reverted.delete(id);
      publish(reverted, true);
    });
}

/**
 * Rimuove i preferiti "orfani" (ricette non più esistenti): senza pulizia
 * gonfierebbero il badge mentre la pagina preferiti non ha nulla da mostrare.
 * Serve **solo** sul ramo locale — a DB ci pensa la cascade sulla foreign key.
 */
function reconcileFavorites(validIds: ReadonlySet<number>) {
  if (mode !== "local" || snapshot.ids.size === 0) return;
  const next = new Set<number>();
  let changed = false;
  for (const id of snapshot.ids) {
    if (validIds.has(id)) next.add(id);
    else changed = true;
  }
  if (!changed) return;
  writeLocal(next);
  publish(next, true);
}

export function useFavorites() {
  const { isAdmin, loading } = useAuth();

  // La sorgente dipende dalla sessione: finché l'auth è in volo non si sceglie
  // (mode resta null e hydrated false), poi si aggancia DB o localStorage.
  useEffect(() => {
    if (loading) return;
    setMode(isAdmin ? "server" : "local");
  }, [isAdmin, loading]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const favorites = state.ids;

  const toggle = useCallback((id: number) => toggleFavorite(id), []);
  const isFavorite = useCallback((id: number) => favorites.has(id), [favorites]);
  const reconcile = useCallback((validIds: ReadonlySet<number>) => reconcileFavorites(validIds), []);

  return { favorites, isFavorite, toggle, reconcile, hydrated: state.hydrated };
}
