"use client";
import { useState } from "react";
import Image from "next/image";
import { Check, MessageSquarePlus } from "lucide-react";
import { clsx } from "clsx";
import { Field, TextInput, TextArea } from "@/components/ds/Field";
import { Button } from "@/components/ds/Button";
import { Chip, RatingInput } from "@/components/ds/Controls";
import { An10Logo } from "@/components/brand/An10Logo";
import { FormError } from "@/components/admin/FormParts";

/**
 * Form pubblico «vota le ricette del menù» (`/recensisci/[token]`, restyle fase 6).
 * Percorso breve da telefono: nome (facoltativo), una scheda per ricetta con il voto 4.12,
 * «Non l'ho provato» e commento facoltativo, un solo bottone arancio in fondo. Campi a 16px.
 * Logica e payload invariati.
 */

interface RecipeOption {
  id: number;
  name: string;
  photo: string | null;
}

interface Entry {
  rating: number;
  comment: string;
  showComment: boolean;
  skipped: boolean;
}

const EMPTY_ENTRY: Entry = { rating: 0, comment: "", showComment: false, skipped: false };

const cardCls = "rounded-card border border-blu-150 bg-white p-4";

export function MenuReviewForm({ token, recipes }: { token: string; recipes: RecipeOption[] }) {
  const [nickname, setNickname] = useState("");
  const [entries, setEntries] = useState<Record<number, Entry>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ nickname: string } | null>(null);

  const entryFor = (id: number) => entries[id] ?? EMPTY_ENTRY;
  const update = (id: number, patch: Partial<Entry>) => {
    setEntries((prev) => ({ ...prev, [id]: { ...entryFor(id), ...patch } }));
  };

  const setRating = (id: number, rating: number) => update(id, { rating, skipped: false });
  const toggleSkip = (id: number) => {
    const entry = entryFor(id);
    update(id, entry.skipped ? { skipped: false } : { skipped: true, rating: 0 });
  };

  const ratedCount = Object.values(entries).filter((e) => e.rating > 0).length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ratings = Object.entries(entries)
      .filter(([, v]) => v.rating > 0)
      .map(([recipeId, v]) => ({ recipeId: Number(recipeId), rating: v.rating, comment: v.comment.trim() || undefined }));
    if (ratings.length === 0) { setError("Vota almeno una ricetta prima di inviare"); return; }

    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/recensisci/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim() || undefined, ratings }),
    });
    if (res.ok) {
      const d = await res.json();
      setDone({ nickname: d.nickname });
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Errore durante l'invio");
    }
    setSubmitting(false);
  };

  const restart = () => {
    setNickname("");
    setEntries({});
    setDone(null);
  };

  if (done) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-card border border-verde-200 bg-verde-50 px-5 py-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-verde text-white">
          <Check className="size-6" strokeWidth={3} aria-hidden />
        </span>
        <p className="text-[1.125rem] font-bold text-blu-950">Grazie per i tuoi voti, {done.nickname}!</p>
        <p className="text-[0.875rem] text-grigio">Sono stati registrati. Puoi chiudere la pagina.</p>
        <Button variant="secondary" onClick={restart} className="mt-1">
          Vota per un&apos;altra persona
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-(--gap)">
      <div className={cardCls}>
        <Field
          label="Il tuo nome"
          hint={nickname.trim() ? undefined : "Facoltativo: senza nome comparirai come «Ospite» con un numero."}
        >
          {(p) => (
            <TextInput
              {...p}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="given-name"
              placeholder="Come ti chiami?"
            />
          )}
        </Field>
      </div>

      <ul className="flex flex-col gap-(--gap)">
        {recipes.map((recipe) => {
          const entry = entryFor(recipe.id);
          return (
            <li key={recipe.id} className={clsx(cardCls, "flex flex-col gap-3", entry.skipped && "bg-blu-50")}>
              <div className="flex items-center gap-3">
                <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[0.75rem] bg-blu-100 text-blu-600">
                  {recipe.photo ? (
                    <Image src={recipe.photo} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <An10Logo variant="simbolo" title="" className="size-7" />
                  )}
                </div>
                <h2 className="line-clamp-2 min-w-0 flex-1 text-[1rem] font-bold leading-snug text-blu-950">{recipe.name}</h2>
              </div>

              {entry.skipped ? (
                <p className="text-[0.875rem] text-grigio">Non l&apos;hai provata: per questa ricetta non mandiamo nessun voto.</p>
              ) : (
                <RatingInput
                  value={entry.rating || null}
                  onChange={(rating) => setRating(recipe.id, rating)}
                  label={`Voto per ${recipe.name}, da 1 a 10`}
                />
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Chip active={entry.skipped} onClick={() => toggleSkip(recipe.id)}>
                  Non l&apos;ho provata
                </Chip>
                {!entry.skipped && !entry.showComment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<MessageSquarePlus />}
                    onClick={() => update(recipe.id, { showComment: true })}
                  >
                    Aggiungi un commento
                  </Button>
                )}
              </div>

              {!entry.skipped && entry.showComment && (
                <TextArea
                  value={entry.comment}
                  onChange={(e) => update(recipe.id, { comment: e.target.value })}
                  rows={2}
                  placeholder="Un commento (facoltativo)"
                  aria-label={`Commento su ${recipe.name}`}
                  autoFocus
                />
              )}
            </li>
          );
        })}
      </ul>

      {error && <FormError>{error}</FormError>}

      <Button type="submit" size="lg" loading={submitting} className="w-full @min-[620px]:w-auto @min-[620px]:self-end">
        {ratedCount > 0 ? `Invia ${ratedCount} vot${ratedCount === 1 ? "o" : "i"}` : "Invia i voti"}
      </Button>
    </form>
  );
}
