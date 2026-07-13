"use client";
import { useMemo, useState } from "react";
import { MessageSquareHeart, CalendarDays, ChevronDown } from "lucide-react";
import { type Review } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { RatingInput } from "@/components/ui/Rating";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ui/Modal";
import { ReviewBubble } from "@/components/recipe/ReviewBubble";
import { ReviewCarousel } from "@/components/recipe/ReviewCarousel";

const MAX_DATES = 4;

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

export function ReviewSection({ recipeId, initialReviews }: { recipeId: number; initialReviews: Review[] }) {
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(8);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const groups = useMemo(() => groupByDate(reviews), [reviews]);
  const visibleGroups = showAll ? groups : groups.slice(0, MAX_DATES);
  const hiddenCount = groups.length - visibleGroups.length;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/recipes/${recipeId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment.trim() }),
    });
    if (res.ok) {
      const r = await res.json();
      setReviews((prev) => [r, ...prev]);
      setRating(8); setComment("");
    } else {
      const d = await res.json();
      setError(d.error ?? "Errore durante l'invio");
    }
    setSubmitting(false);
  };

  const deleteReview = async (id: number) => {
    setDeleting(id);
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
    setConfirmId(null);
  };

  return (
    <section className="space-y-6 rounded-2xl border border-white/40 bg-white/60 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-md shadow-rose-500/30">
          <MessageSquareHeart size={18} />
        </span>
        <h2 className="text-xl font-bold text-sky-950">Recensioni</h2>
        {avgRating && (
          <span className="flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-sm font-medium text-amber-700">
            {avgRating}/10
            <span className="text-sky-600">({reviews.length})</span>
          </span>
        )}
      </div>

      {/* Nota personale admin (promemoria, non una recensione pubblica) */}
      {isAdmin && (
        <div className="rounded-xl border border-white/40 bg-white/40 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-sm font-semibold text-sky-800">Aggiungi una nota personale</h3>
          <p className="mb-4 text-xs text-sky-700/70">
            Un promemoria tuo (non è una recensione degli ospiti): le recensioni pubbliche arrivano solo dal link di recensione del menù.
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-sky-900">Voto</label>
              <RatingInput value={rating} onChange={setRating} />
            </div>
            <Textarea label="Note (opzionale)" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Come è venuta questa volta?" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={submitting}>Salva nota</Button>
          </form>
        </div>
      )}

      {/* Lista raggruppata per data (più recente in cima) */}
      {reviews.length === 0 ? (
        <p className="text-sm text-sky-700">
          {isAdmin
            ? "Ancora nessuna recensione."
            : "Le recensioni si lasciano dalla pagina di recensione del menù in cui è stata cucinata questa ricetta."}
        </p>
      ) : (
        <div className="space-y-5">
          {visibleGroups.map((g) => (
            <div key={g.key} className="space-y-2.5">
              {/* Header del gruppo-data */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-950">
                  <CalendarDays size={14} className="text-sky-400" />
                  {g.label}
                </span>
                <span className="text-xs text-sky-600/80">
                  media {g.avg.toFixed(1)} · {g.reviews.length} vot{g.reviews.length === 1 ? "o" : "i"}
                </span>
                {g.menu && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600">
                    dal menù {g.menu.name}
                  </span>
                )}
              </div>

              {/* Carosello delle recensioni di quel giorno */}
              <ReviewCarousel>
                {g.reviews.map((r) => (
                  <div key={r.id} className="w-[230px] shrink-0 snap-start sm:w-[250px]">
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
            </div>
          ))}

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/50 px-4 py-2 text-sm font-semibold text-sky-700 transition-colors hover:bg-white/80"
            >
              Vedi altre date <span className="text-sky-500">({hiddenCount})</span>
              <ChevronDown size={15} />
            </button>
          )}
        </div>
      )}

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
