import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Ricettario" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [recipeCount, categoryCount, tagCount, topCooked, recentReviews] = await Promise.all([
    db.recipe.count(),
    db.category.count(),
    db.tag.count(),
    db.recipe.findMany({
      where: { cookCount: { gt: 0 } },
      orderBy: { cookCount: "desc" },
      take: 5,
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
  ]);

  const totalCooks = await db.recipe.aggregate({ _sum: { cookCount: true } });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-sm text-gray-400 mt-1">Benvenuto, {session.username} 👋</p>
        </div>
        <Link
          href="/admin/ricette/nuova"
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          <span>+</span> Nuova ricetta
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Ricette" value={recipeCount} icon="📖" />
        <StatCard label="Volte cucinate" value={totalCooks._sum.cookCount ?? 0} icon="🍳" />
        <StatCard label="Categorie" value={categoryCount} icon="🏷️" />
        <StatCard label="Tag" value={tagCount} icon="#" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Most cooked */}
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Più cucinate</h2>
          {topCooked.length === 0 ? (
            <p className="text-sm text-gray-400">Nessuna ricetta cucinata ancora.</p>
          ) : (
            <ul className="space-y-2">
              {topCooked.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <Link href={`/ricette/${r.id}`} className="truncate text-sm text-gray-700 hover:text-orange-500 transition-colors">
                    {r.name}
                  </Link>
                  <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600">
                    🍳 ×{r.cookCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent reviews */}
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Ultime recensioni</h2>
          {recentReviews.length === 0 ? (
            <p className="text-sm text-gray-400">Nessuna recensione ancora.</p>
          ) : (
            <ul className="space-y-3">
              {recentReviews.map((rev) => (
                <li key={rev.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link href={`/ricette/${rev.recipe.id}`} className="truncate text-xs font-medium text-gray-500 hover:text-orange-500 transition-colors">
                      {rev.recipe.name}
                    </Link>
                    <span className="shrink-0 text-xs text-yellow-500">{"⭐".repeat(rev.rating)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    <span className="font-medium text-gray-600">{rev.nickname}</span>
                    {rev.comment && ` — ${rev.comment.slice(0, 60)}${rev.comment.length > 60 ? "…" : ""}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Quick links */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Accesso rapido</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            📖 Tutte le ricette
          </Link>
          <Link href="/admin/ricette/nuova" className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-700 hover:bg-orange-100 transition-colors">
            ✨ Nuova ricetta
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

