"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, ImageIcon, EyeOff } from "lucide-react";

interface RecipeItem {
  id: number;
  name: string;
  photo: string | null;
  published: boolean;
  categories: { name: string; color: string }[];
}

export default function RicetteGestioneClient({ initialRecipes }: { initialRecipes: RecipeItem[] }) {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeItem[]>(initialRecipes);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const filtered = query.trim()
    ? recipes.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    : recipes;

  const togglePublished = async (item: RecipeItem) => {
    setBusyId(item.id);
    const next = !item.published;
    const res = await fetch(`/api/recipes/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: next }),
    });
    setBusyId(null);
    if (!res.ok) return;
    setRecipes((prev) => prev.map((r) => (r.id === item.id ? { ...r, published: next } : r)));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="relative min-w-48">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca ricetta…"
          className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
      </div>

      {/* Tabella */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-2 py-2.5 text-left font-medium text-gray-600 sm:px-3 sm:py-3">Ricetta</th>
              <th className="w-20 px-2 py-2.5 text-center font-medium text-gray-600 sm:w-28 sm:px-3 sm:py-3">Visibile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-2 py-2.5 align-top sm:px-3">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.photo ? (
                        <Image src={item.photo} alt={item.name} fill sizes="40px" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300">
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/ricette/${item.id}`}
                        className={`block break-words font-medium hover:underline ${item.published ? "text-gray-800" : "text-gray-400"}`}
                      >
                        {item.name}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {!item.published && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                            <EyeOff size={10} /> Non pronta
                          </span>
                        )}
                        {item.categories.slice(0, 2).map((c) => (
                          <span
                            key={c.name}
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: c.color + "cc" }}
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center align-top sm:px-3">
                  <button
                    role="switch"
                    aria-checked={item.published}
                    disabled={busyId === item.id}
                    onClick={() => void togglePublished(item)}
                    title={item.published ? "Nascondi ai visitatori" : "Mostra ai visitatori"}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 disabled:opacity-50 ${
                      item.published ? "bg-green-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        item.published ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={2} className="py-10 text-center text-sm text-gray-400">
                  Nessuna ricetta trovata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
