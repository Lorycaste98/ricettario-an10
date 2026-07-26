"use client";
import { useMemo, useState } from "react";
import { MessageSquareHeart, ChevronDown } from "lucide-react";
import { ReviewBubble } from "@/components/recipe/ReviewBubble";
import { ReviewCarousel } from "@/components/recipe/ReviewCarousel";
import { RatingCountBadge, ReviewsSummary } from "@/components/recipe/ReviewStats";
import { Collapsible } from "@/components/ui/Collapsible";
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
  // Card recensioni: dropdown generico, aperto di default
  const [open, setOpen] = useState(true);

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
    <section className="rounded-2xl border border-white/40 bg-white/60 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      {/* Header = toggle del dropdown generico (aperto di default) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 text-left sm:gap-3"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-md shadow-rose-500/30">
          <MessageSquareHeart size={20} />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-lg font-bold text-sky-950 sm:text-xl">Recensioni</h2>
        {avgRating != null && <ReviewsSummary avg={avgRating} count={reviews.length} />}
        <ChevronDown
          size={18}
          className={`shrink-0 text-sky-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        {/* Un dropdown per ricetta (chiuso di default): chiuso mostra ricetta + media + n° recensioni */}
        <div className="overflow-hidden" inert={!open || undefined}>
          <div className="space-y-2.5 pt-5">
            {groups.map((group) => (
            <Collapsible
              key={group.recipe.id}
              header={
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-bold text-sky-950">{group.recipe.name}</span>
                  <RatingCountBadge avg={group.avg} count={group.reviews.length} />
                </span>
              }
            >
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
            </Collapsible>
          ))}
          </div>
        </div>
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
