import { redirect } from "next/navigation";
import Link from "next/link";
import type React from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Metadata } from "next";
import {
  BookOpen,
  UtensilsCrossed,
  Tag,
  Plus,
  Star,
  Flame,
  FileJson,
  BookMarked,
  SmilePlus,
  ShoppingBasket,
  Carrot,
} from "lucide-react";
import ChartsSection from "@/components/admin/ChartsSection";

export const metadata: Metadata = { title: "Admin — Ricettario" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Nomi esclusi dalla dashboard (gestibili dalla pagina admin/ingredienti)
  const excludedNames = await db.ingredientMaster
    .findMany({ where: { excludedFromStats: true }, select: { name: true } })
    .then((rows) => rows.map((r) => r.name));

  const [recipeCount, categoryCount, , menuCount, topCookedRaw, recentReviews, topIngredientsRaw, ingredientCount] = await Promise.all([
    db.recipe.count(),
    db.category.count(),
    db.tag.count(),
    db.menu.count(),
    db.recipe.findMany({
      where: { cookCount: { gt: 0 } },
      orderBy: { cookCount: "desc" },
      take: 15,
      select: { id: true, name: true, cookCount: true },
    }),
    db.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, nickname: true, rating: true, comment: true, createdAt: true,
        recipe: { select: { id: true, name: true } },
      },
    }),
    db.ingredient.groupBy({
      by: ["name"],
      where: { name: { notIn: excludedNames } },
      _count: { name: true },
      orderBy: { _count: { name: "desc" } },
      take: 15,
    }),
    db.ingredient.count(),
  ]);

  const totalCooks = await db.recipe.aggregate({ _sum: { cookCount: true } });

  const topCooked = topCookedRaw.map((r) => ({ name: r.name, value: r.cookCount }));
  const topIngredients = topIngredientsRaw.map((i) => ({ name: i.name, value: i._count.name }));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="inline-flex items-center gap-1 text-md text-gray-400 mt-1"><SmilePlus size={16}/> Benvenuto, {session.username}</p>
        </div>
        <Link
          href="/admin/ricette/nuova"
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          <Plus size={16} /> Nuova ricetta
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Ricette" value={recipeCount} icon={<BookOpen size={20} />} />
        <StatCard label="Volte cucinate" value={totalCooks._sum.cookCount ?? 0} icon={<Flame size={20} />} />
        <StatCard label="Menù" value={menuCount} icon={<UtensilsCrossed size={20} />} />
        <StatCard label="Categorie" value={categoryCount} icon={<Tag size={20} />} />
        <StatCard label="Ingredienti" value={ingredientCount} icon={<ShoppingBasket size={20} />} />
      </div>

      {/* Quick links */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Accesso rapido</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/ricette" className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
            <BookOpen size={15} /> Tutte le ricette
          </Link>
          <Link href="/admin/ricette/nuova" className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-700 hover:bg-orange-100 transition-colors inline-flex items-center gap-2">
            <Plus size={15} /> Nuova ricetta
          </Link>
          <Link href="/admin/menu" className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 hover:bg-sky-100 transition-colors inline-flex items-center gap-2">
            <UtensilsCrossed size={15} /> Gestisci menù
          </Link>
          <Link href="/admin/menu/nuovo" className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 hover:bg-sky-100 transition-colors inline-flex items-center gap-2">
            <Plus size={15} /> Nuovo menù
          </Link>
          <Link href="/admin/import" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100 transition-colors inline-flex items-center gap-2">
            <FileJson size={15} /> Importa JSON
          </Link>
          <Link href="/admin/vocabolario" className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-700 hover:bg-violet-100 transition-colors inline-flex items-center gap-2">
            <BookMarked size={15} /> Categorie &amp; Tag
          </Link>
          <Link href="/admin/ingredienti" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center gap-2">
            <Carrot size={15} /> Gestisci ingredienti
          </Link>
        </div>
      </section>

      {/* Recent reviews */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Ultime recensioni</h2>
        {recentReviews.length === 0 ? (
            <p className="text-sm text-gray-400">Nessuna recensione ancora.</p>
        ) : (
            <ul className="divide-y divide-gray-50">
              {recentReviews.map((rev: { id: number; nickname: string; rating: number; comment: string | null; recipe: { id: number; name: string } }) => (
                  <li key={rev.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link href={`/ricette/${rev.recipe.id}`} className="truncate text-xs font-medium text-gray-500 hover:text-orange-500 transition-colors">
                        {rev.recipe.name}
                      </Link>
                      <span className="shrink-0 inline-flex gap-0.5 text-yellow-500">
                    {Array.from({ length: rev.rating }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                  </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      <span className="font-medium text-gray-600">{rev.nickname}</span>
                      {rev.comment && ` — ${rev.comment.slice(0, 80)}${rev.comment.length > 80 ? "…" : ""}`}
                    </p>
                  </li>
              ))}
            </ul>
        )}
      </section>

      {/* Charts */}
      <ChartsSection topCooked={topCooked} topIngredients={topIngredients} />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

