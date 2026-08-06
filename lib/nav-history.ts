"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Cronologia di navigazione interna all'app.
 *
 * `document.referrer` non serve: con l'App Router le navigazioni sono soft e il
 * referrer resta quello dell'ultimo caricamento completo. Teniamo quindi una
 * pila nostra (sessionStorage, per-scheda come i filtri delle liste) alimentata
 * dai cambi di `pathname`, con il titolo della pagina lasciata — così il tasto
 * "torna indietro" può dire *dove* torna ("Torna a Cena di Natale") invece di
 * riportare sempre alla lista, che è la cosa che confondeva arrivando su una
 * ricetta dal dettaglio di un menù.
 */

const KEY = "ricettario:nav-history";
const MAX = 12;
/** Titolo dei tab: "<pagina> — Ricettario" */
const TITLE_SUFFIX = /\s*[—–-]\s*Ricettario\s*$/;
/** Etichette esplicite per le rotte "contenitore" (il <title> sarebbe generico) */
const ROUTE_LABEL: Record<string, string> = {
  "/": "Home",
  "/ricette": "Tutte le ricette",
  "/menu": "Tutti i menù",
  "/preferiti": "Preferiti",
  "/admin": "Dashboard",
};

export interface NavEntry {
  path: string;
  title: string;
}

function read(): NavEntry[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as NavEntry[]) : [];
  } catch {
    return [];
  }
}

function write(stack: NavEntry[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-MAX)));
  } catch {
    /* quota/privacy mode: la cronologia è un extra, si può perdere */
  }
}

/** Etichetta leggibile della pagina di provenienza. */
export function entryLabel(entry: NavEntry): string {
  const known = ROUTE_LABEL[entry.path];
  if (known) return known;
  const clean = entry.title.replace(TITLE_SUFFIX, "").trim();
  if (clean) return clean;
  if (entry.path.startsWith("/menu")) return "Menù";
  if (entry.path.startsWith("/ricette")) return "Ricetta";
  if (entry.path.startsWith("/admin")) return "Dashboard";
  return "Indietro";
}

/** Da montare una sola volta (AppShell): registra ogni cambio di pagina. */
export function useNavHistoryTracker() {
  const pathname = usePathname();
  const current = useRef<NavEntry>({ path: pathname, title: "" });
  const popping = useRef(false);

  // Il <title> lo scrive Next dopo il commit: lo si rilegge poco dopo l'arrivo
  useEffect(() => {
    const t = setTimeout(() => {
      current.current.title = document.title;
    }, 300);
    return () => clearTimeout(t);
  }, [pathname]);

  // Un "indietro" del browser non è una nuova destinazione: toglie dalla pila
  useEffect(() => {
    const onPop = () => {
      popping.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const prev = current.current;
    if (prev.path === pathname) return; // primo montaggio
    if (popping.current) {
      popping.current = false;
      write(read().slice(0, -1));
    } else {
      const stack = read();
      const last = stack[stack.length - 1];
      if (!last || last.path !== prev.path) stack.push(prev);
      write(stack);
    }
    current.current = { path: pathname, title: document.title };
  }, [pathname]);
}

/** Pagina da cui si è arrivati, se la conosciamo (null se si è entrati diretti). */
export function usePreviousPage(): NavEntry | null {
  const pathname = usePathname();
  const [entry, setEntry] = useState<NavEntry | null>(null);

  useEffect(() => {
    // Timeout 0: gli effetti dei figli girano prima di quelli del genitore, quindi
    // al montaggio il tracker (in AppShell) non ha ancora impilato la provenienza.
    const t = setTimeout(() => {
      const stack = read();
      const last = stack[stack.length - 1];
      setEntry(last && last.path !== pathname ? last : null);
    }, 0);
    return () => clearTimeout(t);
  }, [pathname]);

  return entry;
}
