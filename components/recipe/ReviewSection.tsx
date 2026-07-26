"use client";
import { useMemo, useState } from "react";
import { MessageSquareHeart, CalendarDays, ChevronDown } from "lucide-react";
import { type Review } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ui/Modal";
import { Collapsible } from "@/components/ui/Collapsible";
import { ReviewBubble } from "@/components/recipe/ReviewBubble";
import { ReviewCarousel } from "@/components/recipe/ReviewCarousel";
import { RatingCountBadge, ReviewsSummary } from "@/components/recipe/ReviewStats";

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
        <div className="overflow-hidden" inert={!open || undefined}>
          {reviews.length === 0 ? (
            <p className="pt-5 text-sm text-sky-700">
              Le recensioni si lasciano dalla pagina di recensione del menù in cui è stata cucinata questa ricetta.
            </p>
          ) : (
            // Un dropdown per data (chiuso di default): chiuso mostra data + media + n° voti
            <div className="space-y-2.5 pt-5">
              {groups.map((g) => (
                <Collapsible
                  key={g.key}
                  header={
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-950">
                        <CalendarDays size={14} className="text-sky-400" />
                        {g.label}
                      </span>
                      <RatingCountBadge avg={g.avg} count={g.reviews.length} />
                      {g.menu && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600">
                          dal menù {g.menu.name}
                        </span>
                      )}
                    </span>
                  }
                >
                  <ReviewCarousel>
                    {g.reviews.map((r) => (
                      <div key={r.id} className="w-[185px] shrink-0 snap-start sm:w-[250px]">
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
