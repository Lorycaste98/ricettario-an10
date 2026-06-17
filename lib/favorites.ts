"use client";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "ricettario:favorites";
const CHANGE_EVENT = "ricettario:favorites:change";

const EMPTY: ReadonlySet<number> = new Set();
let snapshot: ReadonlySet<number> | null = null;

function read(): ReadonlySet<number> {
  if (typeof window === "undefined") return EMPTY;
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

function getSnapshot(): ReadonlySet<number> {
  if (snapshot === null) snapshot = read();
  return snapshot;
}

function getServerSnapshot(): ReadonlySet<number> {
  return EMPTY;
}

function subscribe(callback: () => void): () => void {
  const handler = () => {
    snapshot = read();
    callback();
  };
  window.addEventListener("storage", handler);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}

function write(ids: ReadonlySet<number>) {
  snapshot = new Set(ids);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((id: number) => {
    const next = new Set(snapshot ?? read());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    write(next);
  }, []);

  const isFavorite = useCallback((id: number) => favorites.has(id), [favorites]);

  // EMPTY is the server/hydration snapshot — once useSyncExternalStore
  // commits the client snapshot, the reference changes (even for an
  // empty localStorage) and we know hydration is done.
  const hydrated = favorites !== EMPTY;

  return { favorites, isFavorite, toggle, hydrated };
}
