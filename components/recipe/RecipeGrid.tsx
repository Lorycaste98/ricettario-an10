"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { RecipeCard } from "./RecipeCard";
import { type RecipeSummary, type Category, type Tag } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

interface Props {
  recipes: RecipeSummary[];
  categories: Category[];
  tags: Tag[];
}

type SortKey = "createdAt" | "name" | "prep" | "cook" | "cookCount";

export function RecipeGrid({ recipes, categories, tags }: Props) {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const [activeCats, setActiveCats] = useState<number[]>([]);
  const [activeTags, setActiveTags] = useState<number[]>([]);
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const toggleCat = (id: number) =>
    setActiveCats((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleTag = (id: number) =>
    setActiveTags((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

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

  const toggleOrder = () => setOrder((o) => (o === "asc" ? "desc" : "asc"));

  return (
    <div className="space-y-6">
      {/* Search + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca ricette..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
          >
            <option value="createdAt">Data</option>
            <option value="name">Nome</option>
            <option value="prep">Tempo prep</option>
            <option value="cook">Tempo cottura</option>
            <option value="cookCount">Volte cotta</option>
          </select>
          <button
            onClick={toggleOrder}
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50"
            title={order === "asc" ? "Crescente" : "Decrescente"}
          >
            {order === "asc" ? "↑" : "↓"}
          </button>
          {isAdmin && (
            <Link
              href="/admin/ricette/nuova"
              className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors whitespace-nowrap"
            >
              + Nuova
            </Link>
          )}
        </div>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => toggleCat(c.id)}
              className={clsx(
                "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                activeCats.includes(c.id)
                  ? "border-transparent text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              )}
              style={
                activeCats.includes(c.id)
                  ? { backgroundColor: c.color, borderColor: c.color }
                  : {}
              }
            >
              {c.name}
            </button>
          ))}
          {activeCats.length > 0 && (
            <button onClick={() => setActiveCats([])} className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-400 hover:border-gray-400">
              Cancella filtri
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {filtered.length} ricett{filtered.length === 1 ? "a" : "e"}
          {(activeCats.length > 0 || activeTags.length > 0 || q) && " trovate"}
        </p>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-5xl">🔍</span>
          <p className="text-gray-500">Nessuna ricetta trovata</p>
          {(q || activeCats.length > 0) && (
            <button
              onClick={() => { setQ(""); setActiveCats([]); setActiveTags([]); }}
              className="text-sm text-orange-500 hover:underline"
            >
              Rimuovi filtri
            </button>
          )}
        </div>
      )}
    </div>
  );
}

