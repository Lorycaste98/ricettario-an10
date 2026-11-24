"use client";
import { useSyncExternalStore } from "react";

// Stato persistito in localStorage sincronizzato con useSyncExternalStore.
// Stesso pattern di lib/favorites.ts (niente setState in un effect — vietato
// dalla regola eslint react-hooks/set-state-in-effect), ma parametrizzato per
// chiave/tipo così lo riusano sia la lista della spesa che la modalità cucina.

const registry = new Map<string, unknown>();

function changeEvent(key: string) {
  return `ricettario:local-store:${key}`;
}

// "local" = persistente (default); "session" = per-scheda, azzerato alla chiusura
export type StoreBackend = "local" | "session";

function storageFor(backend: StoreBackend): Storage | null {
  if (typeof window === "undefined") return null;
  return backend === "session" ? window.sessionStorage : window.localStorage;
}

function readFromStorage<T>(
  key: string,
  fallback: T,
  parse: (raw: string) => T,
  backend: StoreBackend
): T {
  const storage = storageFor(backend);
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return parse(raw);
  } catch {
    return fallback;
  }
}

export function useLocalStore<T>(
  key: string,
  fallback: T,
  parse: (raw: string) => T,
  serialize: (value: T) => string = (v) => JSON.stringify(v),
  backend: StoreBackend = "local"
) {
  const getSnapshot = (): T => {
    if (!registry.has(key)) registry.set(key, readFromStorage(key, fallback, parse, backend));
    return registry.get(key) as T;
  };
  const getServerSnapshot = (): T => fallback;
  const subscribe = (callback: () => void) => {
    const handler = () => {
      registry.set(key, readFromStorage(key, fallback, parse, backend));
      callback();
    };
    // "storage" scatta solo per localStorage cross-scheda; per sessionStorage
    // basta l'evento custom (la scheda è isolata comunque).
    window.addEventListener("storage", handler);
    window.addEventListener(changeEvent(key), handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(changeEvent(key), handler);
    };
  };

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const write = (next: T) => {
    registry.set(key, next);
    storageFor(backend)?.setItem(key, serialize(next));
    window.dispatchEvent(new Event(changeEvent(key)));
  };

  return [value, write] as const;
}

/**
 * Cancella una chiave e avvisa chi la sta usando, che torna al suo valore di partenza
 * (pagina Impostazioni: «Ripristina», «Cancella le ricerche recenti»).
 */
export function clearLocalStore(key: string, backend: StoreBackend = "local") {
  registry.delete(key);
  try {
    storageFor(backend)?.removeItem(key);
  } catch {
    // storage non disponibile (navigazione privata): resta solo il valore in memoria
  }
  window.dispatchEvent(new Event(changeEvent(key)));
}

/** Nome dell'evento che avvisa i `useLocalStore` di una chiave (per chi deve accorgersi delle modifiche). */
export function localStoreEvent(key: string) {
  return changeEvent(key);
}

/** Scrive il valore grezzo (già serializzato; `null` = cancella) e avvisa chi usa la chiave. */
export function setLocalStoreRaw(key: string, raw: string | null, backend: StoreBackend = "local") {
  registry.delete(key);
  try {
    const storage = storageFor(backend);
    if (raw === null) storage?.removeItem(key);
    else storage?.setItem(key, raw);
  } catch {
    // storage non disponibile: resta solo l'avviso
  }
  window.dispatchEvent(new Event(changeEvent(key)));
}
