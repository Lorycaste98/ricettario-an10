"use client";
import { useMemo, useState } from "react";
import { ReviewBubble } from "@/components/recipe/ReviewBubble";
import { ReviewCarousel } from "@/components/recipe/ReviewCarousel";
import { ReviewsHeader } from "@/components/recipe/ReviewStats";
import { GuestRatingTag } from "@/components/ds/Tag";
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
    <section className="rounded-card border border-blu-150 bg-white p-(--pad)">
      {/* Header = toggle del dropdown generico (aperto di default) */}
      <ReviewsHeader open={open} onToggle={() => setOpen((v) => !v)} avg={avgRating} count={reviews.length} />

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        {/* Un dropdown per ricetta (chiuso di default): chiuso mostra ricetta + media + n° recensioni */}
        <div className="overflow-hidden" inert={!open || undefined}>
          <div className="flex flex-col gap-2 pt-3">
            {groups.map((group) => (
            <Collapsible
              key={group.recipe.id}
              header={
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-bold">{group.recipe.name}</span>
                  <GuestRatingTag value={group.avg} count={group.reviews.length} />
                </span>
              }
            >
              <ReviewCarousel>
                {group.reviews.map((r) => (
                  <div key={r.id} className="w-[11.5rem] shrink-0 snap-start @min-[620px]:w-60">
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
