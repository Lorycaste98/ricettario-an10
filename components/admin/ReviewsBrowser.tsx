"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Star, BookOpen, UtensilsCrossed } from "lucide-react";
import { ReviewCard, type ReviewItem } from "./ReviewCard";

export interface ReviewGroup {
  id: number;
  name: string;
  avg: number;
  count: number;
  reviews: ReviewItem[];
}

type TabKey = "recipe" | "menu";

function filterGroups(groups: ReviewGroup[], q: string): ReviewGroup[] {
  if (!q) return groups;
  return groups
    .map((g) => {
      if (g.name.toLowerCase().includes(q)) return g; // match sul nome → tutte le recensioni
      const reviews = g.reviews.filter(
        (r) =>
          r.nickname.toLowerCase().includes(q) ||
          (r.comment?.toLowerCase().includes(q) ?? false)
      );
      return reviews.length ? { ...g, reviews } : null;
    })
    .filter((g): g is ReviewGroup => g !== null);
}

function countReviews(groups: ReviewGroup[]): number {
  return groups.reduce((s, g) => s + g.reviews.length, 0);
}

function GroupSection({ group, href }: { group: ReviewGroup; href: string }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href={href} className="text-base font-bold text-gray-800 transition-colors hover:text-orange-500">
          {group.name}
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <Star size={12} fill="currentColor" className="text-amber-400" />
          {group.avg.toFixed(1)}/10
          <span className="text-gray-400">
            · {group.reviews.length} recension{group.reviews.length === 1 ? "e" : "i"}
          </span>
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {group.reviews.map((rev, i) => (
          <ReviewCard key={rev.id} review={rev} index={i} />
        ))}
      </div>
    </section>
  );
}

export function ReviewsBrowser({
  recipeGroups,
  menuGroups,
}: {
  recipeGroups: ReviewGroup[];
  menuGroups: ReviewGroup[];
}) {
  const [tab, setTab] = useState<TabKey>("recipe");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const recipes = useMemo(() => filterGroups(recipeGroups, q), [recipeGroups, q]);
  const menus = useMemo(() => filterGroups(menuGroups, q), [menuGroups, q]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "recipe", label: "Ricette", icon: <BookOpen size={15} />, count: countReviews(recipes) },
    { key: "menu", label: "Menù", icon: <UtensilsCrossed size={15} />, count: countReviews(menus) },
  ];

  const active = tab === "recipe" ? recipes : menus;
  const href = (id: number) => (tab === "recipe" ? `/ricette/${id}` : `/menu/${id}`);

  return (
    <div className="space-y-6">
      {/* Switcher animato ricette / menù */}
      <div className="relative grid grid-cols-2 gap-1 rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
        {/* indicatore scorrevole */}
        <span
          className="absolute inset-y-1 left-1 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 shadow-sm shadow-rose-500/30 transition-transform duration-300 ease-out"
          style={{ width: "calc(50% - 0.375rem)", transform: tab === "menu" ? "translateX(calc(100% + 0.25rem))" : "translateX(0)" }}
        />
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`relative z-10 flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-colors duration-200 ${
              tab === t.key ? "text-white" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.icon}
            {t.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold transition-colors duration-200 ${
                tab === t.key ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Barra di ricerca */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nome, autore o testo…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300/30"
        />
      </div>

      {/* Contenuto della tab attiva — `key` forza il replay dell'animazione al cambio */}
      <div key={`${tab}-${q}`} className="fade-up space-y-6">
        {active.length === 0 ? (
          <p className="text-sm text-gray-400">
            {q
              ? `Nessuna recensione corrisponde a «${query.trim()}».`
              : `Nessuna recensione ${tab === "recipe" ? "per le ricette" : "per i menù"}.`}
          </p>
        ) : (
          active.map((g) => <GroupSection key={`${tab}-${g.id}`} group={g} href={href(g.id)} />)
        )}
      </div>
    </div>
  );
}
