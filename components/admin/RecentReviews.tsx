"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ReviewCard, type ReviewItem } from "./ReviewCard";

export function RecentReviews({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-gray-400">Nessuna recensione ancora.</p>;
  }

  return (
    <div className="space-y-4">
      {/* 5 affiancate: scroll orizzontale su mobile, griglia a 5 colonne da lg.
          pt-1 evita che il translate-y in hover venga tagliato dall'overflow. */}
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pt-1 pb-2 snap-x [scrollbar-width:thin] lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pt-0 lg:pb-0">
        {reviews.map((r, i) => (
          <div key={`${r.source?.type ?? "x"}-${r.id}`} className="w-[220px] shrink-0 snap-start lg:w-auto">
            <ReviewCard review={r} index={i} expand="dialog" compact />
          </div>
        ))}
      </div>
      <Link
        href="/admin/recensioni"
        className="group inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100 hover:shadow-md active:scale-95"
      >
        Vedi tutte le recensioni
        <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
