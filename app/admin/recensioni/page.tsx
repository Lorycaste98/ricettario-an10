import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, MessageSquareHeart, Star } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ReviewsBrowser } from "@/components/admin/ReviewsBrowser";
import type { AdminReview } from "@/components/admin/ReviewMiniCard";

export const metadata: Metadata = { title: "Recensioni — Ricettario" };

export default async function RecensioniPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Una sola query sulla tabella Review: ogni recensione porta con sé ricetta e
  // menù d'origine (null = nota personale admin). Filtri e raggruppamenti sono
  // calcolati client-side dalla lista piatta.
  const raw = await db.review.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nickname: true,
      rating: true,
      comment: true,
      createdAt: true,
      recipe: { select: { id: true, name: true, quick: true } },
      menu: { select: { id: true, name: true } },
    },
  });

  const reviews: AdminReview[] = raw.map((r) => ({
    id: r.id,
    nickname: r.nickname,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    recipe: r.recipe,
    menu: r.menu,
  }));

  const totalReviews = reviews.length;
  const globalAvg = totalReviews
    ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
    : null;

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
        <ReviewsBrowser reviews={reviews} />
      )}
    </div>
  );
}
