"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, History, ListOrdered, Search, Users } from "lucide-react";
import { useLocalStore } from "@/lib/local-store";
import { SEARCH_RECENT_KEY } from "@/lib/preferences";
import { formatQty } from "@/lib/step-ingredients";
import { useAuth } from "@/components/AuthProvider";
import { An10Logo } from "@/components/brand/An10Logo";
import { ClocheIcon, GroceryBagIcon } from "@/components/icons";
import { SearchField } from "@/components/ds/Field";
import { Chip } from "@/components/ds/Controls";
import { GuestRatingTag, HiddenTag } from "@/components/ds/Tag";
import { EmptyState, Banner } from "@/components/ds/Feedback";
import { Skeleton } from "@/components/ds/Progress";
import { Button } from "@/components/ds/Button";
import { BrandHeader } from "@/components/AppShell";
import {
  CLOSE_SEARCH_EVENT,
  OPEN_SEARCH_EVENT,
  ingredientStats,
  normalizeSearchText,
  prepareIndex,
  runSearch,
  setSearchOpenState,
  topIngredients,
  type PreparedIndex,
} from "@/lib/search";
import { formatMinutes, formatServings, type SearchIndex, type SearchIndexMenu } from "@/lib/types";

/**
 * Ricerca globale (fase 3B del restyle): overlay sopra la pagina, che resta visibile e ferma sotto
 * il velo. Cerca ricette, menù e ingredienti nell'indice scaricato una volta (`/api/search/index`,
 * vedi `lib/search.ts`). Toccando un risultato si apre l'anteprima: ricette e menù con la loro
 * scheda ridotta e «Apri», gli ingredienti con le statistiche. Da 760px lista e anteprima sono
 * affiancate e la prima voce è già in anteprima; sotto, l'anteprima prende il posto della lista.
 *
 * Montato una volta in `app/layout.tsx`; si apre con `openSearch()`, ⌘K / Ctrl+K o «/».
 */

type Sel = { kind: "recipe"; id: number } | { kind: "menu"; id: number } | { kind: "ingredient"; key: string };
type Group = "recipes" | "menus" | "ingredients";
type Scope = "all" | Group;
const GROUPS: Group[] = ["recipes", "menus", "ingredients"];

const STALE_MS = 5 * 60 * 1000;
let cache: { admin: boolean; at: number; idx: PreparedIndex } | null = null;

/** Ricerche recenti di questo dispositivo (fase 8): le ultime 6, la più nuova in testa */
const RECENT_KEY = SEARCH_RECENT_KEY;
const RECENT_MAX = 6;
function parseRecent(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 760px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 760px)").matches,
    () => true
  );
}

const sameSel = (a: Sel | null, b: Sel | null) =>
  !!a && !!b && a.kind === b.kind && (a.kind === "ingredient" ? a.key === (b as typeof a).key : a.id === (b as { id: number }).id);

export function SearchOverlay() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [idx, setIdx] = useState<PreparedIndex | null>(cache?.idx ?? null);
  const [error, setError] = useState(false);
  const [stack, setStack] = useState<Sel[]>([]);
  const [recent, setRecent] = useLocalStore<string[]>(RECENT_KEY, [], parseRecent);
  const wide = useWide();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Apertura: evento globale + scorciatoie da tastiera
  useEffect(() => {
    const onOpen = (e: Event) => {
      const q = (e as CustomEvent<string>).detail ?? "";
      if (q) setQuery(q);
      setStack([]);
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Indice: scaricato alla prima apertura, riscaricato se è cambiata la sessione o è vecchio
  const load = useCallback(() => {
    const admin = isAdmin;
    fetch("/api/search/index", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<SearchIndex>) : Promise.reject(new Error(String(r.status)))))
      .then((raw) => {
        cache = { admin, at: Date.now(), idx: prepareIndex(raw) };
        setIdx(cache.idx);
      })
      .catch(() => setError(true));
  }, [isAdmin]);

  useEffect(() => {
    if (!open || authLoading) return;
    if (cache && cache.admin === isAdmin && Date.now() - cache.at < STALE_MS) return;
    load();
  }, [open, authLoading, isAdmin, load]);

  // La navigazione accende «Cerca» finché l'overlay è aperto
  useEffect(() => {
    setSearchOpenState(open);
  }, [open]);

  const close = useCallback(() => {
    dialogRef.current?.close();
    setOpen(false);
  }, []);

  // Dialog **non modale** sotto la navigazione (z 35, la barra sta a 40): la pagina resta visibile
  // dietro il vetro e la barra resta usabile (la lente chiude, le altre voci portano altrove).
  // Quello che il modale dava da solo lo facciamo a mano: Esc, pagina ferma e inerte, focus restituito.
  useEffect(() => {
    const el = dialogRef.current;
    if (!open || !el) return;
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!el.open) el.show();
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const main = document.querySelector("main");
    main?.setAttribute("inert", "");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    // una voce della navigazione porta altrove: la ricerca si chiude (anche se è la pagina in cui sei)
    const onNav = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest('nav[aria-label="Navigazione principale"] a')) close();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onNav, true);
    return () => {
      html.style.overflow = prev;
      main?.removeAttribute("inert");
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onNav, true);
      if (before?.isConnected) before.focus({ preventScroll: true });
    };
  }, [open, close]);

  useEffect(() => {
    window.addEventListener(CLOSE_SEARCH_EVENT, close);
    return () => window.removeEventListener(CLOSE_SEARCH_EVENT, close);
  }, [close]);

  const usable = idx && (cache?.admin === isAdmin || !cache) ? idx : null;
  const results = useMemo(() => (usable ? runSearch(usable, query) : null), [usable, query]);

  // Gruppi in ordine di pertinenza: cercando «farina» vengono prima gli ingredienti
  const order: Group[] = useMemo(() => {
    if (!results) return GROUPS;
    const top = (g: Group) => results[g][0]?.score ?? -Infinity;
    return [...GROUPS].sort((a, b) => top(b) - top(a));
  }, [results]);

  const flat: Sel[] = useMemo(() => {
    if (!results) return [];
    const r: Sel[] = [];
    for (const g of order) {
      if (scope !== "all" && scope !== g) continue;
      if (g === "recipes") r.push(...results.recipes.map((h) => ({ kind: "recipe" as const, id: h.item.id })));
      if (g === "menus") r.push(...results.menus.map((h) => ({ kind: "menu" as const, id: h.item.id })));
      if (g === "ingredients") r.push(...results.ingredients.map((h) => ({ kind: "ingredient" as const, key: h.item.key })));
    }
    return r;
  }, [results, scope, order]);

  // In largo la prima voce è già in anteprima; in stretto l'anteprima si apre solo toccando
  const current: Sel | null = stack.at(-1) ?? (wide ? flat[0] ?? null : null);
  const highlighted = stack[0] ?? (wide ? flat[0] ?? null : null);

  // Una ricerca entra fra le recenti quando se ne apre un risultato (non a ogni lettera)
  const remember = () => {
    const q = query.trim();
    if (q.length < 2) return;
    setRecent([q, ...recent.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, RECENT_MAX));
  };
  const select = (s: Sel) => {
    remember();
    setStack([s]);
  };
  const push = (s: Sel) => setStack((st) => [...(st.length ? st : current ? [current] : []), s]);
  const back = () => setStack((st) => st.slice(0, -1));

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter") return;
    if (flat.length === 0) return;
    e.preventDefault();
    const i = flat.findIndex((s) => sameSel(s, highlighted));
    if (e.key === "Enter") {
      const target = current ?? flat[0];
      if (target.kind === "ingredient") select(target);
      else {
        const a = document.getElementById("search-open-link");
        if (a) a.click();
        else select(target);
      }
      return;
    }
    const next = e.key === "ArrowDown" ? Math.min(flat.length - 1, i + 1) : Math.max(0, i - 1);
    select(flat[next]);
    document.getElementById(`search-row-${next}`)?.scrollIntoView({ block: "nearest" });
  };

  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  if (!open || !mounted) return null;

  const counts = results
    ? { recipes: results.recipes.length, menus: results.menus.length, ingredients: results.ingredients.length }
    : null;
  const hasQuery = query.trim().length > 0;
  const showPreviewOnly = !wide && stack.length > 0;

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={() => setOpen(false)}
      onClick={(e) => {
        // tocco sul vetro (fuori dalle schede) = chiudi
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.searchGlass !== undefined) close();
      }}
      aria-label="Cerca nel ricettario"
      className="search-glass ds fixed inset-0 z-[35] m-0 size-full max-h-none max-w-none p-0 text-blu-950"
    >
      {/* Vetro a pagina intera (`.search-glass` in globals.css): la pagina sotto si intravede solo
          sfocata, e mai sotto le scritte — campo e risultati stanno su schede piene. Il contenuto
          lascia libere la barra in basso con la collinetta della lente (< 700px) e la barra laterale. */}
      <div
        data-search-glass
        className="mx-auto flex h-full w-full max-w-[64rem] flex-col gap-2 px-3 pt-[max(2rem,calc(env(safe-area-inset-top,0px)+1rem))] pb-[calc(3.75rem+env(safe-area-inset-bottom,0px)+1.75rem)] min-[700px]:pr-6 min-[700px]:pb-6 min-[700px]:pl-[calc(clamp(4.5rem,calc(4.5rem+12*var(--f)),5.25rem)+env(safe-area-inset-left,0px)+1.5rem)]"
      >
      {/* stesso logo, nello stesso punto, della testata delle pagine (9.7): aprendo la ricerca resta fermo */}
      <BrandHeader className="mb-2 shrink-0 text-blu-800" />
      {/* Testata: campo + chiudi + ambiti */}
      <div className="flex shrink-0 flex-col gap-2.5 rounded-dlg border border-blu-150 bg-white px-3 pt-3 pb-2.5 shadow-[0_10px_30px_oklch(25%_0.038_228/.14)]">
        <div className="flex items-center gap-2">
          <SearchField
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setStack([]);
            }}
            onKeyDown={onInputKey}
            placeholder="Ricette, menù, ingredienti…"
            aria-label="Cerca"
            enterKeyHint="search"
            className="flex-1 text-[1.0625rem]"
          />
          <Button variant="ghost" onClick={close}>
            Chiudi
          </Button>
        </div>
        {hasQuery && counts && (
          <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none]">
            <Chip active={scope === "all"} onClick={() => { setScope("all"); setStack([]); }}>
              Tutto
            </Chip>
            {(counts.recipes > 0 || scope === "recipes") && (
              <Chip active={scope === "recipes"} onClick={() => { setScope("recipes"); setStack([]); }}>
                Ricette <span className="tabular opacity-70">{counts.recipes}</span>
              </Chip>
            )}
            {(counts.menus > 0 || scope === "menus") && (
              <Chip active={scope === "menus"} onClick={() => { setScope("menus"); setStack([]); }}>
                Menù <span className="tabular opacity-70">{counts.menus}</span>
              </Chip>
            )}
            {(counts.ingredients > 0 || scope === "ingredients") && (
              <Chip active={scope === "ingredients"} onClick={() => { setScope("ingredients"); setStack([]); }}>
                Ingredienti <span className="tabular opacity-70">{counts.ingredients}</span>
              </Chip>
            )}
          </div>
        )}
      </div>

      {/* Risultati: scheda piena alta quanto il contenuto (sotto resta il vetro), al massimo fino in fondo */}
      <div
        className={clsx(
          "grid min-h-0 shrink grid-rows-[minmax(0,1fr)] overflow-hidden rounded-dlg border border-blu-150 bg-blu-50 shadow-[0_10px_30px_oklch(25%_0.038_228/.14)] min-[760px]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]",
          // in largo lista e anteprima affiancate: la scheda occupa tutta l'altezza
          wide && "flex-1"
        )}
      >
        {/* Lista */}
        <div className={clsx("min-h-0 overflow-y-auto overscroll-contain p-2", showPreviewOnly && "hidden", wide && "border-r border-blu-150")}>
          {error ? (
            <Banner action={<Button size="sm" variant="secondary" onClick={() => { setError(false); load(); }}>Riprova</Button>}>
              Non riesco a caricare la ricerca.
            </Banner>
          ) : !usable ? (
            <div className="flex flex-col gap-2 p-1" aria-busy>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-11 shrink-0" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : !hasQuery ? (
            <StartState
              idx={usable}
              recent={recent}
              onRecent={(q) => {
                setQuery(q);
                setStack([]);
                inputRef.current?.focus();
              }}
              onClearRecent={() => setRecent([])}
              onPick={(s) => select(s)}
            />
          ) : flat.length === 0 ? (
            <EmptyState icon={<Search />} title="Nessun risultato" className="m-1">
              Prova con un&apos;altra parola o con il nome di un ingrediente.
            </EmptyState>
          ) : (
            <ResultList
              idx={usable}
              results={results!}
              scope={scope}
              order={order}
              flat={flat}
              highlighted={highlighted}
              onSelect={select}
            />
          )}
        </div>

        {/* Anteprima */}
        {(wide || showPreviewOnly) && (
          <div className="min-h-0 overflow-y-auto overscroll-contain bg-white">
            {usable && current ? (
              <Preview
                idx={usable}
                sel={current}
                canBack={stack.length > 1 || (!wide && stack.length > 0)}
                backLabel={stack.length > 1 ? "Indietro" : "Risultati"}
                onBack={back}
                onPush={push}
                onNavigate={() => {
                  remember();
                  close();
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center text-[0.875rem] text-grigio">
                {usable ? "Scegli un risultato per vederne l'anteprima." : null}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </dialog>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Stato iniziale e lista risultati
// ---------------------------------------------------------------------------
function StartState({
  idx,
  recent,
  onRecent,
  onClearRecent,
  onPick,
}: {
  idx: PreparedIndex;
  recent: string[];
  onRecent: (q: string) => void;
  onClearRecent: () => void;
  onPick: (s: Sel) => void;
}) {
  const top = topIngredients(idx, 12);
  return (
    <div className="flex flex-col gap-4 p-2">
      {recent.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-(length:--fs-meta) font-bold tracking-wide text-grigio uppercase">Ricerche recenti</h3>
            <Button variant="ghost" size="sm" onClick={onClearRecent}>
              Cancella
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((q) => (
              <Chip key={q} icon={<History />} onClick={() => onRecent(q)}>
                {q}
              </Chip>
            ))}
          </div>
        </div>
      )}
      <p className="text-[0.875rem] text-grigio">
        Cerca fra <b className="text-blu-950">{idx.raw.recipes.length}</b> ricette, <b className="text-blu-950">{idx.raw.menus.length}</b> menù e{" "}
        <b className="text-blu-950">{idx.ingredients.length}</b> ingredienti.
      </p>
      {top.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-(length:--fs-meta) font-bold tracking-wide text-grigio uppercase">Ingredienti più usati</h3>
          <div className="flex flex-wrap gap-1.5">
            {top.map((i) => (
              <Chip key={i.key} onClick={() => onPick({ kind: "ingredient", key: i.key })}>
                {i.name} <span className="tabular opacity-60">{i.recipeIds.length}</span>
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultList({
  idx,
  results,
  scope,
  order,
  flat,
  highlighted,
  onSelect,
}: {
  idx: PreparedIndex;
  results: NonNullable<ReturnType<typeof runSearch>>;
  scope: Scope;
  order: Group[];
  flat: Sel[];
  highlighted: Sel | null;
  onSelect: (s: Sel) => void;
}) {
  const rowIndex = (s: Sel) => flat.findIndex((f) => sameSel(f, s));
  const group = (g: Group, title: string, children: ReactNode, n: number) =>
    n > 0 && (
      <section className="flex flex-col gap-0.5" style={{ order: order.indexOf(g) }}>
        {scope === "all" && <h3 className="px-2 pt-2 pb-1 text-(length:--fs-meta) font-bold tracking-wide text-grigio uppercase">{title}</h3>}
        {children}
      </section>
    );

  return (
    <div className="flex flex-col gap-1" role="listbox" aria-label="Risultati">
      {(scope === "all" || scope === "recipes") &&
        group(
          "recipes",
          "Ricette",
          results.recipes.map((h) => {
            const s: Sel = { kind: "recipe", id: h.item.id };
            const i = rowIndex(s);
            return (
              <Row key={`r${h.item.id}`} id={`search-row-${i}`} active={sameSel(s, highlighted)} onClick={() => onSelect(s)} thumb={<Thumb photo={h.item.photo} />}>
                <RowTitle hidden={!h.item.published}>{h.item.name}</RowTitle>
                <RowMeta>
                  {h.item.categories[0] && <span className="size-2 shrink-0 rounded-full" style={{ background: h.item.categories[0].color }} />}
                  {h.via ? (
                    <span className="truncate">con {h.via}</span>
                  ) : h.snippet ? (
                    <span className="truncate" title={h.snippet}>«{h.snippet}»</span>
                  ) : (
                    h.item.time > 0 && <span className="tabular">{formatMinutes(h.item.time)}</span>
                  )}
                </RowMeta>
              </Row>
            );
          }),
          results.recipes.length
        )}
      {(scope === "all" || scope === "menus") &&
        group(
          "menus",
          "Menù",
          results.menus.map((h) => {
            const s: Sel = { kind: "menu", id: h.item.id };
            const i = rowIndex(s);
            return (
              <Row key={`m${h.item.id}`} id={`search-row-${i}`} active={sameSel(s, highlighted)} onClick={() => onSelect(s)} thumb={<Thumb photo={h.item.photo} icon={<ClocheIcon />} />}>
                <RowTitle hidden={!h.item.published}>{h.item.name}</RowTitle>
                <RowMeta>
                  {h.via ? <span className="truncate">con {h.via}</span> : <span>{menuWhen(h.item) ?? `${h.item.recipeIds.length + h.item.quickRecipes.length} ricette`}</span>}
                </RowMeta>
              </Row>
            );
          }),
          results.menus.length
        )}
      {(scope === "all" || scope === "ingredients") &&
        group(
          "ingredients",
          "Ingredienti",
          results.ingredients.map((h) => {
            const s: Sel = { kind: "ingredient", key: h.item.key };
            const i = rowIndex(s);
            const n = h.item.recipeIds.length;
            return (
              <Row
                key={`i${h.item.key}`}
                id={`search-row-${i}`}
                active={sameSel(s, highlighted)}
                onClick={() => onSelect(s)}
                thumb={
                  <span className="flex size-11 items-center justify-center rounded-ctl bg-giallo-100 text-giallo-ink [&>svg]:size-5">
                    <GroceryBagIcon />
                  </span>
                }
              >
                <RowTitle>{h.item.name}</RowTitle>
                <RowMeta>
                  <span className="tabular">
                    in {n} {n === 1 ? "ricetta" : "ricette"} · {Math.round((n / Math.max(1, idx.raw.recipes.length)) * 100)}%
                  </span>
                </RowMeta>
              </Row>
            );
          }),
          results.ingredients.length
        )}
    </div>
  );
}

function Row({ id, active, onClick, thumb, children }: { id: string; active: boolean; onClick: () => void; thumb: ReactNode; children: ReactNode }) {
  return (
    <button
      id={id}
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-3 rounded-ctl px-2 py-1.5 text-left transition-colors",
        active ? "bg-blu-120" : "hover:bg-blu-100"
      )}
    >
      {thumb}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</span>
      <ChevronRight className="size-4 shrink-0 text-blu-250 min-[760px]:hidden" aria-hidden />
    </button>
  );
}

function RowTitle({ children, hidden = false }: { children: ReactNode; hidden?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className={clsx("truncate font-semibold", hidden && "text-grigio")}>{children}</span>
      {hidden && <HiddenTag iconOnly />}
    </span>
  );
}

function RowMeta({ children }: { children: ReactNode }) {
  return <span className="flex min-w-0 items-center gap-1.5 text-(length:--fs-meta) text-grigio">{children}</span>;
}

function Thumb({ photo, icon, className = "size-11" }: { photo: string | null; icon?: ReactNode; className?: string }) {
  return (
    <span className={clsx("relative flex shrink-0 items-center justify-center overflow-hidden rounded-ctl bg-blu-100 text-blu-600", className)}>
      {photo ? (
        <Image src={photo} alt="" fill sizes="88px" className="object-cover" />
      ) : (
        icon ?? <An10Logo variant="simbolo" title="" className="w-1/2" />
      )}
    </span>
  );
}

function menuWhen(m: SearchIndexMenu) {
  if (!m.date) return null;
  const d = new Date(m.date).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
  return m.servingTime ? `${d} · ${m.servingTime}` : d;
}

// ---------------------------------------------------------------------------
// Anteprime
// ---------------------------------------------------------------------------
function Preview({
  idx,
  sel,
  canBack,
  backLabel,
  onBack,
  onPush,
  onNavigate,
}: {
  idx: PreparedIndex;
  sel: Sel;
  canBack: boolean;
  backLabel: string;
  onBack: () => void;
  onPush: (s: Sel) => void;
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {canBack && (
        <button type="button" onClick={onBack} className="-mb-1 inline-flex items-center gap-1 self-start text-[0.875rem] font-semibold text-blu-600">
          <ChevronLeft className="size-4" aria-hidden /> {backLabel}
        </button>
      )}
      {sel.kind === "recipe" ? (
        <RecipePreview idx={idx} id={sel.id} onPush={onPush} onNavigate={onNavigate} />
      ) : sel.kind === "menu" ? (
        <MenuPreview idx={idx} id={sel.id} onPush={onPush} onNavigate={onNavigate} />
      ) : (
        <IngredientPreview idx={idx} k={sel.key} onPush={onPush} />
      )}
    </div>
  );
}

function OpenLink({ href, children, onNavigate }: { href: string; children: ReactNode; onNavigate: () => void }) {
  return (
    <Link
      id="search-open-link"
      href={href}
      onClick={onNavigate}
      className="inline-flex h-(--h-btn) items-center justify-center gap-[0.45em] rounded-ctl bg-arancio-pieno px-[1.05em] font-semibold text-white hover:bg-arancio-scuro [&_svg]:size-[1.15em]"
    >
      {children} <ArrowRight aria-hidden />
    </Link>
  );
}

function SubTitle({ children }: { children: ReactNode }) {
  return <h4 className="text-(length:--fs-meta) font-bold tracking-wide text-grigio uppercase">{children}</h4>;
}

function LinkRow({ onClick, children, thumb }: { onClick: () => void; children: ReactNode; thumb?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2.5 rounded-ctl px-1.5 py-1 text-left hover:bg-blu-100">
      {thumb}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ChevronRight className="size-4 shrink-0 text-blu-250" aria-hidden />
    </button>
  );
}

function RecipePreview({ idx, id, onPush, onNavigate }: { idx: PreparedIndex; id: number; onPush: (s: Sel) => void; onNavigate: () => void }) {
  const r = idx.recipeById.get(id);
  if (!r) return null;
  const menus = idx.raw.menus.filter((m) => m.recipeIds.includes(id));
  const SHOW = 12;
  return (
    <>
      <div className="relative aspect-[16/9] overflow-hidden rounded-card bg-blu-100">
        {r.photo ? (
          <Image src={r.photo} alt="" fill sizes="(min-width: 760px) 34rem, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-blu-600">
            <An10Logo variant="simbolo" title="" className="w-[18%]" />
          </div>
        )}
        {!r.published && (
          <div className="absolute top-2 left-2">
            <HiddenTag />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-(length:--fs-page) leading-tight font-bold">{r.name}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.875rem] text-grigio">
          {r.time > 0 && (
            <span className="tabular flex items-center gap-1">
              <Clock className="size-4" aria-hidden /> {formatMinutes(r.time)}
            </span>
          )}
          {r.servings && (
            <span className="flex items-center gap-1">
              <Users className="size-4" aria-hidden /> {formatServings(r.servings, r.servingsUnit)}
            </span>
          )}
          {r.steps > 0 && (
            <span className="tabular flex items-center gap-1">
              <ListOrdered className="size-4" aria-hidden /> {r.steps} {r.steps === 1 ? "passo" : "passi"}
            </span>
          )}
          {r.avgRating != null && <GuestRatingTag value={r.avgRating} count={r.reviews} />}
        </div>
        {(r.categories.length > 0 || r.tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5 text-[0.8125rem]">
            {r.categories.map((c) => (
              <span key={c.name} className="inline-flex items-center gap-1.5 rounded-full bg-blu-100 px-2.5 py-0.5 font-semibold">
                <span className="size-2 rounded-full" style={{ background: c.color }} /> {c.name}
              </span>
            ))}
            {r.tags.map((t) => (
              <span key={t} className="rounded-full border border-blu-150 px-2.5 py-0.5 text-grigio">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <OpenLink href={`/ricette/${r.id}`} onNavigate={onNavigate}>
          Apri la ricetta
        </OpenLink>
      </div>
      {r.ingredients.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <SubTitle>Ingredienti · {r.ingredients.length}</SubTitle>
          <div className="flex flex-wrap gap-1.5">
            {r.ingredients.slice(0, SHOW).map((name, i) => (
              <button
                key={`${name}-${i}`}
                type="button"
                onClick={() => onPush({ kind: "ingredient", key: normalizeSearchText(name) })}
                className="rounded-full bg-blu-100 px-2.5 py-1 text-[0.8125rem] hover:bg-blu-150"
              >
                {name}
              </button>
            ))}
            {r.ingredients.length > SHOW && <span className="px-1 py-1 text-[0.8125rem] text-grigio">+{r.ingredients.length - SHOW}</span>}
          </div>
        </div>
      )}
      {menus.length > 0 && (
        <div className="flex flex-col gap-1">
          <SubTitle>Nei menù</SubTitle>
          {menus.map((m) => (
            <LinkRow key={m.id} onClick={() => onPush({ kind: "menu", id: m.id })} thumb={<Thumb photo={m.photo} icon={<ClocheIcon />} className="size-8" />}>
              {m.name}
            </LinkRow>
          ))}
        </div>
      )}
    </>
  );
}

function MenuPreview({ idx, id, onPush, onNavigate }: { idx: PreparedIndex; id: number; onPush: (s: Sel) => void; onNavigate: () => void }) {
  const m = idx.menuById.get(id);
  if (!m) return null;
  const when = menuWhen(m);
  return (
    <>
      <div className="relative aspect-[16/9] overflow-hidden rounded-card bg-blu-100">
        {m.photo ? (
          <Image src={m.photo} alt="" fill sizes="(min-width: 760px) 34rem, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-blu-600 [&>svg]:size-1/4">
            <ClocheIcon />
          </div>
        )}
        {!m.published && (
          <div className="absolute top-2 left-2">
            <HiddenTag label="Non pronto" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-(length:--fs-page) leading-tight font-bold">{m.name}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.875rem] text-grigio">
          {when && <span className="tabular">{when}</span>}
          {m.people && (
            <span className="flex items-center gap-1">
              <Users className="size-4" aria-hidden /> {m.people} persone
            </span>
          )}
          {m.avgRating != null && <GuestRatingTag value={m.avgRating} count={m.reviews} />}
        </div>
        {m.description && <p className="line-clamp-3 text-[0.9375rem]">{m.description}</p>}
      </div>
      <div>
        <OpenLink href={`/menu/${m.id}`} onNavigate={onNavigate}>
          Apri il menù
        </OpenLink>
      </div>
      {(m.recipeIds.length > 0 || m.quickRecipes.length > 0) && (
        <div className="flex flex-col gap-1">
          <SubTitle>Ricette · {m.recipeIds.length + m.quickRecipes.length}</SubTitle>
          {m.recipeIds.map((rid) => {
            const r = idx.recipeById.get(rid);
            if (!r) return null;
            return (
              <LinkRow key={rid} onClick={() => onPush({ kind: "recipe", id: rid })} thumb={<Thumb photo={r.photo} className="size-8" />}>
                {r.name}
              </LinkRow>
            );
          })}
          {m.quickRecipes.map((name) => (
            <p key={name} className="flex items-center gap-2.5 px-1.5 py-1 text-grigio">
              <span className="size-8 shrink-0 rounded-ctl border border-dashed border-blu-200" aria-hidden />
              {name}
            </p>
          ))}
        </div>
      )}
    </>
  );
}

function IngredientPreview({ idx, k, onPush }: { idx: PreparedIndex; k: string; onPush: (s: Sel) => void }) {
  const st = ingredientStats(idx, k);
  if (!st) return <p className="text-grigio">Ingrediente non trovato.</p>;
  const maxCat = Math.max(1, ...st.byCategory.map((c) => c.count));
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-card bg-giallo-100 text-giallo-ink [&>svg]:size-6">
          <GroceryBagIcon />
        </span>
        <h3 className="text-(length:--fs-page) leading-tight font-bold">{st.entry.name}</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat value={st.recipes.length} label={st.recipes.length === 1 ? "ricetta" : "ricette"} note={`${Math.round(st.share * 100)}% del ricettario`} />
        <Stat value={st.menus.length} label="menù" note={st.menus.length ? "con almeno una di queste ricette" : "in nessun menù"} />
        {st.typical && (
          <StatText
            value={`${formatQty(st.typical.qty)}${st.typical.unit ? ` ${st.typical.unit}` : ""}`}
            label="di solito"
            note={
              st.typical.count > 1 && st.typical.min !== st.typical.max
                ? `da ${formatQty(st.typical.min)} a ${formatQty(st.typical.max)} · ${st.typical.count} ricette`
                : `in ${st.typical.count === 1 ? "una ricetta" : `${st.typical.count} ricette`}`
            }
          />
        )}
        <Stat
          value={st.cooks}
          label={st.cooks === 1 ? "cottura" : "cotture"}
          note={st.topCooked ? `la più cucinata: ${st.topCooked.name}` : "nessuna cottura registrata"}
        />
      </div>

      {st.byCategory.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <SubTitle>Per categoria</SubTitle>
          {st.byCategory.map((c) => (
            <div key={c.name} className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-2 text-[0.875rem]">
              <span className="truncate">{c.name}</span>
              <span className="h-2 overflow-hidden rounded-full bg-blu-100">
                <span className="block h-full rounded-full" style={{ width: `${(c.count / maxCat) * 100}%`, background: c.color }} />
              </span>
              <span className="tabular text-grigio">{c.count}</span>
            </div>
          ))}
        </div>
      )}

      {st.together.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <SubTitle>Spesso insieme a</SubTitle>
          <div className="flex flex-wrap gap-1.5">
            {st.together.map((t) => (
              <Chip key={t.key} onClick={() => onPush({ kind: "ingredient", key: t.key })}>
                {t.name} <span className="tabular opacity-60">{t.count}</span>
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <SubTitle>Ricette</SubTitle>
        {st.recipes.map((r) => (
          <LinkRow key={r.id} onClick={() => onPush({ kind: "recipe", id: r.id })} thumb={<Thumb photo={r.photo} className="size-8" />}>
            {r.name}
          </LinkRow>
        ))}
      </div>
    </>
  );
}

/** Come `Stat`, con un valore testuale (es. «200 g») */
function StatText({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-card bg-blu-100 px-3 py-2.5">
      <span className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="tabular text-[1.375rem] leading-none font-bold text-arancio">{value}</span>
        <span className="font-semibold">{label}</span>
      </span>
      <span className="mt-1 text-(length:--fs-meta) text-grigio">{note}</span>
    </div>
  );
}

function Stat({ value, label, note }: { value: number; label: string; note: string }) {
  return (
    <div className="flex flex-col rounded-card bg-blu-100 px-3 py-2.5">
      <span className="flex items-baseline gap-1.5">
        <span className="tabular text-[1.75rem] leading-none font-bold text-blu-800">{value}</span>
        <span className="font-semibold">{label}</span>
      </span>
      <span className="mt-1 text-(length:--fs-meta) text-grigio">{note}</span>
    </div>
  );
}

