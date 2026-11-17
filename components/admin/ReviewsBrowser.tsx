"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, ChevronRight, NotebookPen, SearchX } from "lucide-react";
import { EmptyState } from "@/components/ds/Feedback";
import { SearchableSelect, type SelectOption } from "@/components/ui/SearchableSelect";
import { SearchField } from "@/components/ds/Field";
import { Segmented } from "@/components/ds/Controls";
import { GuestRatingTag } from "@/components/ds/Tag";
import { ClocheIcon } from "@/components/icons";
import { ConfirmModal } from "@/components/ui/Modal";
import { ReviewMiniCard, type AdminReview } from "@/components/admin/ReviewMiniCard";

type GroupBy = "recipe" | "menu" | "date" | "none";

const NO_MENU = "__none__"; // chiave gruppo/opzione per le note personali (menu null)

// Giorno locale YYYY-MM-DD (le card sono client-side: coerente con ciò che vede l'admin)
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

function avgOf(reviews: AdminReview[]): number {
  return reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
}

interface Group {
  key: string;
  title: string;
  href: string | null;
  /** Icona del tipo di gruppo. */
  kind: GroupBy;
  reviews: AdminReview[];
}

function buildGroups(reviews: AdminReview[], groupBy: GroupBy): Group[] {
  if (groupBy === "none") {
    return reviews.length ? [{ key: "all", title: "", href: null, kind: "none", reviews }] : [];
  }
  const map = new Map<string, Group>();
  for (const r of reviews) {
    let key: string, title: string, href: string | null, kind: GroupBy;
    if (groupBy === "recipe") {
      key = `r${r.recipe.id}`;
      title = r.recipe.name;
      href = r.recipe.quick ? null : `/ricette/${r.recipe.id}`;
      kind = "recipe";
    } else if (groupBy === "menu") {
      key = r.menu ? `m${r.menu.id}` : NO_MENU;
      title = r.menu ? r.menu.name : "Note personali";
      href = r.menu ? `/menu/${r.menu.id}` : null;
      kind = "menu";
    } else {
      key = dayKey(r.createdAt);
      title = dayLabel(r.createdAt);
      href = null;
      kind = "date";
    }
    let g = map.get(key);
    if (!g) {
      g = { key, title, href, kind, reviews: [] };
      map.set(key, g);
    }
    g.reviews.push(r);
  }
  // Ordina i gruppi per recensione più recente (le review dentro sono già desc)
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.reviews[0].createdAt).getTime() - new Date(a.reviews[0].createdAt).getTime()
  );
}

const GROUP_LABELS: { key: GroupBy; label: string }[] = [
  { key: "recipe", label: "Ricetta" },
  { key: "menu", label: "Menù" },
  { key: "date", label: "Data" },
  { key: "none", label: "Nessuno" },
];

export function ReviewsBrowser({ reviews: allReviews }: { reviews: AdminReview[] }) {
  const [reviews, setReviews] = useState(allReviews);
  const [search, setSearch] = useState("");
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("recipe");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Opzioni dei filtri, derivate dalla lista completa (con conteggi)
  const { recipeOptions, menuOptions, dateOptions } = useMemo(() => {
    const recipes = new Map<string, SelectOption>();
    const menus = new Map<string, SelectOption>();
    const dates = new Map<string, { label: string; count: number; iso: string }>();
    for (const r of reviews) {
      const rk = String(r.recipe.id);
      recipes.set(rk, { value: rk, label: r.recipe.name, count: (recipes.get(rk)?.count ?? 0) + 1 });
      const mk = r.menu ? String(r.menu.id) : NO_MENU;
      const mlabel = r.menu ? r.menu.name : "Note personali (senza menù)";
      menus.set(mk, { value: mk, label: mlabel, count: (menus.get(mk)?.count ?? 0) + 1 });
      const dk = dayKey(r.createdAt);
      const prev = dates.get(dk);
      dates.set(dk, { label: dayLabel(r.createdAt), count: (prev?.count ?? 0) + 1, iso: r.createdAt });
    }
    const byLabel = (a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label, "it");
    return {
      recipeOptions: Array.from(recipes.values()).sort(byLabel),
      menuOptions: Array.from(menus.values()).sort(byLabel),
      dateOptions: Array.from(dates.entries())
        .sort((a, b) => new Date(b[1].iso).getTime() - new Date(a[1].iso).getTime())
        .map(([value, d]): SelectOption => ({ value, label: `${d.label} · ${d.count}` })),
    };
  }, [reviews]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      reviews.filter((r) => {
        if (recipeId && String(r.recipe.id) !== recipeId) return false;
        if (menuId && (r.menu ? String(r.menu.id) : NO_MENU) !== menuId) return false;
        if (dateFilter && dayKey(r.createdAt) !== dateFilter) return false;
        if (q) {
          const hay = `${r.nickname} ${r.comment ?? ""} ${r.recipe.name} ${r.menu?.name ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }),
    [reviews, recipeId, menuId, dateFilter, q]
  );

  const groups = useMemo(() => buildGroups(filtered, groupBy), [filtered, groupBy]);
  const hasFilters = !!(q || recipeId || menuId || dateFilter);

  const deleteReview = async (id: number) => {
    setDeleting(true);
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeleting(false);
    setConfirmId(null);
  };

  const toggle = (key: string) =>
    setCollapsed((c) => {
      const next = new Set(c);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const resetFilters = () => {
    setSearch("");
    setRecipeId(null);
    setMenuId(null);
    setDateFilter(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 12.7 · filtri */}
      <SearchField value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca testo o autore" aria-label="Cerca nelle recensioni" />
      <div className="flex flex-wrap items-center gap-1.5">
        <SearchableSelect label="Ricetta" options={recipeOptions} value={recipeId} onChange={setRecipeId} placeholder="Tutte le ricette" searchPlaceholder="Cerca ricetta…" />
        <SearchableSelect label="Menù" options={menuOptions} value={menuId} onChange={setMenuId} placeholder="Tutti i menù" searchPlaceholder="Cerca menù…" />
        <SearchableSelect label="Data" options={dateOptions} value={dateFilter} onChange={setDateFilter} placeholder="Tutte le date" searchPlaceholder="Cerca data…" />
        {hasFilters && (
          <button type="button" onClick={resetFilters} className="ml-auto rounded-[0.5rem] px-2 py-1 text-[0.875rem] font-semibold text-blu-600 hover:bg-blu-100">
            Azzera filtri
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-[0.8125rem] font-semibold text-grigio">Raggruppa per</span>
        <Segmented<GroupBy>
          label="Raggruppa per"
          value={groupBy}
          onChange={setGroupBy}
          options={GROUP_LABELS.map((g) => ({ value: g.key, label: g.label }))}
          className="min-w-0 flex-1 @min-[620px]:max-w-md"
        />
      </div>

      <p className="text-(length:--fs-meta) text-grigio">
        {filtered.length} recension{filtered.length === 1 ? "e" : "i"}
        {hasFilters ? " con questi filtri" : ""}
      </p>

      {groups.length === 0 ? (
        <EmptyState icon={<SearchX />} title="Nessuna recensione con questi filtri">
          Prova a togliere un filtro o a cercare un altro nome.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-2.5">
          {groups.map((g) => {
            const isCollapsed = collapsed.has(g.key);
            const grid = (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-2.5">
                {g.reviews.map((r) => (
                  <ReviewMiniCard
                    key={r.id}
                    review={r}
                    showRecipe={groupBy !== "recipe"}
                    showMenu={groupBy !== "menu"}
                    onDelete={() => setConfirmId(r.id)}
                  />
                ))}
              </div>
            );
            if (groupBy === "none") return <div key={g.key}>{grid}</div>;
            return (
              // 12.8 · gruppo apribile
              <section key={g.key} className="overflow-hidden rounded-card border border-blu-150 bg-white">
                <div className="flex min-h-12 items-center gap-2 pr-3">
                  <button
                    type="button"
                    onClick={() => toggle(g.key)}
                    aria-expanded={!isCollapsed}
                    aria-label={`${isCollapsed ? "Apri" : "Chiudi"} ${g.title}`}
                    className="flex h-12 shrink-0 items-center gap-2 pl-3 text-grigio"
                  >
                    <ChevronRight className={`size-4 transition-transform ${isCollapsed ? "" : "rotate-90"}`} aria-hidden />
                    <GroupIcon kind={g.kind} hasMenu={g.key !== NO_MENU} />
                  </button>
                  {g.href ? (
                    <Link href={g.href} className="min-w-0 flex-1 truncate font-bold hover:underline">
                      {g.title}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => toggle(g.key)} className="min-w-0 flex-1 truncate text-left font-bold">
                      {g.title}
                    </button>
                  )}
                  <GuestRatingTag value={avgOf(g.reviews)} count={g.reviews.length} />
                </div>
                {!isCollapsed && <div className="border-t border-blu-150 bg-adm-50 p-2.5">{grid}</div>}
              </section>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteReview(confirmId)}
        title="Eliminare la recensione?"
        message="Sparisce anche dalla media della ricetta e del menù. L'azione è irreversibile."
        loading={deleting}
      />
    </div>
  );
}

function GroupIcon({ kind, hasMenu }: { kind: GroupBy; hasMenu: boolean }) {
  if (kind === "recipe") return <BookOpen className="size-4 shrink-0 text-area-ricette" aria-hidden />;
  if (kind === "date") return <CalendarDays className="size-4 shrink-0" aria-hidden />;
  if (kind === "menu")
    return hasMenu ? <ClocheIcon className="size-4 shrink-0 text-area-menu" aria-hidden /> : <NotebookPen className="size-4 shrink-0" aria-hidden />;
  return null;
}
