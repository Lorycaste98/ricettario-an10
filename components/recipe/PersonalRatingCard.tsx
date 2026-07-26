"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Pencil, Trash2, StickyNote } from "lucide-react";
import { RatingInput } from "@/components/ui/Rating";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import type { PersonalRating } from "@/lib/types";

/**
 * Card "Il mio voto": voto personale dell'admin su una ricetta (uno per account),
 * distinto dalle recensioni ospiti e fuori dalla media pubblica.
 * Identità visiva sky/indigo (le recensioni sono oro/amber) per distinguerli a colpo d'occhio.
 */
export function PersonalRatingCard({
  recipeId,
  initial,
}: {
  recipeId: number;
  initial: PersonalRating | null;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<PersonalRating | null>(initial);
  const [editing, setEditing] = useState(initial == null);
  const [rating, setRating] = useState(initial?.rating ?? 8);
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/recipes/${recipeId}/rating`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, note: note.trim() || null }),
    });
    setBusy(false);
    if (res.ok) {
      const data = (await res.json()) as PersonalRating;
      setSaved(data);
      setEditing(false);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Errore nel salvataggio");
    }
  };

  const remove = async () => {
    setBusy(true);
    const res = await fetch(`/api/recipes/${recipeId}/rating`, { method: "DELETE" });
    setBusy(false);
    setConfirmDelete(false);
    if (res.ok) {
      setSaved(null);
      setRating(8);
      setNote("");
      setEditing(true);
      router.refresh();
    }
  };

  const startEdit = () => {
    setRating(saved?.rating ?? 8);
    setNote(saved?.note ?? "");
    setEditing(true);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-sky-300/40 bg-gradient-to-br from-sky-50/70 to-indigo-50/50 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/30">
          <ChefHat size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-sky-950">Il mio voto</h2>
          <p className="text-xs text-sky-700/70">Il tuo voto personale — non è una recensione degli ospiti.</p>
        </div>
        {saved && !editing && (
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 px-3 py-1.5 text-white shadow-sm">
            <span className="text-xl font-extrabold leading-none">{saved.rating}</span>
            <span className="text-xs font-medium text-sky-100">/10</span>
          </span>
        )}
      </div>

      {saved && !editing ? (
        <div className="space-y-3">
          {saved.note && (
            <p className="flex items-start gap-2 rounded-xl border border-sky-200/50 bg-white/50 px-4 py-3 text-sm text-sky-900 leading-relaxed">
              <StickyNote size={16} className="mt-0.5 shrink-0 text-sky-500" /> <span>{saved.note}</span>
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300/60 bg-white/60 px-3 py-1.5 text-sm font-medium text-sky-800 transition-colors hover:bg-white/90"
            >
              <Pencil size={14} /> Modifica
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white/60 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <Trash2 size={14} /> Rimuovi
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-sky-900">Voto</label>
            <RatingInput value={rating} onChange={setRating} />
          </div>
          <Textarea
            label="Nota (opzionale)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Un promemoria per te: come l'hai trovata?"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <Button type="submit" loading={busy}>
              {saved ? "Salva voto" : "Salva il mio voto"}
            </Button>
            {saved && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-sky-200 bg-white/50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-white/80"
              >
                Annulla
              </button>
            )}
          </div>
        </form>
      )}

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title="Rimuovi il mio voto"
        message="Vuoi rimuovere il tuo voto personale per questa ricetta?"
        loading={busy}
      />
    </section>
  );
}
