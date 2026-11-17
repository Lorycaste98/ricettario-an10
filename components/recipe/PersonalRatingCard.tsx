"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ds/Button";
import { Field, TextArea } from "@/components/ds/Field";
import { RatingInput } from "@/components/ds/Controls";
import { MyRatingTag } from "@/components/ds/Tag";
import { Panel } from "@/components/ds/Panel";
import { FormError } from "@/components/admin/FormParts";
import { ConfirmModal } from "@/components/ui/Modal";
import type { PersonalRating } from "@/lib/types";

/**
 * Scheda «Il mio voto» (restyle fase 8): voto personale dell'admin su una ricetta (uno per
 * account), distinto dalle recensioni ospiti e fuori dalla media pubblica. Colore «mio» (6.3,
 * indaco) contro l'oro degli ospiti (6.2); in modifica il voto si sceglie con 4.12.
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
    <Panel
      title="Il mio voto"
      icon={<ChefHat />}
      meta="Il tuo voto personale: non entra nella media degli ospiti."
      actions={saved && !editing ? <MyRatingTag value={saved.rating} /> : undefined}
    >
      {saved && !editing ? (
        <div className="flex flex-col gap-3">
          {saved.note && <p className="rounded-ctl bg-mio-50 px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap">{saved.note}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Pencil />} onClick={startEdit}>
              Modifica
            </Button>
            <Button variant="danger" size="sm" icon={<Trash2 />} onClick={() => setConfirmDelete(true)}>
              Rimuovi
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] font-semibold text-grigio">Voto</span>
            <RatingInput value={rating} onChange={setRating} label="Il mio voto, da 1 a 10" />
          </div>
          <Field label="Nota (facoltativa)">
            {(p) => (
              <TextArea
                {...p}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Un promemoria per te: come l'hai trovata?"
              />
            )}
          </Field>
          {error && <FormError>{error}</FormError>}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" loading={busy}>
              {saved ? "Salva voto" : "Salva il mio voto"}
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
        title="Rimuovi il mio voto"
        message="Vuoi rimuovere il tuo voto personale per questa ricetta?"
        loading={busy}
      />
    </Panel>
  );
}
