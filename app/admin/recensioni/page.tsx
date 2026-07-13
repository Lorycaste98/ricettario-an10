import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, MessageSquareHeart, Star } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ReviewsBrowser, type ReviewGroup } from "@/components/admin/ReviewsBrowser";
import type { ReviewItem } from "@/components/admin/ReviewCard";

export const metadata: Metadata = { title: "Recensioni — Ricettario" };

function toGroup(entity: { id: number; name: string; quick?: boolean }, reviews: ReviewItem[]): ReviewGroup {
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { id: entity.id, name: entity.name, avg, count, reviews, quick: entity.quick };
}

function byLatestReview(a: ReviewGroup, b: ReviewGroup): number {
  const la = a.reviews[0] ? new Date(a.reviews[0].createdAt).getTime() : 0;
  const lb = b.reviews[0] ? new Date(b.reviews[0].createdAt).getTime() : 0;
  return lb - la;
}

export default async function RecensioniPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Le due tab sono due raggruppamenti della stessa tabella Review (per ricetta / per menù
  // d'origine), quindi si sovrappongono — il totale/media globali vanno calcolati a parte.
  const [recipesRaw, menusRaw, agg] = await Promise.all([
    db.recipe.findMany({
      where: { reviews: { some: {} } },
      select: {
        id: true,
        name: true,
        quick: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          select: { id: true, nickname: true, rating: true, comment: true, createdAt: true, menu: { select: { id: true, name: true } } },
        },
      },
    }),
    db.menu.findMany({
      where: { recipeReviews: { some: {} } },
      select: {
        id: true,
        name: true,
        recipeReviews: {
          orderBy: { createdAt: "desc" },
          select: { id: true, nickname: true, rating: true, comment: true, createdAt: true, recipe: { select: { id: true, name: true, quick: true } } },
        },
      },
    }),
    db.review.aggregate({ _count: true, _avg: { rating: true } }),
  ]);

  const recipeGroups = recipesRaw
    .map((r) =>
      toGroup(
        r,
        r.reviews.map((rv) => ({ ...rv, createdAt: rv.createdAt.toISOString(), recipe: { id: r.id, name: r.name, quick: r.quick } }))
      )
    )
    .sort(byLatestReview);

  const menuGroups = menusRaw
    .map((m) =>
      toGroup(
        m,
        m.recipeReviews.map((rv) => ({ ...rv, createdAt: rv.createdAt.toISOString(), menu: { id: m.id, name: m.name } }))
      )
    )
    .sort(byLatestReview);

  const totalReviews = agg._count;
  const globalAvg = agg._avg.rating != null ? agg._avg.rating.toFixed(1) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Back */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-orange-500"
      >
        <ArrowLeft size={16} /> Dashboard
      </Link>

      {/* Header */}
      <div className="fade-up flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-md shadow-rose-500/30">
            <MessageSquareHeart size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Recensioni</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {totalReviews} recension{totalReviews === 1 ? "e" : "i"} sulle ricette
            </p>
          </div>
        </div>
        {globalAvg && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-4 py-1.5 text-sm font-bold text-amber-700 shadow-sm">
            <Star size={15} fill="currentColor" className="text-amber-400" />
            {globalAvg}/10 di media
          </span>
        )}
      </div>

      {totalReviews === 0 ? (
        <p className="text-sm text-gray-400">Nessuna recensione ancora.</p>
      ) : (
        <ReviewsBrowser recipeGroups={recipeGroups} menuGroups={menuGroups} />
      )}
    </div>
  );
}
