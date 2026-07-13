"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Star, BookOpen, UtensilsCrossed, CalendarDays, ChevronRight, NotebookPen } from "lucide-react";
import { SearchableSelect, type SelectOption } from "@/components/ui/SearchableSelect";
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
    <div className="space-y-5">
      {/* Toolbar filtri */}
      <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per autore o testo del commento…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300/30"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <SearchableSelect
            options={recipeOptions}
            value={recipeId}
            onChange={setRecipeId}
            placeholder="Tutte le ricette"
            searchPlaceholder="Cerca ricetta…"
            icon={<BookOpen size={15} />}
          />
          <SearchableSelect
            options={menuOptions}
            value={menuId}
            onChange={setMenuId}
            placeholder="Tutti i menù"
            searchPlaceholder="Cerca menù…"
            icon={<UtensilsCrossed size={15} />}
          />
          <SearchableSelect
            options={dateOptions}
            value={dateFilter}
            onChange={setDateFilter}
            placeholder="Tutte le date"
            searchPlaceholder="Cerca data…"
            icon={<CalendarDays size={15} />}
          />
        </div>

        {/* Raggruppa per */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Raggruppa per:</span>
          <div className="flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1">
            {GROUP_LABELS.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setGroupBy(g.key)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  groupBy === g.key ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto text-xs font-semibold text-gray-400 transition-colors hover:text-orange-600"
            >
              Azzera filtri
            </button>
          )}
        </div>
      </div>

      {/* Risultati */}
      <p className="text-xs text-gray-400">
        {filtered.length} recension{filtered.length === 1 ? "e" : "i"}
        {hasFilters ? " (filtrate)" : ""}
      </p>

      {groups.length === 0 ? (
        <p className="text-sm text-gray-400">Nessuna recensione corrisponde ai filtri.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const isCollapsed = collapsed.has(g.key);
            const avg = avgOf(g.reviews);
            return (
              <section key={g.key} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                {groupBy !== "none" && (
                  <button
                    type="button"
                    onClick={() => toggle(g.key)}
                    className="mb-3 flex w-full items-center gap-2 text-left"
                  >
                    <ChevronRight
                      size={16}
                      className={`shrink-0 text-gray-400 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                    />
                    <GroupIcon kind={g.kind} hasMenu={g.key !== NO_MENU} />
                    {g.href ? (
                      <Link
                        href={g.href}
                        onClick={(e) => e.stopPropagation()}
                        className="min-w-0 truncate text-base font-bold text-gray-800 transition-colors hover:text-orange-500"
                      >
                        {g.title}
                      </Link>
                    ) : (
                      <span className="min-w-0 truncate text-base font-bold text-gray-800">{g.title}</span>
                    )}
                    <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <Star size={12} fill="currentColor" className="text-amber-400" />
                      {avg.toFixed(1)}/10
                      <span className="text-gray-400">· {g.reviews.length}</span>
                    </span>
                  </button>
                )}
                {!isCollapsed && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                )}
              </section>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteReview(confirmId)}
        title="Elimina recensione"
        message="Sei sicuro di voler eliminare questa recensione?"
        loading={deleting}
      />
    </div>
  );
}

function GroupIcon({ kind, hasMenu }: { kind: GroupBy; hasMenu: boolean }) {
  const cls = "shrink-0 text-gray-400";
  if (kind === "recipe") return <BookOpen size={15} className={cls} />;
  if (kind === "date") return <CalendarDays size={15} className={cls} />;
  if (kind === "menu") return hasMenu ? <UtensilsCrossed size={15} className={cls} /> : <NotebookPen size={15} className={cls} />;
  return null;
}
