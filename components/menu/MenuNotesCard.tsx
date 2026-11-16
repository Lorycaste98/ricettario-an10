"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Pencil, Trash2 } from "lucide-react";
import { TextArea } from "@/components/ds/Field";
import { Button } from "@/components/ds/Button";
import { Panel } from "@/components/ds/Panel";
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
    <Panel tone="note" icon={<StickyNote />} title="Note del menù" meta="Appunti privati, li vedi solo tu.">
      {saved && !editing ? (
        <div className="flex flex-col gap-3">
          <p className="rounded-ctl bg-white px-3.5 py-3 text-[0.9375rem] leading-relaxed whitespace-pre-wrap">{saved}</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" icon={<Pencil />} onClick={startEdit}>
              Modifica
            </Button>
            <Button size="sm" variant="danger" icon={<Trash2 />} onClick={() => setConfirmDelete(true)}>
              Rimuovi
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-3">
          <TextArea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            aria-label="Nota del menù"
            placeholder="Es. ordinare il pesce 2 giorni prima, allergie degli ospiti, fornitore…"
          />
          {error && <p className="text-[0.875rem] text-rosa">{error}</p>}
          <div className="flex items-center gap-2">
            <Button type="submit" loading={busy} disabled={!note.trim()}>
              Salva la nota
            </Button>
            {saved && (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Annulla
              </Button>
            )}
          </div>
        </form>
      )}

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title="Rimuovere la nota?"
        message="La nota di questo menù verrà cancellata."
        confirmLabel="Rimuovi"
        loading={busy}
      />
    </Panel>
  );
}
