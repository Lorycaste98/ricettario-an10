"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import Link from "next/link";
import ReactPaginate from "react-paginate";
import { clsx } from "clsx";
import { Search, Plus, ArrowUpDown, X } from "lucide-react";
import { MenuCard } from "./MenuCard";
import { type MenuSummary } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

const PAGE_SIZE = 12;

type SortKey = "createdAt" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt", label: "Data" },
  { value: "name", label: "Nome" },
];

interface Props {
  menus: MenuSummary[];
}

export function MenuGrid({ menus }: Props) {
  const { isAdmin } = useAuth();
  const reduceMotion = useReducedMotion();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const resetPage = () => setPage(0);
  const isFilterActive = sort !== "createdAt" || order !== "desc";

  const filtered = useMemo(() => {
    let list = [...menus];
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(lq) ||
          (m.description && m.description.toLowerCase().includes(lq))
      );
    }

    list.sort((a, b) => {
      const av = sort === "name" ? a.name : a[sort];
      const bv = sort === "name" ? b.name : b[sort];
      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [menus, q, sort, order]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const paginated = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggleOrder = () => {
    setOrder((o) => (o === "asc" ? "desc" : "asc"));
    resetPage();
  };

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
            onChange={(e) => {
              setQ(e.target.value);
              resetPage();
            }}
            placeholder="Cerca menù..."
            className="w-full h-9 rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm pl-9 pr-4 text-sm text-sky-950 placeholder:text-sky-600/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/30"
          />
        </div>

        {/* Mobile: filter button */}
        <button
          onClick={() => setFilterOpen(true)}
          className={clsx(
            "relative sm:hidden flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors",
            isFilterActive
              ? "border-orange-400 bg-orange-100/60 text-orange-700"
              : "border-white/40 bg-white/60 text-sky-800 hover:bg-white/80"
          )}
          title="Ordina"
        >
          <ArrowUpDown size={16} />
          {isFilterActive && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange-500 border-2 border-white" />
          )}
        </button>

        {/* Desktop: sort + order */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              resetPage();
            }}
            className="h-9 rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm px-3 text-sm text-sky-950 focus:border-sky-400 focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={toggleOrder}
            className="h-9 w-9 rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm text-sky-800 hover:bg-white/80 transition-colors"
            title={order === "asc" ? "Crescente" : "Decrescente"}
          >
            {order === "asc" ? "↑" : "↓"}
          </button>
        </div>

        {/* Aggiungi menù — visibile se admin */}
        {isAdmin && (
          <Link
            href="/admin/menu/nuovo"
            className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-orange-500 px-3 text-sm font-medium text-white hover:bg-orange-600 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Nuovo</span>
          </Link>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm font-medium text-sky-950 [text-shadow:0_1px_3px_rgba(255,255,255,0.6)]">
        {filtered.length} menù
        {q && " trovati"}
        {pageCount > 1 && (
          <span className="ml-2 opacity-70">
            — pagina {safePage + 1} di {pageCount}
          </span>
        )}
      </p>

      {/* Grid */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {paginated.map((m) => (
            <MenuCard key={m.id} menu={m} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/20 bg-white/20 backdrop-blur-sm py-20">
          <span className="text-5xl">🔍</span>
          <p className="font-medium text-sky-950 [text-shadow:0_1px_3px_rgba(255,255,255,0.6)]">
            Nessun menù trovato
          </p>
          {q && (
            <button
              onClick={() => {
                setQ("");
                resetPage();
              }}
              className="text-sm font-semibold text-orange-700 hover:underline"
            >
              Rimuovi filtri
            </button>
          )}
        </div>
      )}

      {/* Pagination — only when more than PAGE_SIZE items */}
      {pageCount > 1 && (
        <ReactPaginate
          pageCount={pageCount}
          forcePage={safePage}
          onPageChange={({ selected }) => {
            setPage(selected);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
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
      <AnimatePresence>
        {filterOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:hidden"
            onClick={() => setFilterOpen(false)}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />
            <motion.div
              className="relative flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-white/95 backdrop-blur-xl border-t border-white/40 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
              transition={{ type: "tween", duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            >
              {/* Handle + header */}
              <div className="shrink-0 px-6 pt-6">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-sky-200" />
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sky-950 font-bold text-lg">
                    <ArrowUpDown size={18} />
                    Ordina
                  </div>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-6">
                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">
                    Ordina per
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSort(opt.value);
                          resetPage();
                        }}
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

                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">
                    Direzione
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setOrder("desc");
                        resetPage();
                      }}
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
                      onClick={() => {
                        setOrder("asc");
                        resetPage();
                      }}
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
              </div>

              {/* Applica */}
              <div className="shrink-0 px-6 pb-6 pt-2">
                <button
                  onClick={() => setFilterOpen(false)}
                  className="w-full rounded-xl bg-sky-950 text-white py-3 font-semibold text-sm hover:bg-sky-900 transition-colors"
                >
                  Applica
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
