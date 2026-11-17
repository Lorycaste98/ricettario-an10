import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ds/PageHeader";
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
  const globalAvg = totalReviews ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1).replace(".", ",") : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Recensioni"
        meta={`${totalReviews} recension${totalReviews === 1 ? "e" : "i"} degli ospiti${globalAvg ? ` · media ${globalAvg}` : ""}`}
      />
      {totalReviews === 0 ? (
        <p className="rounded-card border border-blu-150 bg-white py-10 text-center text-grigio">
          Nessuna recensione ancora. Gli ospiti votano dal link «Recensioni ospiti» del menù.
        </p>
      ) : (
        <ReviewsBrowser reviews={reviews} />
      )}
    </div>
  );
}
