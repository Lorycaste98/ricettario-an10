"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, MessageSquareHeart } from "lucide-react";
import type { MenuReview } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { DetailReviewCard } from "@/components/recipe/DetailReviewCard";

interface Props {
  menuId: number;
  reviews: MenuReview[];
  avgRating: number | null;
  isAdmin: boolean;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-125"
          aria-label={`${s} stelle`}
        >
          <Star
            size={26}
            className={s <= (hovered || value) ? "text-amber-400" : "text-sky-300/60"}
            fill={s <= (hovered || value) ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

export function MenuReviewSection({ menuId, reviews: initialReviews, isAdmin }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [reviews, setReviews] = useState<MenuReview[]>(initialReviews);
  const [nickname, setNickname] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) { setError("Inserisci il tuo nome"); return; }
    if (rating === 0) { setError("Seleziona una valutazione"); return; }
    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/menus/${menuId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim(), rating, comment: comment.trim() || null }),
    });

    if (res.ok) {
      const newReview: MenuReview = await res.json();
      setReviews((prev) => [newReview, ...prev]);
      setNickname(""); setRating(5); setComment("");
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Errore durante l'invio");
    }
    setSubmitting(false);
  };

  const handleDelete = async (reviewId: number) => {
    const ok = await confirm({ title: "Eliminare questa recensione?", confirmLabel: "Elimina", variant: "danger" });
    if (!ok) return;
    await fetch(`/api/menus/${menuId}/reviews?reviewId=${reviewId}`, { method: "DELETE" });
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    router.refresh();
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
            <Star size={14} fill="currentColor" className="text-amber-400" /> {avgRating}
            <span className="text-sky-600">({reviews.length})</span>
          </span>
        )}
      </div>

      {/* Form nuova recensione */}
      <div className="rounded-xl border border-white/40 bg-white/40 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-sm font-semibold text-sky-800">Lascia una recensione</h3>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Il tuo nome" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Es. Mario Rossi" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-sky-900">Voto</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <Textarea label="Commento (opzionale)" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Com'era il menù?" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={submitting}>Invia recensione</Button>
        </form>
      </div>

      {/* Lista recensioni */}
      {reviews.length === 0 ? (
        <p className="text-sm text-sky-700">Ancora nessuna recensione. Sii il primo!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <DetailReviewCard
              key={r.id}
              nickname={r.nickname}
              rating={r.rating}
              comment={r.comment}
              createdAt={r.createdAt}
              index={i}
              isAdmin={isAdmin}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
