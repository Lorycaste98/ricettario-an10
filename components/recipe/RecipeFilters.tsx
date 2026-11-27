"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { Check, ChevronDown, ChevronUp, Hash, Plus } from "lucide-react";
import { Chip } from "@/components/ds/Controls";
import { SearchField } from "@/components/ds/Field";
import { Button } from "@/components/ds/Button";
import { normalizeSearchText } from "@/lib/search";
import type { Category, RecipeSummary, Tag } from "@/lib/types";

/**
 * Filtri della libreria ricette (fase 9, rifatti sulla struttura della versione di `main`).
 * - 4.14 · filtri a tendina: `FilterPopover` (bottone «Categorie ▾» / «Tag ▾» col numero di scelti
 *   + tendina in portale su `body`, non tagliata dai contenitori) con dentro `FilterChecklist`
 *   (categorie e tag nello stesso elenco: ricerca 4.5 + caselle **ad altezza fissa** che scorre, col
 *   pallino del colore per le categorie). Su contenitore stretto stanno nel foglio dal basso «Filtri»
 *   (`Modal variant="sheet"`) dentro `FilterPicker`: chiusi, gli scelti come chip e un «+» che apre
 *   l'elenco; visibilità e ordinamento stanno in cima.
 * - 4.15 · `FilterSearch`: la ricerca della lista che, mentre scrivi, propone le categorie e i tag
 *   che corrispondono; sceglierne uno lo trasforma in un filtro e svuota il campo.
 * - `ActiveFilters`: fila dei filtri attivi, togliibili con la ✕.
 *
 * Semantica (invariata): OR dentro le categorie, OR dentro i tag, AND fra le due. Il numero di una
 * voce = ricette con quella voce fra quelle che passano ricerca, visibilità e **l'altra** dimensione
 * (la propria no: dentro una dimensione le scelte si sommano). Una voce a 0 è spenta, salvo se scelta.
 */

export interface Facets {
  catCount: Map<number, number>;
  tagCount: Map<number, number>;
}

/** Conteggi a faccette. `base` = ricette già filtrate per ricerca e visibilità. */
export function computeFacets(base: RecipeSummary[], activeCats: number[], activeTags: number[]): Facets {
  const catCount = new Map<number, number>();
  const tagCount = new Map<number, number>();
  for (const r of base) {
    const passCats = !activeCats.length || r.categories.some((c) => activeCats.includes(c.id));
    const passTags = !activeTags.length || r.tags.some((t) => activeTags.includes(t.id));
    if (passTags) for (const c of r.categories) catCount.set(c.id, (catCount.get(c.id) ?? 0) + 1);
    if (passCats) for (const t of r.tags) tagCount.set(t.id, (tagCount.get(t.id) ?? 0) + 1);
  }
  return { catCount, tagCount };
}

/** Titolo di sezione (maiuscolo spaziato 2.3) con un'azione a destra */
export function FilterSectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex min-h-(--h-sm) items-center justify-between gap-2">
      <h3 className="text-xs font-semibold tracking-[0.08em] text-grigio uppercase">{children}</h3>
      {aside}
    </div>
  );
}

type CheckItem = { id: number; name: string; color?: string };

/**
 * Categorie e tag (stesso elenco dal 27/11/2026): ricerca + elenco a caselle ad altezza fissa,
 * col pallino del colore per le categorie. Gli elementi scelti stanno in cima (ordine fissato
 * all'apertura e a ogni cambio di ricerca, così una riga non salta via sotto il dito), poi gli altri
 * dalla A alla Z, quelli a 0 in fondo e spenti. Tastiera: frecce dal campo, Invio (o Spazio a campo
 * vuoto) sceglie la riga evidenziata.
 */
export function FilterChecklist({
  items: all,
  counts,
  active: activeTags,
  onToggle,
  noun,
  autoFocus,
  listClassName = "max-h-[min(18rem,45dvh)]",
}: {
  items: CheckItem[];
  /** numero di ricette per id (faccette) */
  counts: Map<number, number>;
  active: number[];
  onToggle: (id: number) => void;
  /** «tag», «categorie»: segnaposto ed etichette */
  noun: string;
  autoFocus?: boolean;
  listClassName?: string;
}) {
  const tags = all;
  const listId = useId();
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(-1);
  // tag «fissati in cima»: quelli scelti all'apertura; si riallineano solo cambiando la ricerca
  const [pinned, setPinned] = useState<number[]>(activeTags);
  const q = normalizeSearchText(query);

  const items = useMemo(() => {
    const n = (t: CheckItem) => counts.get(t.id) ?? 0;
    const match = q ? tags.filter((t) => normalizeSearchText(t.name).includes(q)) : tags;
    const byName = (a: CheckItem, b: CheckItem) => a.name.localeCompare(b.name, "it");
    const top = match.filter((t) => pinned.includes(t.id)).sort(byName);
    const rest = match.filter((t) => !pinned.includes(t.id));
    const live = rest.filter((t) => n(t) > 0 || activeTags.includes(t.id)).sort(byName);
    const dead = rest.filter((t) => n(t) === 0 && !activeTags.includes(t.id)).sort(byName);
    return [...top, ...live, ...dead];
  }, [tags, q, pinned, counts, activeTags]);

  const isOff = (t: CheckItem) => !activeTags.includes(t.id) && (counts.get(t.id) ?? 0) === 0;

  // tiene la riga evidenziata dentro l'elenco che scorre
  useEffect(() => {
    if (hi < 0) return;
    document.getElementById(`${listId}-${hi}`)?.scrollIntoView({ block: "nearest" });
  }, [hi, listId]);

  const move = (dir: 1 | -1) => {
    if (!items.length) return;
    let i = hi;
    for (let k = 0; k < items.length; k++) {
      i = (i + dir + items.length) % items.length;
      if (!isOff(items[i])) break;
    }
    setHi(i);
  };

  const toggleAt = (i: number) => {
    const t = items[i];
    if (t && !isOff(t)) onToggle(t.id);
  };

  return (
    <div className="flex flex-col gap-2">
      <SearchField
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPinned(activeTags);
          setHi(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            move(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            move(-1);
          } else if (hi >= 0 && (e.key === "Enter" || (e.key === " " && !query))) {
            e.preventDefault();
            toggleAt(hi);
          }
        }}
        placeholder={`Cerca fra ${tags.length} ${noun}…`}
        aria-label={`Cerca fra ${noun}`}
        role="combobox"
        aria-expanded
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={hi >= 0 ? `${listId}-${hi}` : undefined}
        autoComplete="off"
      />
      <div
        id={listId}
        role="listbox"
        aria-label={noun}
        aria-multiselectable
        className={clsx("overflow-y-auto overscroll-contain rounded-ctl border border-blu-150 bg-white", listClassName)}
      >
        {items.length === 0 ? (
          <p className="px-3 py-4 text-center text-[0.875rem] text-grigio">Nessun risultato per «{query.trim()}»</p>
        ) : (
          items.map((t, i) => {
            const sel = activeTags.includes(t.id);
            const off = isOff(t);
            const n = counts.get(t.id) ?? 0;
            return (
              <div
                key={t.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={sel}
                aria-disabled={off || undefined}
                // mousedown + preventDefault: il focus resta nel campo di ricerca (tastiera dopo il click)
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setHi(i);
                  toggleAt(i);
                }}
                className={clsx(
                  "flex min-h-11 items-center gap-2.5 border-b border-blu-150 px-3 text-[0.9375rem] last:border-0",
                  off ? "cursor-not-allowed text-grigio-chiaro" : "cursor-pointer text-blu-950",
                  sel && "font-semibold",
                  i === hi && !off ? "bg-blu-100" : sel ? "bg-blu-50" : !off && "hover:bg-blu-50"
                )}
              >
                {/* scelto = quadratino blu-800 come i chip filtro attivi (4.11): il verde resta per «fatto» */}
                <span
                  aria-hidden
                  className={clsx(
                    "flex size-5 shrink-0 items-center justify-center rounded-[0.375rem] border-2",
                    sel ? "border-blu-800 bg-blu-800 text-white" : off ? "border-blu-150 bg-white" : "border-blu-250 bg-white"
                  )}
                >
                  {sel && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                {t.color && <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: off ? "var(--color-blu-200)" : t.color }} />}
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
                <span className={clsx("tabular text-[0.8125rem] font-normal", off ? "text-grigio-chiaro" : "text-grigio")}>{n}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


/**
 * Sezione filtro del foglio (contenitore stretto): parte **chiusa**, mostra solo gli scelti come chip
 * con la ✕ e un chip tratteggiato «+» che apre l'elenco (`FilterChecklist`). Stessa forma per
 * categorie e tag.
 */
export function FilterPicker({
  title,
  items,
  counts,
  active,
  onToggle,
  onClear,
  noun,
  listClassName,
}: {
  title: string;
  items: CheckItem[];
  counts: Map<number, number>;
  active: number[];
  onToggle: (id: number) => void;
  onClear: () => void;
  noun: string;
  listClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const chosen = items.filter((i) => active.includes(i.id));
  return (
    <section className="flex flex-col gap-1.5">
      <FilterSectionTitle
        aside={
          chosen.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Togli
            </Button>
          ) : undefined
        }
      >
        {title}
        {chosen.length > 0 ? ` · ${chosen.length}` : ""}
      </FilterSectionTitle>
      <div className="flex flex-wrap gap-1.5">
        {chosen.map((i) => (
          <Chip key={i.id} active dot={i.color} onRemove={() => onToggle(i.id)} removeLabel={`Togli ${i.name}`}>
            {i.name}
          </Chip>
        ))}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="hit-44 inline-flex h-(--h-sm) items-center gap-[0.4em] rounded-full border border-dashed border-blu-250 bg-white px-[0.85em] text-[0.875rem] font-semibold whitespace-nowrap text-blu-600 transition-colors hover:bg-blu-100 [&_svg]:size-[1.05em]"
        >
          {open ? <ChevronUp aria-hidden /> : <Plus aria-hidden />}
          {open ? "Chiudi" : chosen.length > 0 ? "Altre" : `Scegli ${noun}`}
        </button>
      </div>
      {open && <FilterChecklist items={items} counts={counts} active={active} onToggle={onToggle} noun={noun} listClassName={listClassName} />}
    </section>
  );
}

/**
 * 4.14 · bottone filtro con tendina (contenitore largo): «Etichetta ▾» col numero di scelti; la
 * tendina è in portale su `body` con posizione fissa calcolata dal bottone (esce da qualsiasi
 * contenitore), si chiude con un tocco fuori o con Esc (il focus torna al bottone).
 */
export function FilterPopover({
  label,
  icon,
  count = 0,
  widthRem = 20,
  title,
  onClear,
  children,
}: {
  label: string;
  icon?: ReactNode;
  count?: number;
  widthRem?: number;
  /** titolo dentro la tendina (default = etichetta) */
  title?: string;
  /** «Togli» in cima alla tendina quando ci sono scelte */
  onClear?: () => void;
  children: ReactNode;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    // il contenitore si è stretto e il bottone è sparito (barra → «Filtri»): la tendina si chiude
    if (b.width === 0 && b.height === 0) {
      setOpen(false);
      return;
    }
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const width = Math.min(widthRem * rem, vw - 16);
    // allineata al bordo sinistro del bottone; se esce a destra, rientra
    const left = Math.max(8, Math.min(b.left, vw - 8 - width));
    const top = b.bottom + 6;
    setPos({ top, left, width, maxHeight: Math.max(200, vh - top - 12) });
  }, [widthRem]);

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // all'apertura il focus va al primo campo (ricerca tag) o al primo controllo della tendina
  useEffect(() => {
    if (!open || !pos) return;
    const p = panelRef.current;
    if (!p || p.contains(document.activeElement)) return;
    const first = p.querySelector<HTMLElement>("input, button:not([disabled])");
    first?.focus();
  }, [open, pos]);

  return (
    <>
      <Button
        ref={btnRef}
        variant="secondary"
        icon={icon}
        onClick={() => (open ? close(false) : setOpen(true))}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={clsx(count > 0 && "border-blu-800")}
      >
        {label}
        {count > 0 && (
          <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-blu-800 px-1 text-xs font-bold text-white">
            {count}
          </span>
        )}
        <ChevronDown className={clsx("text-blu-700 transition-transform", open && "rotate-180")} aria-hidden />
      </Button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={title ?? label}
            className="ds fixed z-50 flex flex-col gap-2 overflow-y-auto rounded-[0.875rem] border border-blu-150 bg-white p-3 text-blu-950 shadow-[0_12px_32px_oklch(25%_0.038_228/.16)]"
            style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
          >
            <FilterSectionTitle
              aside={
                onClear && count > 0 ? (
                  <Button variant="ghost" size="sm" onClick={onClear}>
                    Togli
                  </Button>
                ) : undefined
              }
            >
              {title ?? label}
            </FilterSectionTitle>
            {children}
          </div>,
          document.body
        )}
    </>
  );
}

type Suggestion = { kind: "cat"; item: Category; n: number } | { kind: "tag"; item: Tag; n: number };

/** 4.15 · ricerca della lista con le categorie e i tag proposti mentre si scrive */
export function FilterSearch({
  value,
  onChange,
  categories,
  tags,
  facets,
  activeCats,
  activeTags,
  onPickCat,
  onPickTag,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  categories: Category[];
  tags: Tag[];
  facets: Facets;
  activeCats: number[];
  activeTags: number[];
  onPickCat: (id: number) => void;
  onPickTag: (id: number) => void;
  className?: string;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const q = normalizeSearchText(value);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (q.length < 2) return [];
    // prima chi comincia con il testo, poi chi lo contiene; fuori le voci già scelte o a 0
    const rank = (name: string) => (normalizeSearchText(name).startsWith(q) ? 0 : 1);
    const cats: Suggestion[] = categories
      .filter((c) => !activeCats.includes(c.id) && normalizeSearchText(c.name).includes(q))
      .map((c) => ({ kind: "cat" as const, item: c, n: facets.catCount.get(c.id) ?? 0 }));
    const tgs: Suggestion[] = tags
      .filter((t) => !activeTags.includes(t.id) && normalizeSearchText(t.name).includes(q))
      .map((t) => ({ kind: "tag" as const, item: t, n: facets.tagCount.get(t.id) ?? 0 }));
    return [...cats, ...tgs]
      .filter((s) => s.n > 0)
      .sort((a, b) => rank(a.item.name) - rank(b.item.name) || b.n - a.n)
      .slice(0, 8);
  }, [q, categories, tags, activeCats, activeTags, facets]);

  const show = open && suggestions.length > 0;

  const pick = (s: Suggestion) => {
    if (s.kind === "cat") onPickCat(s.item.id);
    else onPickTag(s.item.id);
    onChange("");
    setHi(-1);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={clsx("relative min-w-0", className)}>
      <SearchField
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHi(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && show) {
            // prima chiude la tendina; il secondo Esc svuota il campo (comportamento nativo)
            e.preventDefault();
            setOpen(false);
            return;
          }
          if (!suggestions.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHi((h) => (h + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            setHi((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
          } else if (e.key === "Enter" && show && hi >= 0) {
            e.preventDefault();
            pick(suggestions[hi]);
          }
        }}
        placeholder="Ricette, categorie, tag…"
        aria-label="Cerca ricette"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={show && hi >= 0 ? `${listId}-${hi}` : undefined}
        autoComplete="off"
      />
      {show && (
        <div
          id={listId}
          role="listbox"
          aria-label="Filtra per"
          className="absolute top-full left-0 z-40 mt-1 max-h-80 w-full min-w-[15rem] overflow-y-auto rounded-[0.75rem] border border-blu-200 bg-white p-1 shadow-[0_10px_26px_oklch(25%_0.038_228/.14)]"
        >
          <p className="px-2.5 pt-1.5 pb-1 text-xs font-semibold tracking-[0.08em] text-grigio uppercase">Filtra per</p>
          {suggestions.map((s, i) => (
            <div
              key={`${s.kind}-${s.item.id}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === hi}
              // mousedown: scegliere prima che il blur del campo chiuda la tendina
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setHi(i)}
              className={clsx(
                "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[0.5rem] px-2.5 text-[0.9375rem] text-blu-950",
                i === hi ? "bg-blu-100" : "hover:bg-blu-50"
              )}
            >
              {s.kind === "cat" ? (
                <span aria-hidden className="flex size-5 shrink-0 items-center justify-center">
                  <span className="size-2.5 rounded-full" style={{ background: s.item.color }} />
                </span>
              ) : (
                <Hash aria-hidden className="size-4 shrink-0 text-blu-700" />
              )}
              <span className="min-w-0 flex-1 truncate">
                {s.item.name}
                <span className="ml-1.5 text-[0.8125rem] text-grigio">{s.kind === "cat" ? "categoria" : "tag"}</span>
              </span>
              <span className="tabular text-[0.8125rem] text-grigio">{s.n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Fila dei filtri attivi sopra la lista (chip con ✕) + «Togli tutti» */
export function ActiveFilters({
  categories,
  tags,
  activeCats,
  activeTags,
  onToggleCat,
  onToggleTag,
  extra,
  onClear,
}: {
  categories: Category[];
  tags: Tag[];
  activeCats: number[];
  activeTags: number[];
  onToggleCat: (id: number) => void;
  onToggleTag: (id: number) => void;
  /** altri filtri attivi (visibilità admin) */
  extra?: ReactNode;
  onClear: () => void;
}) {
  const cats = categories.filter((c) => activeCats.includes(c.id));
  const tgs = tags.filter((t) => activeTags.includes(t.id));
  if (!cats.length && !tgs.length && !extra) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {extra}
      {cats.map((c) => (
        <Chip key={`c${c.id}`} dot={c.color} onRemove={() => onToggleCat(c.id)} removeLabel={`Togli la categoria ${c.name}`}>
          {c.name}
        </Chip>
      ))}
      {tgs.map((t) => (
        <Chip key={`t${t.id}`} onRemove={() => onToggleTag(t.id)} removeLabel={`Togli il tag ${t.name}`}>
          #{t.name}
        </Chip>
      ))}
      <Button variant="ghost" size="sm" onClick={onClear}>
        Togli tutti
      </Button>
    </div>
  );
}
