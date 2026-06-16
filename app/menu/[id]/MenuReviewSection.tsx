"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, Trash2, MessageSquarePlus } from "lucide-react";
import type { MenuReview } from "@/lib/types";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface Props {
  menuId: number;
  reviews: MenuReview[];
  avgRating: number | null;
  isAdmin: boolean;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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
          className="transition-transform hover:scale-110"
        >
          <Star
            size={22}
            className={`transition-colors ${
              s <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-sky-300/50"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MenuReviewSection({ menuId, reviews: initialReviews, avgRating: _initAvg, isAdmin }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [reviews, setReviews] = useState<MenuReview[]>(initialReviews);
  const [nickname, setNickname] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) { setError("Inserisci un nickname"); return; }
    if (rating === 0) { setError("Seleziona una valutazione"); return; }
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/menus/${menuId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim(), rating, comment: comment.trim() || null }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Errore nell'invio");
      setSubmitting(false);
      return;
    }

    const newReview: MenuReview = await res.json();
    setReviews((prev) => [newReview, ...prev]);
    setNickname("");
    setRating(0);
    setComment("");
    setShowForm(false);
    setSubmitting(false);
  };

  const handleDelete = async (reviewId: number) => {
    const ok = await confirm({ title: "Eliminare questa recensione?", confirmLabel: "Elimina", variant: "danger" });
    if (!ok) return;
    await fetch(`/api/menus/${menuId}/reviews?reviewId=${reviewId}`, { method: "DELETE" });
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    router.refresh();
  };

  const inputCls =
    "w-full rounded-xl border border-white/30 bg-white/20 px-3 py-2.5 text-sm text-sky-950 placeholder:text-sky-700/50 focus:outline-none focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm transition";

  return (
    <section className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-bold text-sky-50">Recensioni</h2>
          {avgRating !== null && (
            <span className="flex items-center gap-1 text-amber-300 text-sm font-semibold">
              <Star size={14} fill="currentColor" />
              {avgRating.toFixed(1)}
              <span className="text-sky-300/60 font-normal text-xs">({reviews.length})</span>
            </span>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/30 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-white/50 backdrop-blur-sm transition"
          >
            <MessageSquarePlus size={13} />
            Scrivi recensione
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/30 bg-white/35 backdrop-blur-sm p-4 space-y-3"
        >
          <h3 className="text-sm font-semibold text-sky-900">La tua recensione</h3>
          {error && (
            <p className="rounded-lg bg-red-50/60 border border-red-200/50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-sky-800">Valutazione *</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-sky-800">Nickname *</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Il tuo nome"
              className={inputCls}
              maxLength={40}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-sky-800">Commento (opzionale)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Scrivi qualcosa sul menù…"
              rows={2}
              className={inputCls + " resize-none"}
              maxLength={500}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="rounded-xl border border-white/30 bg-white/30 px-4 py-2 text-sm font-medium text-sky-800 hover:bg-white/50 transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Invia
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm py-10 text-center">
          <p className="text-sm text-sky-200/50">Nessuna recensione ancora. Sii il primo!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-white/25 bg-white/30 backdrop-blur-sm p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-sky-950">{r.nickname}</span>
                    <span className="flex items-center gap-0.5 text-amber-400 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < r.rating ? "fill-amber-400" : "fill-none text-sky-200/40"}
                        />
                      ))}
                    </span>
                    <span className="text-[11px] text-sky-600/50">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.comment && (
                    <p className="mt-1.5 text-sm text-sky-800/80 leading-relaxed">{r.comment}</p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-sky-400 hover:bg-red-50/60 hover:text-red-500 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}


