"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquareHeart, Star } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ReviewBubble } from "@/components/recipe/ReviewBubble";
import { ReviewCarousel } from "@/components/recipe/ReviewCarousel";
import { ConfirmModal } from "@/components/ui/Modal";
import type { MenuRecipeReview } from "@/lib/types";

interface RecipeGroup {
  recipe: { id: number; name: string; quick: boolean };
  reviews: MenuRecipeReview[];
  avg: number;
}

function groupByRecipe(reviews: MenuRecipeReview[]): RecipeGroup[] {
  const map = new Map<number, RecipeGroup>();
  for (const r of reviews) {
    let group = map.get(r.recipe.id);
    if (!group) {
      group = { recipe: r.recipe, reviews: [], avg: 0 };
      map.set(r.recipe.id, group);
    }
    group.reviews.push(r);
  }
  for (const group of map.values()) {
    group.avg = Math.round((group.reviews.reduce((s, r) => s + r.rating, 0) / group.reviews.length) * 10) / 10;
  }
  return Array.from(map.values()).sort((a, b) => b.reviews.length - a.reviews.length);
}

export function MenuReceivedReviews({ initialReviews, avgRating }: { initialReviews: MenuRecipeReview[]; avgRating: number | null }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const groups = useMemo(() => groupByRecipe(reviews), [reviews]);

  if (reviews.length === 0) return null;

  const deleteReview = async (id: number) => {
    setDeleting(id);
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
    setConfirmId(null);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-white/40 bg-white/60 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <SectionHeader
        title="Recensioni ricevute"
        icon={<MessageSquareHeart size={20} />}
        tone="orange"
        size="lg"
        hint={avgRating != null ? `Media ${avgRating}/10 su ${reviews.length}` : undefined}
      />
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.recipe.id} className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {group.recipe.quick ? (
                <span className="text-sm font-bold text-sky-950">{group.recipe.name}</span>
              ) : (
                <Link
                  href={`/ricette/${group.recipe.id}`}
                  className="text-sm font-bold text-sky-950 transition-colors active:text-orange-600 sm:hover:text-orange-600"
                >
                  {group.recipe.name}
                </Link>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Star size={11} fill="currentColor" className="text-amber-400" />
                {group.avg}/10
                <span className="text-sky-600/70">
                  · {group.reviews.length} recension{group.reviews.length === 1 ? "e" : "i"}
                </span>
              </span>
            </div>

            {/* Recensioni della ricetta in carosello (frecce + sfumature ai bordi) */}
            <ReviewCarousel>
              {group.reviews.map((r) => (
                <div key={r.id} className="w-[230px] shrink-0 snap-start sm:w-[250px]">
                  <ReviewBubble
                    nickname={r.nickname}
                    rating={r.rating}
                    comment={r.comment}
                    createdAt={r.createdAt}
                    isAdmin
                    onDelete={() => setConfirmId(r.id)}
                  />
                </div>
              ))}
            </ReviewCarousel>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId !== null && deleteReview(confirmId)}
        title="Elimina recensione"
        message="Sei sicuro di voler eliminare questa recensione?"
        loading={deleting !== null}
      />
    </section>
  );
}
