"use client";
import { useState } from "react";
import { MessageSquareHeart } from "lucide-react";
import { type Review } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { RatingInput } from "@/components/ui/Rating";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ui/Modal";
import { DetailReviewCard } from "@/components/recipe/DetailReviewCard";

export function ReviewSection({ recipeId, initialReviews }: { recipeId: number; initialReviews: Review[] }) {
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(8);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

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

      {/* Lista recensioni */}
      {reviews.length === 0 ? (
        <p className="text-sm text-sky-700">
          {isAdmin
            ? "Ancora nessuna recensione."
            : "Le recensioni si lasciano dalla pagina di recensione del menù in cui è stata cucinata questa ricetta."}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <DetailReviewCard
              key={r.id}
              nickname={r.nickname}
              rating={r.rating}
              comment={r.comment}
              createdAt={r.createdAt}
              tag={r.menu ? { href: `/menu/${r.menu.id}`, label: r.menu.name } : null}
              index={i}
              isAdmin={isAdmin}
              onDelete={() => setConfirmId(r.id)}
            />
          ))}
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
