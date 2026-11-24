"use client";
import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import ReactPaginate from "react-paginate";
import { clsx } from "clsx";
import { ArrowDown, ArrowUp, Eye, EyeOff, Hash, Plus, Search, SlidersHorizontal } from "lucide-react";
import { RecipeCard } from "./RecipeCard";
import { RecipeRow } from "./RecipeRow";
import { CollectionBody, pageSizeFor, useCollectionView } from "@/components/ui/CollectionView";
import { TagFilterCombobox } from "./TagFilterCombobox";
import { type RecipeSummary, type Category, type Tag } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { useLocalStore } from "@/lib/local-store";
import { Modal } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ds/Button";
import { SearchField, Select } from "@/components/ds/Field";
import { Chip, Segmented } from "@/components/ds/Controls";
import { EmptyState } from "@/components/ds/Feedback";

/**
 * Libreria ricette (restyle fase 3, prototipo `docs/design/schermate/1-libreria`).
 * Logica invariata: ricerca, categorie, tag, visibilità (admin), ordinamento, filtri persistiti
 * per scheda (sessionStorage), paginazione. Interfaccia: ricerca 4.5, categorie come chip 4.11
 * in una fila scorrevole (si attivano subito), tag in un pannello, griglia elastica di card 8.1.
 * Su contenitore stretto ordinamento e visibilità stanno nel pannello «Ordina e filtra».
 */
// Elementi per pagina: multipli delle card per riga (pageSizeFor), tetti fissi per 1 per riga e lista
const PAGE = { base: 20, single: 10, list: 20 };

interface Props {
  recipes: RecipeSummary[];
  categories: Category[];
  tags: Tag[];
}

type SortKey = "myRating" | "createdAt" | "name" | "prep" | "cook" | "cookCount" | "avgRating" | "reviews";
type PublishedFilter = "all" | "published" | "draft";

const PUBLISHED_OPTIONS: { value: PublishedFilter; label: string; icon?: ReactNode }[] = [
  { value: "all", label: "Tutte" },
  { value: "published", label: "Pronte", icon: <Eye aria-hidden /> },
  { value: "draft", label: "Non pronte", icon: <EyeOff aria-hidden /> },
];

const PUBLISHED_FILTER_KEY = "ricettario:recipe-published-filter";
const parsePublishedFilter = (raw: string): PublishedFilter => {
  const v = JSON.parse(raw);
  return v === "published" || v === "draft" ? v : "all";
};

// "Il mio voto" è admin-only (voto personale); filtrato per i visitatori
const SORT_OPTIONS: { value: SortKey; label: string; adminOnly?: boolean }[] = [
  { value: "myRating", label: "Il mio voto", adminOnly: true },
  { value: "avgRating", label: "Valutazione" },
  { value: "reviews", label: "Recensioni" },
  { value: "createdAt", label: "Data" },
  { value: "name", label: "Nome" },
  { value: "prep", label: "Tempo prep" },
  { value: "cook", label: "Cottura" },
  { value: "cookCount", label: "Volte cotta" },
];

// Persistenza filtri: restano salvati anche tornando indietro dalla pagina di dettaglio
const RK = "ricettario:recipe-list:";
// Ordinamento: in localStorage (resta anche chiudendo la scheda/app), chiavi distinte da
// quelle per-scheda così i vecchi valori in sessionStorage non contano più
const RSK = "ricettario:recipe-sort:";
const SORT_KEYS = SORT_OPTIONS.map((o) => o.value);
const parseStr = (raw: string): string => {
  const v = JSON.parse(raw);
  return typeof v === "string" ? v : "";
};
// Persiste solo la scelta ESPLICITA (null = nessuna). Il default effettivo lo deriva
// il componente da isAdmin (admin → "myRating", visitatore → "avgRating"): così evitiamo
// il caching del fallback dinamico di useLocalStore mentre isAdmin arriva async.
const parseSortPref = (raw: string): SortKey | null => {
  const v = JSON.parse(raw);
  return SORT_KEYS.includes(v) ? v : null;
};
const parseOrder = (raw: string): "asc" | "desc" => (JSON.parse(raw) === "asc" ? "asc" : "desc");
const parseNumArr = (raw: string): number[] => {
  const v = JSON.parse(raw);
  return Array.isArray(v) ? v.filter((x) => typeof x === "number") : [];
};
const parsePage = (raw: string): number => {
  const v = JSON.parse(raw);
  return Number.isInteger(v) && v >= 0 ? v : 0;
};

export function RecipeGrid({ recipes, categories, tags }: Props) {
  const { isAdmin } = useAuth();
  // Filtri per-scheda: persistono durante la navigazione ma si azzerano alla chiusura scheda.
  // Fa eccezione l'ordinamento (sort + order), salvato sul dispositivo.
  const [q, setQ] = useLocalStore<string>(RK + "q", "", parseStr, undefined, "session");
  const [activeCats, setActiveCats] = useLocalStore<number[]>(RK + "cats", [], parseNumArr, undefined, "session");
  const [activeTags, setActiveTags] = useLocalStore<number[]>(RK + "tags", [], parseNumArr, undefined, "session");
  const [sortPref, setSort] = useLocalStore<SortKey | null>(RSK + "sort", null, parseSortPref);
  const [order, setOrder] = useLocalStore<"asc" | "desc">(RSK + "order", "desc", parseOrder);
  const [publishedFilter, setPublishedFilter] = useLocalStore<PublishedFilter>(
    PUBLISHED_FILTER_KEY,
    "all",
    parsePublishedFilter,
    undefined,
    "session"
  );
  // Indice della PRIMA voce mostrata (non il numero di pagina): cambiando le card per riga, e quindi
  // gli elementi per pagina, si resta sulla pagina che contiene le stesse voci
  const [start, setStart] = useLocalStore<number>(RK + "start", 0, parsePage, undefined, "session");
  const [filterOpen, setFilterOpen] = useState(false);
  // Griglia o lista + card per riga (scelte del dispositivo). Ricette: card da 6.5rem → 3 sul telefono
  const layout = useCollectionView({ storageKey: "recipes", minCardRem: 6.5, autoCard: [9.5, 0.24, 13] });
  const [tagsOpen, setTagsOpen] = useState(false);

  // Ordinamento di default: admin → "Il mio voto" personale, visitatore → "Valutazione".
  const defaultSort: SortKey = isAdmin ? "myRating" : "avgRating";
  // "Il mio voto" scelto da un admin non vale per un visitatore sullo stesso dispositivo
  const sort: SortKey = sortPref && (isAdmin || sortPref !== "myRating") ? sortPref : defaultSort;
  const sortOptions = isAdmin ? SORT_OPTIONS : SORT_OPTIONS.filter((o) => !o.adminOnly);

  const resetPage = () => setStart(0);
  const isSortChanged = sort !== defaultSort || order !== "desc" || (isAdmin && publishedFilter !== "all");
  const hasActiveFilters = activeCats.length > 0 || activeTags.length > 0;

  const toggleCat = (id: number) => {
    setActiveCats(activeCats.includes(id) ? activeCats.filter((x) => x !== id) : [...activeCats, id]);
    resetPage();
  };
  const toggleTag = (id: number) => {
    setActiveTags(activeTags.includes(id) ? activeTags.filter((x) => x !== id) : [...activeTags, id]);
    resetPage();
  };
  const clearAll = () => {
    setQ("");
    setActiveCats([]);
    setActiveTags([]);
    setPublishedFilter("all");
    resetPage();
  };

  const filtered = useMemo(() => {
    let list = [...recipes];
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(lq));
    }
    if (activeCats.length) list = list.filter((r) => r.categories.some((c) => activeCats.includes(c.id)));
    if (activeTags.length) list = list.filter((r) => r.tags.some((t) => activeTags.includes(t.id)));
    // Visibilità (solo admin: i visitatori non ricevono mai le non pronte)
    if (isAdmin && publishedFilter === "published") list = list.filter((r) => r.published);
    else if (isAdmin && publishedFilter === "draft") list = list.filter((r) => !r.published);

    // null → 0, così le ricette senza voti/recensioni finiscono in fondo su "desc"
    const valueFor = (r: RecipeSummary): string | number => {
      if (sort === "name") return r.name;
      if (sort === "myRating") return r.myRating ?? 0;
      if (sort === "avgRating") return r.avgRating ?? 0;
      if (sort === "reviews") return r._count.reviews;
      return r[sort] ?? 0;
    };
    list.sort((a, b) => {
      const av = valueFor(a);
      const bv = valueFor(b);
      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [recipes, q, activeCats, activeTags, sort, order, isAdmin, publishedFilter]);

  const pageSize = pageSizeFor(layout.view, layout.cols, PAGE);
  const pageCount = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(Math.floor(start / pageSize), Math.max(0, pageCount - 1));
  const paginated = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const sortLabel = sortOptions.find((o) => o.value === sort)?.label ?? "";

  const sortControls = (
    <>
      <Select
        aria-label="Ordina per"
        value={sort}
        onChange={(e) => {
          setSort(e.target.value as SortKey);
          resetPage();
        }}
        className="w-40"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <IconButton
        shape="square"
        label={order === "asc" ? "Crescente: tocca per decrescente" : "Decrescente: tocca per crescente"}
        onClick={() => {
          setOrder(order === "asc" ? "desc" : "asc");
          resetPage();
        }}
      >
        {order === "asc" ? <ArrowUp /> : <ArrowDown />}
      </IconButton>
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Ricerca + filtri */}
      <div className="flex items-center gap-2">
        <SearchField
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            resetPage();
          }}
          placeholder="Cerca ricette…"
          aria-label="Cerca ricette"
          className="flex-1"
        />
        <IconButton
          shape="square"
          label="Ordina e filtra"
          onClick={() => setFilterOpen(true)}
          className={clsx("@min-[860px]:hidden", isSortChanged && "border-arancio text-arancio")}
        >
          <SlidersHorizontal />
        </IconButton>
        <div className="hidden items-center gap-2 @min-[860px]:flex">
          {isAdmin && (
            <Segmented
              label="Visibilità"
              value={publishedFilter}
              onChange={(v) => {
                setPublishedFilter(v);
                resetPage();
              }}
              options={PUBLISHED_OPTIONS}
            />
          )}
          {sortControls}
        </div>
      </div>

      {/* Categorie (chip, subito attive) + tag */}
      {(categories.length > 0 || tags.length > 0) && (
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:-mx-6 sm:px-6">
          <Chip active={!hasActiveFilters} onClick={() => { setActiveCats([]); setActiveTags([]); resetPage(); }}>
            Tutte
          </Chip>
          {tags.length > 0 && (
            <Chip active={activeTags.length > 0} icon={<Hash aria-hidden />} onClick={() => setTagsOpen(true)}>
              Tag{activeTags.length > 0 ? ` · ${activeTags.length}` : ""}
            </Chip>
          )}
          {categories.map((c) => (
            <Chip key={c.id} active={activeCats.includes(c.id)} dot={c.color} onClick={() => toggleCat(c.id)}>
              {c.name}
            </Chip>
          ))}
        </div>
      )}

      {/* Tag scelti (rimovibili) */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags
            .filter((t) => activeTags.includes(t.id))
            .map((t) => (
              <Chip key={t.id} onRemove={() => toggleTag(t.id)} removeLabel={`Togli il tag ${t.name}`}>
                #{t.name}
              </Chip>
            ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-xs font-semibold tracking-[0.08em] text-grigio uppercase">
          {filtered.length} ricett{filtered.length === 1 ? "a" : "e"}
          {(hasActiveFilters || q) && " trovate"}
          <span className="hidden @min-[620px]:inline"> · ordinate per {sortLabel.toLowerCase()}</span>
          {pageCount > 1 && ` · pagina ${safePage + 1} di ${pageCount}`}
        </p>
        {paginated.length > 0 && layout.controls}
      </div>

      {paginated.length > 0 ? (
        <CollectionBody
          view={layout.view}
          gridRef={layout.ref}
          gridStyle={layout.gridStyle}
          fallbackCols="grid-cols-[repeat(auto-fill,minmax(clamp(9.5rem,24cqi,13rem),1fr))]"
        >
          {paginated.map((r) => (layout.view === "list" ? <RecipeRow key={r.id} recipe={r} /> : <RecipeCard key={r.id} recipe={r} />))}
        </CollectionBody>
      ) : (
        <EmptyState
          icon={<Search />}
          title="Nessuna ricetta trovata"
          action={
            (q || hasActiveFilters || (isAdmin && publishedFilter !== "all")) && (
              <Button size="sm" variant="secondary" onClick={clearAll}>
                Togli i filtri
              </Button>
            )
          }
        >
          Prova con un altro nome o un&apos;altra categoria.
        </EmptyState>
      )}

      {pageCount > 1 && (
        <ReactPaginate
          pageCount={pageCount}
          forcePage={safePage}
          onPageChange={({ selected }) => {
            setStart(selected * pageSize);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          pageRangeDisplayed={3}
          marginPagesDisplayed={1}
          previousLabel="‹"
          nextLabel="›"
          breakLabel="…"
          previousAriaLabel="Pagina precedente"
          nextAriaLabel="Pagina successiva"
          containerClassName="flex items-center justify-center gap-1 pt-3"
          pageLinkClassName="tabular flex size-(--h-btn) items-center justify-center rounded-ctl border border-blu-200 bg-white text-sm font-semibold hover:bg-blu-100"
          activeLinkClassName="border-arancio-pieno! bg-arancio-pieno! text-white!"
          previousLinkClassName="flex size-(--h-btn) items-center justify-center rounded-ctl border border-blu-200 bg-white text-lg text-blu-800 hover:bg-blu-100"
          nextLinkClassName="flex size-(--h-btn) items-center justify-center rounded-ctl border border-blu-200 bg-white text-lg text-blu-800 hover:bg-blu-100"
          breakLinkClassName="flex size-(--h-btn) items-center justify-center text-sm text-grigio"
          disabledClassName="opacity-40 [&>a]:cursor-not-allowed"
        />
      )}

      {/* Tag: ricerca + selezione multipla */}
      <Modal open={tagsOpen} onClose={() => setTagsOpen(false)} title="Filtra per tag" size="sm">
        <div className="flex flex-col gap-3">
          <TagFilterCombobox tags={tags} selectedIds={activeTags} onToggle={toggleTag} autoFocus />
          <div className="flex justify-end gap-2">
            {activeTags.length > 0 && (
              <Button variant="ghost" onClick={() => { setActiveTags([]); resetPage(); }}>
                Togli tutti
              </Button>
            )}
            <Button variant="secondary" onClick={() => setTagsOpen(false)}>
              Fatto
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contenitore stretto: ordinamento e visibilità */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Ordina e filtra" size="sm">
        <div className="flex flex-col gap-4">
          {isAdmin && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[0.8125rem] font-semibold text-grigio">Visibilità</p>
              <Segmented
                label="Visibilità"
                value={publishedFilter}
                onChange={(v) => {
                  setPublishedFilter(v);
                  resetPage();
                }}
                options={PUBLISHED_OPTIONS}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <p className="text-[0.8125rem] font-semibold text-grigio">Ordina per</p>
            <div className="flex gap-2">{sortControls}</div>
          </div>
          <Button onClick={() => setFilterOpen(false)}>Mostra {filtered.length} ricette</Button>
        </div>
      </Modal>
    </div>
  );
}

/** Bottone «Nuova ricetta» della testata (solo admin): pieno da contenitore largo, solo + su stretto */
export function NewRecipeLink() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return (
    <Link
      href="/admin/ricette/nuova"
      aria-label="Nuova ricetta"
      className="inline-flex h-(--h-btn) items-center justify-center gap-[0.45em] rounded-ctl bg-arancio-pieno px-[1.05em] font-semibold text-white hover:bg-arancio-scuro [&_svg]:size-[1.15em]"
    >
      <Plus aria-hidden />
      <span className="hidden @min-[620px]:inline">Nuova ricetta</span>
    </Link>
  );
}
