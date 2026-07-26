"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Pencil, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";

/**
 * Nota admin del menù (privata) — gemella ridotta di PersonalRatingCard senza voto.
 * Salva su Menu.notes via PATCH /api/menus/[id]. Solo admin.
 */
export function MenuNotesCard({
  menuId,
  initial,
}: {
  menuId: number;
  initial: string | null;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<string | null>(initial);
  const [editing, setEditing] = useState(initial == null);
  const [note, setNote] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const patch = async (value: string | null) => {
    const res = await fetch(`/api/menus/${menuId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: value }),
    });
    return res.ok;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = note.trim();
    if (!value) return;
    setBusy(true);
    setError("");
    const okRes = await patch(value);
    setBusy(false);
    if (okRes) {
      setSaved(value);
      setEditing(false);
      router.refresh();
    } else {
      setError("Errore nel salvataggio");
    }
  };

  const remove = async () => {
    setBusy(true);
    const okRes = await patch(null);
    setBusy(false);
    setConfirmDelete(false);
    if (okRes) {
      setSaved(null);
      setNote("");
      setEditing(true);
      router.refresh();
    }
  };

  const startEdit = () => {
    setNote(saved ?? "");
    setEditing(true);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-50/70 to-orange-50/50 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30">
          <StickyNote size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-sky-950">Note del menù</h2>
          <p className="text-xs text-sky-700/70">Appunti privati — visibili solo a te.</p>
        </div>
      </div>

      {saved && !editing ? (
        <div className="space-y-3">
          <p className="whitespace-pre-wrap rounded-xl border border-amber-200/50 bg-white/50 px-4 py-3 text-sm leading-relaxed text-sky-900">
            {saved}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/60 bg-white/60 px-3 py-1.5 text-sm font-medium text-amber-800 transition-colors hover:bg-white/90"
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
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Es. ordinare il pesce 2 giorni prima, allergie degli ospiti, fornitore…"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <Button type="submit" loading={busy} disabled={!note.trim()}>
              {saved ? "Salva nota" : "Salva la nota"}
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
        title="Rimuovi la nota"
        message="Vuoi rimuovere la nota di questo menù?"
        loading={busy}
      />
    </section>
  );
}
