"use client";
/**
 * Lista menù (restyle fase 4, schermata `docs/design/schermate/2-menu`). Logica invariata
 * (ricerca, visibilità admin, ordinamento, filtri per scheda, paginazione); interfaccia gemella
 * della libreria ricette: ricerca 4.5, «Ordina e filtra» su contenitore stretto, griglia di card 8.5.
 */
import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import ReactPaginate from "react-paginate";
import { clsx } from "clsx";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Search, SlidersHorizontal } from "lucide-react";
import { MenuCard } from "./MenuCard";
import { Modal } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ds/Button";
import { SearchField, Select } from "@/components/ds/Field";
import { Segmented } from "@/components/ds/Controls";
import { EmptyState } from "@/components/ds/Feedback";
import { type MenuSummary } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { useLocalStore } from "@/lib/local-store";

const PAGE_SIZE = 12;

type SortKey = "date" | "createdAt" | "name";
type PublishedFilter = "all" | "published" | "draft";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date", label: "Data servizio" },
  { value: "createdAt", label: "Data creazione" },
  { value: "name", label: "Nome" },
];

const PUBLISHED_OPTIONS: { value: PublishedFilter; label: string; icon?: ReactNode }[] = [
  { value: "all", label: "Tutti" },
  { value: "published", label: "Pronti", icon: <Eye aria-hidden /> },
  { value: "draft", label: "Non pronti", icon: <EyeOff aria-hidden /> },
];

// Persistenza filtri: restano salvati anche tornando indietro dalla pagina di dettaglio
const K = "ricettario:menu-list:";
const parseStr = (raw: string): string => {
  const v = JSON.parse(raw);
  return typeof v === "string" ? v : "";
};
const parseSort = (raw: string): SortKey => {
  const v = JSON.parse(raw);
  return v === "name" || v === "createdAt" ? v : "date";
};
// Default: dalla più vecchia alla più recente (crescente)
const parseOrder = (raw: string): "asc" | "desc" => (JSON.parse(raw) === "desc" ? "desc" : "asc");
const parsePublished = (raw: string): PublishedFilter => {
  const v = JSON.parse(raw);
  return v === "published" || v === "draft" ? v : "all";
};
const parsePage = (raw: string): number => {
  const v = JSON.parse(raw);
  return Number.isInteger(v) && v >= 0 ? v : 0;
};

interface Props {
  menus: MenuSummary[];
}

export function MenuGrid({ menus }: Props) {
  const { isAdmin } = useAuth();
  // Filtri per-scheda: persistono durante la navigazione ma si azzerano alla chiusura scheda
  const [q, setQ] = useLocalStore<string>(K + "q", "", parseStr, undefined, "session");
  const [sort, setSort] = useLocalStore<SortKey>(K + "sort", "date", parseSort, undefined, "session");
  const [order, setOrder] = useLocalStore<"asc" | "desc">(K + "order", "asc", parseOrder, undefined, "session");
  const [publishedFilter, setPublishedFilter] = useLocalStore<PublishedFilter>(
    K + "published",
    "all",
    parsePublished,
    undefined,
    "session"
  );
  const [page, setPage] = useLocalStore<number>(K + "page", 0, parsePage, undefined, "session");
  const [filterOpen, setFilterOpen] = useState(false);
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "";

  const resetPage = () => setPage(0);
  const isFilterActive =
    sort !== "date" || order !== "asc" || (isAdmin && publishedFilter !== "all");

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
    // Visibilità (solo admin: i visitatori non ricevono mai i menù non pronti)
    if (isAdmin && publishedFilter === "published") list = list.filter((m) => m.published);
    else if (isAdmin && publishedFilter === "draft") list = list.filter((m) => !m.published);

    list.sort((a, b) => {
      // I menù senza data di servizio finiscono sempre in fondo, in entrambe le direzioni
      if (sort === "date") {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
      }
      const av = sort === "name" ? a.name : (a[sort] ?? "");
      const bv = sort === "name" ? b.name : (b[sort] ?? "");
      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [menus, q, sort, order, isAdmin, publishedFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const paginated = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggleOrder = () => {
    setOrder(order === "asc" ? "desc" : "asc");
    resetPage();
  };

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
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <IconButton
        shape="square"
        label={order === "asc" ? "Crescente: tocca per decrescente" : "Decrescente: tocca per crescente"}
        onClick={toggleOrder}
      >
        {order === "asc" ? <ArrowUp /> : <ArrowDown />}
      </IconButton>
    </>
  );

  const visibility = isAdmin && (
    <Segmented
      label="Visibilità"
      value={publishedFilter}
      onChange={(v) => {
        setPublishedFilter(v);
        resetPage();
      }}
      options={PUBLISHED_OPTIONS}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SearchField
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            resetPage();
          }}
          placeholder="Cerca menù…"
          aria-label="Cerca menù"
          className="flex-1"
        />
        <IconButton
          shape="square"
          label="Ordina e filtra"
          onClick={() => setFilterOpen(true)}
          className={clsx("@min-[860px]:hidden", isFilterActive && "border-arancio text-arancio")}
        >
          <SlidersHorizontal />
        </IconButton>
        <div className="hidden items-center gap-2 @min-[860px]:flex">
          {visibility}
          {sortControls}
        </div>
      </div>

      <p className="text-xs font-semibold tracking-[0.08em] text-grigio uppercase">
        {q ? `${filtered.length} menù trovati` : "Tutti i menù"} · per {sortLabel.toLowerCase()}
        {pageCount > 1 && ` · pagina ${safePage + 1} di ${pageCount}`}
      </p>

      {paginated.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(15rem,30cqi,20rem),1fr))] gap-(--gap)">
          {paginated.map((m) => (
            <MenuCard key={m.id} menu={m} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search />}
          title="Nessun menù trovato"
          action={
            (q || (isAdmin && publishedFilter !== "all")) && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setQ("");
                  setPublishedFilter("all");
                  resetPage();
                }}
              >
                Togli i filtri
              </Button>
            )
          }
        />
      )}

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

      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Ordina e filtra" size="sm">
        <div className="flex flex-col gap-4">
          {isAdmin && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[0.8125rem] font-semibold text-grigio">Visibilità</p>
              {visibility}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <p className="text-[0.8125rem] font-semibold text-grigio">Ordina per</p>
            <div className="flex gap-2">{sortControls}</div>
          </div>
          <Button onClick={() => setFilterOpen(false)}>Mostra {filtered.length} menù</Button>
        </div>
      </Modal>
    </div>
  );
}

/** Bottone «Nuovo menù» della testata (solo admin): pieno da contenitore largo, «Nuovo» su stretto */
export function NewMenuLink() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return (
    <Link
      href="/admin/menu/nuovo"
      className="inline-flex h-(--h-btn) items-center justify-center gap-[0.45em] rounded-ctl bg-arancio-pieno px-[1.05em] font-semibold text-white hover:bg-arancio-scuro [&_svg]:size-[1.15em]"
    >
      <Plus aria-hidden />
      <span className="hidden @min-[620px]:inline">Nuovo menù</span>
      <span className="@min-[620px]:hidden">Nuovo</span>
    </Link>
  );
}
