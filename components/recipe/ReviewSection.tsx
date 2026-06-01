"use client";
import { useState } from "react";
import { type Review } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ui/Modal";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} className="text-2xl transition-transform hover:scale-110">
          {s <= value ? "⭐" : "☆"}
        </button>
      ))}
    </div>
  );
}

export function ReviewSection({ recipeId, initialReviews }: { recipeId: number; initialReviews: Review[] }) {
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [nickname, setNickname] = useState("");
  const [rating, setRating] = useState(5);
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
    if (!nickname.trim()) { setError("Inserisci il tuo nome"); return; }
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/recipes/${recipeId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim(), rating, comment: comment.trim() }),
    });
    if (res.ok) {
      const r = await res.json();
      setReviews((prev) => [r, ...prev]);
      setNickname(""); setRating(5); setComment("");
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
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-sky-950">Recensioni</h2>
        {avgRating && (
          <span className="flex items-center gap-1 rounded-full bg-orange-400/20 border border-orange-300/30 px-3 py-1 text-sm font-medium text-orange-700">
            ⭐ {avgRating} <span className="text-sky-600">({reviews.length})</span>
          </span>
        )}
      </div>

      {/* Form nuova recensione */}
      <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-5">
        <h3 className="mb-4 text-sm font-semibold text-sky-800">Lascia una recensione</h3>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Il tuo nome" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Es. Mario Rossi" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-sky-900">Voto</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <Textarea label="Commento (opzionale)" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Come ti è sembrata la ricetta?" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={submitting}>Invia recensione</Button>
        </form>
      </div>

      {/* Lista recensioni */}
      {reviews.length === 0 ? (
        <p className="text-sm text-sky-700">Ancora nessuna recensione. Sii il primo!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="flex gap-4 rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-400/30 font-bold text-orange-700 text-sm">
                {r.nickname[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium text-sky-950 text-sm">{r.nickname}</span>
                    <span className="ml-2 text-xs text-sky-600">
                      {new Date(r.createdAt).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm">{"⭐".repeat(r.rating)}</span>
                    {isAdmin && (
                      <button onClick={() => setConfirmId(r.id)} className="text-sky-400 hover:text-red-500 transition-colors text-xs">✕</button>
                    )}
                  </div>
                </div>
                {r.comment && <p className="mt-1 text-sm text-sky-800">{r.comment}</p>}
              </div>
            </div>
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
