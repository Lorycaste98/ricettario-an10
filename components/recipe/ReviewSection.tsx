"use client";
import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { type Review } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ui/Modal";
import { Collapsible } from "@/components/ui/Collapsible";
import { ReviewBubble } from "@/components/recipe/ReviewBubble";
import { ReviewCarousel } from "@/components/recipe/ReviewCarousel";
import { ReviewsHeader } from "@/components/recipe/ReviewStats";
import { GuestRatingTag } from "@/components/ds/Tag";

// Giorno locale YYYY-MM-DD + etichetta leggibile (le review arrivate dallo stesso
// menù condividono il timestamp: un gruppo-data ≈ "la volta che l'abbiamo cucinata").
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

interface DateGroup {
  key: string;
  label: string;
  reviews: Review[];
  avg: number;
  /** Menù comune a tutte le recensioni del gruppo (se unanime e non nullo). */
  menu: { id: number; name: string } | null;
}

function groupByDate(reviews: Review[]): DateGroup[] {
  const map = new Map<string, Review[]>();
  for (const r of reviews) {
    const k = dayKey(r.createdAt);
    const bucket = map.get(k);
    if (bucket) bucket.push(r);
    else map.set(k, [r]);
  }
  return Array.from(map.entries())
    .sort((a, b) => new Date(b[1][0].createdAt).getTime() - new Date(a[1][0].createdAt).getTime())
    .map(([key, rs]) => {
      const menuId = rs[0].menu?.id ?? null;
      const unanimous = menuId != null && rs.every((r) => r.menu?.id === menuId);
      return {
        key,
        label: dayLabel(rs[0].createdAt),
        reviews: rs,
        avg: rs.reduce((s, r) => s + r.rating, 0) / rs.length,
        menu: unanimous ? rs[0].menu! : null,
      };
    });
}

export function ReviewSection({ initialReviews }: { initialReviews: Review[] }) {
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  // Card recensioni: dropdown generico, aperto di default
  const [open, setOpen] = useState(true);

  const groups = useMemo(() => groupByDate(reviews), [reviews]);

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

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
        <div className="overflow-hidden" inert={!open || undefined}>
          {reviews.length === 0 ? (
            <p className="pt-3 text-[0.875rem] text-grigio">
              Le recensioni si lasciano dalla pagina di recensione del menù in cui è stata cucinata questa ricetta.
            </p>
          ) : (
            // Un dropdown per data (chiuso di default): chiuso mostra data + media + n° voti
            <div className="flex flex-col gap-2 pt-3">
              {groups.map((g) => (
                <Collapsible
                  key={g.key}
                  header={
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="inline-flex items-center gap-1.5 font-bold">
                        <CalendarDays className="size-4 text-blu-600" aria-hidden />
                        {g.label}
                      </span>
                      <GuestRatingTag value={g.avg} count={g.reviews.length} />
                      {g.menu && <span className="text-(length:--fs-meta) text-grigio">dal menù {g.menu.name}</span>}
                    </span>
                  }
                >
                  <ReviewCarousel>
                    {g.reviews.map((r) => (
                      <div key={r.id} className="w-[11.5rem] shrink-0 snap-start @min-[620px]:w-60">
                        <ReviewBubble
                          nickname={r.nickname}
                          rating={r.rating}
                          comment={r.comment}
                          createdAt={r.createdAt}
                          showDate={false}
                          chip={!g.menu && r.menu ? { href: `/menu/${r.menu.id}`, label: r.menu.name } : null}
                          isAdmin={isAdmin}
                          onDelete={() => setConfirmId(r.id)}
                        />
                      </div>
                    ))}
                  </ReviewCarousel>
                </Collapsible>
              ))}
            </div>
          )}
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
