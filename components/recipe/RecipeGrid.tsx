"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import ReactPaginate from "react-paginate";
import { clsx } from "clsx";
import { SlidersHorizontal, X, Plus, ArrowUpDown, Search, ChevronDown, Tag as TagIcon } from "lucide-react";
import { RecipeCard } from "./RecipeCard";
import { type RecipeSummary, type Category, type Tag } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

const PAGE_SIZE = 20;

interface Props {
  recipes: RecipeSummary[];
  categories: Category[];
  tags: Tag[];
}

type SortKey = "createdAt" | "name" | "prep" | "cook" | "cookCount";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt", label: "Data" },
  { value: "name", label: "Nome" },
  { value: "prep", label: "Tempo prep" },
  { value: "cook", label: "Cottura" },
  { value: "cookCount", label: "Volte cotta" },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RecipeGrid({ recipes, categories, tags: _tags }: Props) {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const [activeCats, setActiveCats] = useState<number[]>([]);
  const [activeTags] = useState<number[]>([]);
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [pendingCats, setPendingCats] = useState<number[]>([]);

  const resetPage = () => setPage(0);
  const isFilterActive = sort !== "createdAt" || order !== "desc";

  const toggleCat = (id: number) => {
    setActiveCats((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    resetPage();
  };

  const openCatDropdown = () => {
    setPendingCats(activeCats);
    setCatDropdownOpen(true);
  };

  const confirmCats = () => {
    setActiveCats(pendingCats);
    setCatDropdownOpen(false);
    resetPage();
  };

  const togglePendingCat = (id: number) => {
    setPendingCats((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const filtered = useMemo(() => {
    let list = [...recipes];
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(lq));
    }
    if (activeCats.length)
      list = list.filter((r) => r.categories.some((c) => activeCats.includes(c.id)));
    if (activeTags.length)
      list = list.filter((r) => r.tags.some((t) => activeTags.includes(t.id)));

    list.sort((a, b) => {
      const av = sort === "name" ? a.name : (a[sort] ?? 0);
      const bv = sort === "name" ? b.name : (b[sort] ?? 0);
      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [recipes, q, activeCats, activeTags, sort, order]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const paginated = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggleOrder = () => { setOrder((o) => (o === "asc" ? "desc" : "asc")); resetPage(); };

  return (
    <div className="space-y-5">
      {/* ── Toolbar ── */}
      <div className="flex gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-600 pointer-events-none z-10" />
          <input
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); resetPage(); }}
            placeholder="Cerca ricette..."
            className="w-full h-9 rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm pl-9 pr-4 text-sm text-sky-950 placeholder:text-sky-600/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/30"
          />
        </div>

        {/* Mobile: pulsante filtri */}
        <button
          onClick={() => setFilterOpen(true)}
          className={clsx(
            "relative sm:hidden flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors",
            isFilterActive || activeCats.length > 0
              ? "border-orange-400 bg-orange-100/60 text-orange-700"
              : "border-white/40 bg-white/60 text-sky-800 hover:bg-white/80"
          )}
          title="Filtri e ordinamento"
        >
          <SlidersHorizontal size={16} />
          {(isFilterActive || activeCats.length > 0) && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange-500 border-2 border-white" />
          )}
        </button>

        {/* Desktop: categorie dropdown + sort + order */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {/* Categorie dropdown */}
          {categories.length > 0 && (
            <div className="relative">
              <button
                onClick={openCatDropdown}
                className={clsx(
                  "flex items-center gap-1.5 h-9 rounded-lg border backdrop-blur-sm px-3 text-sm transition-colors",
                  activeCats.length > 0
                    ? "border-orange-400 bg-orange-100/60 text-orange-700"
                    : "border-white/40 bg-white/60 text-sky-800 hover:bg-white/80"
                )}
              >
                <TagIcon size={14} />
                Categorie
                {activeCats.length > 0 && (
                  <span className="ml-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0 leading-4">
                    {activeCats.length}
                  </span>
                )}
                <ChevronDown size={13} />
              </button>

              {catDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setCatDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-10 z-20 w-64 rounded-xl border border-white/40 bg-white/95 backdrop-blur-xl shadow-xl p-3 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => togglePendingCat(c.id)}
                          className={clsx(
                            "shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all",
                            pendingCats.includes(c.id)
                              ? "border-transparent text-white shadow-sm"
                              : "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100"
                          )}
                          style={pendingCats.includes(c.id) ? { backgroundColor: c.color, borderColor: c.color } : {}}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1 border-t border-sky-100">
                      <button
                        onClick={() => { setPendingCats([]); }}
                        className="flex-1 rounded-lg border border-sky-200 py-1.5 text-xs text-sky-700 hover:bg-sky-50 transition-colors"
                      >
                        Cancella
                      </button>
                      <button
                        onClick={confirmCats}
                        className="flex-1 rounded-lg bg-sky-950 py-1.5 text-xs font-semibold text-white hover:bg-sky-900 transition-colors"
                      >
                        Conferma
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as SortKey); resetPage(); }}
            className="h-9 rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm px-3 text-sm text-sky-950 focus:border-sky-400 focus:outline-none"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={toggleOrder}
            className="h-9 w-9 rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm text-sky-800 hover:bg-white/80 transition-colors"
            title={order === "asc" ? "Crescente" : "Decrescente"}
          >
            {order === "asc" ? "↑" : "↓"}
          </button>
        </div>

        {/* Nuova ricetta — visibile sempre se admin */}
        {isAdmin && (
          <Link
            href="/admin/ricette/nuova"
            className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-orange-500 px-3 text-sm font-medium text-white hover:bg-orange-600 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Nuova</span>
          </Link>
        )}
      </div>

      {/* Active category pills */}
      {activeCats.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categories
            .filter((c) => activeCats.includes(c.id))
            .map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white shadow-sm"
                style={{ backgroundColor: c.color }}
              >
                {c.name}
                <button
                  onClick={() => toggleCat(c.id)}
                  className="ml-0.5 opacity-70 hover:opacity-100"
                  aria-label={`Rimuovi ${c.name}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          <button
            onClick={() => { setActiveCats([]); resetPage(); }}
            className="inline-flex items-center rounded-full border border-dashed border-white/50 px-2.5 py-0.5 text-[11px] text-sky-200 hover:bg-white/10 transition-colors"
          >
            × Cancella tutto
          </button>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm font-medium text-sky-950 [text-shadow:0_1px_3px_rgba(255,255,255,0.6)]">
        {filtered.length} ricett{filtered.length === 1 ? "a" : "e"}
        {(activeCats.length > 0 || activeTags.length > 0 || q) && " trovate"}
        {pageCount > 1 && (
          <span className="ml-2 opacity-70">— pagina {safePage + 1} di {pageCount}</span>
        )}
      </p>

      {/* Grid */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-5xl">🔍</span>
          <p className="font-medium text-sky-950 [text-shadow:0_1px_3px_rgba(255,255,255,0.6)]">Nessuna ricetta trovata</p>
          {(q || activeCats.length > 0) && (
            <button
              onClick={() => { setQ(""); setActiveCats([]); resetPage(); }}
              className="text-sm font-semibold text-orange-700 hover:underline [text-shadow:0_1px_2px_rgba(255,255,255,0.5)]"
            >
              Rimuovi filtri
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <ReactPaginate
          pageCount={pageCount}
          forcePage={safePage}
          onPageChange={({ selected }) => { setPage(selected); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          pageRangeDisplayed={3}
          marginPagesDisplayed={1}
          previousLabel="‹"
          nextLabel="›"
          breakLabel="…"
          containerClassName="flex items-center justify-center gap-1 pt-4"
          pageLinkClassName="flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 bg-white/50 backdrop-blur-sm text-sm text-sky-900 hover:bg-white/70 transition-colors"
          activeLinkClassName="!bg-orange-500 !border-orange-500 !text-white font-semibold"
          previousLinkClassName="flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 bg-white/50 backdrop-blur-sm text-sky-800 hover:bg-white/70 transition-colors"
          nextLinkClassName="flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 bg-white/50 backdrop-blur-sm text-sky-800 hover:bg-white/70 transition-colors"
          breakLinkClassName="flex h-9 w-9 items-center justify-center text-sky-700 text-sm"
          disabledClassName="opacity-40 cursor-not-allowed"
        />
      )}

      {/* ── Filter Bottom Sheet (mobile only) ── */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:hidden"
          onClick={() => setFilterOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="relative w-full rounded-t-3xl bg-white/95 backdrop-blur-xl border-t border-white/40 p-6 space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle + header */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-sky-200" />
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sky-950 font-bold text-lg">
                <ArrowUpDown size={18} />
                Ordina e filtra
              </div>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">Categorie</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => toggleCat(c.id)}
                      className={clsx(
                        "shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all",
                        activeCats.includes(c.id)
                          ? "border-transparent text-white shadow-sm"
                          : "border-sky-200 bg-sky-50 text-sky-900"
                      )}
                      style={activeCats.includes(c.id) ? { backgroundColor: c.color, borderColor: c.color } : {}}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">Ordina per</p>
              <div className="grid grid-cols-2 gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); resetPage(); }}
                    className={clsx(
                      "rounded-xl border px-4 py-2.5 text-sm font-medium text-left transition-all",
                      sort === opt.value
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-sky-100 bg-sky-50/50 text-sky-900"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Order */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">Direzione</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setOrder("desc"); resetPage(); }}
                  className={clsx(
                    "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all",
                    order === "desc"
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-sky-100 bg-sky-50/50 text-sky-900"
                  )}
                >
                  ↓ Decrescente
                </button>
                <button
                  onClick={() => { setOrder("asc"); resetPage(); }}
                  className={clsx(
                    "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all",
                    order === "asc"
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-sky-100 bg-sky-50/50 text-sky-900"
                  )}
                >
                  ↑ Crescente
                </button>
              </div>
            </div>

            {/* Applica */}
            <button
              onClick={() => setFilterOpen(false)}
              className="w-full rounded-xl bg-sky-950 text-white py-3 font-semibold text-sm hover:bg-sky-900 transition-colors"
            >
              Applica
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
