"use client";
import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import ReactPaginate from "react-paginate";
import { clsx } from "clsx";
import { ArrowDown, ArrowUp, Eye, EyeOff, Hash, Plus, Search, SlidersHorizontal } from "lucide-react";
import { RecipeCard } from "./RecipeCard";
import { RecipeRow } from "./RecipeRow";
import { CollectionBody, pageSizeFor, useCollectionView } from "@/components/ui/CollectionView";
import {
  ActiveFilters,
  CategoryChips,
  computeFacets,
  FilterPopover,
  FilterSearch,
  FilterSectionTitle,
  TagChecklist,
} from "./RecipeFilters";
import { normalizeSearchText } from "@/lib/search";
import { type RecipeSummary, type Category, type Tag } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { useLocalStore } from "@/lib/local-store";
import { LIST_LAYOUT, LIST_PAGE, RECIPE_SORT_OPTIONS, recipeSortFor, useRecipeSort, type RecipeSortKey } from "@/lib/preferences";
import { Modal } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ds/Button";
import { Select } from "@/components/ds/Field";
import { Chip, Segmented } from "@/components/ds/Controls";
import { EmptyState } from "@/components/ds/Feedback";

/**
 * Libreria ricette (restyle fase 3, prototipo `docs/design/schermate/1-libreria`).
 * Logica invariata: ricerca, categorie, tag, visibilità (admin), ordinamento, filtri persistiti
 * per scheda (sessionStorage), paginazione. Filtri (fase 9, `RecipeFilters.tsx`, struttura della
 * versione di `main`): da 860px di contenitore barra accanto alla ricerca con «Categorie ▾» e
 * «Tag ▾» (tendine 4.14), visibilità (admin) e ordinamento; sotto, bottone «Filtri» → foglio dal
 * basso con le stesse sezioni. Conteggi a faccette, ricerca 4.15 che propone categorie e tag, fila
 * dei filtri attivi sopra la lista.
 */
// Elementi per pagina: multipli delle card per riga (pageSizeFor), tetti fissi per 1 per riga e lista
const PAGE = LIST_PAGE.recipes;

interface Props {
  recipes: RecipeSummary[];
  categories: Category[];
  tags: Tag[];
}

type SortKey = RecipeSortKey;
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

const SORT_OPTIONS = RECIPE_SORT_OPTIONS;

// Persistenza filtri: restano salvati anche tornando indietro dalla pagina di dettaglio
const RK = "ricettario:recipe-list:";
const parseStr = (raw: string): string => {
  const v = JSON.parse(raw);
  return typeof v === "string" ? v : "";
};
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
  // Ordinamento: preferenza del dispositivo (anche dalla pagina Impostazioni)
  const { pref: sortPref, setPref: setSort, order, setOrder } = useRecipeSort();
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
  const layout = useCollectionView("recipes");

  // Ordinamento di default: admin → «Il mio voto» personale, visitatore → «Valutazione»
  const sort: SortKey = recipeSortFor(sortPref, isAdmin);
  const sortOptions = isAdmin ? SORT_OPTIONS : SORT_OPTIONS.filter((o) => !o.adminOnly);

  const resetPage = () => setStart(0);
  const hasActiveFilters = activeCats.length > 0 || activeTags.length > 0;
  // numero sul bottone «Filtri»: categorie + tag + visibilità (l'ordinamento non è un filtro)
  const activeCount = activeCats.length + activeTags.length + (isAdmin && publishedFilter !== "all" ? 1 : 0);

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

  // Visibilità (solo admin: i visitatori non ricevono mai le non pronte)
  const visible = useMemo(() => {
    if (isAdmin && publishedFilter === "published") return recipes.filter((r) => r.published);
    if (isAdmin && publishedFilter === "draft") return recipes.filter((r) => !r.published);
    return recipes;
  }, [recipes, isAdmin, publishedFilter]);
  // Base dei conteggi a faccette del pannello: visibilità + ricerca per nome (senza categorie e tag)
  const base = useMemo(() => {
    const lq = normalizeSearchText(q);
    return lq ? visible.filter((r) => normalizeSearchText(r.name).includes(lq)) : visible;
  }, [visible, q]);
  const facets = useMemo(() => computeFacets(base, activeCats, activeTags), [base, activeCats, activeTags]);
  // Le proposte della ricerca svuotano il testo quando si sceglie: i loro numeri sono senza il testo
  const suggestFacets = useMemo(() => computeFacets(visible, activeCats, activeTags), [visible, activeCats, activeTags]);

  const filtered = useMemo(() => {
    let list = [...base];
    if (activeCats.length) list = list.filter((r) => r.categories.some((c) => activeCats.includes(c.id)));
    if (activeTags.length) list = list.filter((r) => r.tags.some((t) => activeTags.includes(t.id)));

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
  }, [base, activeCats, activeTags, sort, order]);

  const pageSize = pageSizeFor(layout.view, layout.cols, PAGE);
  const pageCount = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(Math.floor(start / pageSize), Math.max(0, pageCount - 1));
  const paginated = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const sortLabel = sortOptions.find((o) => o.value === sort)?.label ?? "";

  const sortControls = (selectCls: string) => (
    <>
      <Select
        aria-label="Ordina per"
        value={sort}
        onChange={(e) => {
          setSort(e.target.value as SortKey);
          resetPage();
        }}
        className={selectCls}
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

  // Visibilità (admin): stesso controllo nel pannello e nella fila dei filtri attivi
  const visibilityControl = isAdmin ? (
    <Segmented
      label="Visibilità"
      value={publishedFilter}
      onChange={(v) => {
        setPublishedFilter(v);
        resetPage();
      }}
      options={PUBLISHED_OPTIONS}
    />
  ) : undefined;

  const clearFilters = () => {
    setActiveCats([]);
    setActiveTags([]);
    setPublishedFilter("all");
    resetPage();
  };

  const visibilityChip =
    isAdmin && publishedFilter !== "all" ? (
      <Chip
        icon={publishedFilter === "published" ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
        onRemove={() => {
          setPublishedFilter("all");
          resetPage();
        }}
        removeLabel="Mostra tutte, pronte e non pronte"
      >
        {publishedFilter === "published" ? "Pronte" : "Non pronte"}
      </Chip>
    ) : undefined;

  return (
    <div className="flex flex-col gap-3">
      {/* Ricerca (propone anche categorie e tag) + barra dei filtri (largo) o bottone «Filtri» (stretto) */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSearch
          value={q}
          onChange={(v) => {
            setQ(v);
            resetPage();
          }}
          categories={categories}
          tags={tags}
          facets={suggestFacets}
          activeCats={activeCats}
          activeTags={activeTags}
          onPickCat={toggleCat}
          onPickTag={toggleTag}
          className="min-w-[12rem] flex-1 basis-[16rem]"
        />
        <Button
          variant="secondary"
          icon={<SlidersHorizontal aria-hidden />}
          onClick={() => setFilterOpen(true)}
          aria-label={activeCount ? `Filtri e ordine, ${activeCount} filtri attivi` : "Filtri e ordine"}
          className={clsx("@min-[860px]:hidden", activeCount > 0 && "border-blu-800")}
        >
          <span className="hidden @min-[420px]:inline">Filtri</span>
          {activeCount > 0 && (
            <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-blu-800 px-1 text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </Button>
        {/* 4.14 · da 860px: tendine Categorie e Tag, visibilità, ordinamento */}
        <div className="hidden flex-wrap items-center gap-2 @min-[860px]:flex">
          {categories.length > 0 && (
            <FilterPopover
              label="Categorie"
              count={activeCats.length}
              widthRem={22}
              onClear={() => {
                setActiveCats([]);
                resetPage();
              }}
            >
              <CategoryChips categories={categories} facets={facets} activeCats={activeCats} onToggle={toggleCat} />
            </FilterPopover>
          )}
          {tags.length > 0 && (
            <FilterPopover
              label="Tag"
              icon={<Hash aria-hidden />}
              count={activeTags.length}
              widthRem={19}
              onClear={() => {
                setActiveTags([]);
                resetPage();
              }}
            >
              <TagChecklist tags={tags} facets={facets} activeTags={activeTags} onToggle={toggleTag} />
            </FilterPopover>
          )}
          {visibilityControl}
          <div className="flex items-center gap-2">{sortControls("w-44")}</div>
        </div>
      </div>

      <ActiveFilters
        categories={categories}
        tags={tags}
        activeCats={activeCats}
        activeTags={activeTags}
        onToggleCat={toggleCat}
        onToggleTag={toggleTag}
        extra={visibilityChip}
        onClear={clearFilters}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-xs font-semibold tracking-[0.08em] text-grigio uppercase">
          {filtered.length} ricett{filtered.length === 1 ? "a" : "e"}
          {(hasActiveFilters || q) && (filtered.length === 1 ? " trovata" : " trovate")}
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
          fallbackCols={LIST_LAYOUT.recipes.fallbackCols}
          list="stack"
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

      {/* 4.14 · contenitore stretto: le stesse sezioni in un foglio dal basso */}
      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filtri e ordine"
        size="md"
        variant="sheet"
        footer={
          <>
            {activeCount > 0 && (
              <Button variant="ghost" onClick={clearFilters}>
                Togli tutti
              </Button>
            )}
            <Button className="flex-1" onClick={() => setFilterOpen(false)}>
              Mostra {filtered.length} ricett{filtered.length === 1 ? "a" : "e"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {categories.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <FilterSectionTitle>Categorie</FilterSectionTitle>
              <CategoryChips categories={categories} facets={facets} activeCats={activeCats} onToggle={toggleCat} />
            </section>
          )}
          {tags.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <FilterSectionTitle
                aside={
                  activeTags.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveTags([]);
                        resetPage();
                      }}
                    >
                      Togli
                    </Button>
                  ) : undefined
                }
              >
                Tag{activeTags.length > 0 ? ` · ${activeTags.length} scelt${activeTags.length === 1 ? "o" : "i"}` : ""}
              </FilterSectionTitle>
              <TagChecklist
                tags={tags}
                facets={facets}
                activeTags={activeTags}
                onToggle={toggleTag}
                listClassName="max-h-[min(16rem,38dvh)]"
              />
            </section>
          )}
          {visibilityControl && (
            <section className="flex flex-col gap-1.5">
              <FilterSectionTitle>Visibilità</FilterSectionTitle>
              {visibilityControl}
            </section>
          )}
          <section className="flex flex-col gap-1.5">
            <FilterSectionTitle>Ordina per</FilterSectionTitle>
            <div className="flex gap-2">{sortControls("flex-1")}</div>
          </section>
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
