"use client";
import { useState } from "react";
import Image from "next/image";
import { MessageSquarePlus, PartyPopper, UtensilsCrossed } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RatingInput } from "@/components/ui/Rating";

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
      <div className="rounded-2xl border border-green-300/50 bg-green-100/70 backdrop-blur-sm px-6 py-8 flex flex-col items-center gap-3 text-center">
        <PartyPopper size={36} className="text-green-700" />
        <p className="text-lg font-bold text-green-900">Grazie per la tua recensione, {done.nickname}!</p>
        <p className="text-sm text-green-800/80">I tuoi voti sono stati registrati.</p>
        <Button variant="secondary" onClick={restart}>Vota un&apos;altra persona</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-2xl border border-white/25 bg-white/30 backdrop-blur-sm p-4 sm:p-5">
        <Input
          label="Il tuo nome"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Lascia vuoto per restare anonimo"
        />
        {!nickname.trim() && (
          <p className="mt-1.5 text-xs text-sky-700/70">Comparirai come «Ospite» seguito da un numero.</p>
        )}
      </div>

      <div className="space-y-3">
        {recipes.map((recipe) => {
          const entry = entryFor(recipe.id);
          return (
            <div key={recipe.id} className="rounded-2xl border border-white/25 bg-white/30 backdrop-blur-sm p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-sky-100">
                  {recipe.photo ? (
                    <Image src={recipe.photo} alt={recipe.name} fill className="object-cover" sizes="44px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg">🍽️</div>
                  )}
                </div>
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-sky-950">{recipe.name}</h3>
                <button
                  type="button"
                  onClick={() => toggleSkip(recipe.id)}
                  className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    entry.skipped
                      ? "border-sky-400 bg-sky-500 text-white"
                      : "border-white/40 bg-white/40 text-sky-700 active:bg-white/60"
                  }`}
                >
                  Non l&apos;ho provato
                </button>
              </div>

              {entry.skipped ? (
                <p className="flex items-center gap-1.5 text-xs text-sky-700/70">
                  <UtensilsCrossed size={12} /> Segnato come non provato — nessun voto verrà inviato per questa ricetta.
                </p>
              ) : (
                <>
                  <RatingInput value={entry.rating} onChange={(rating) => setRating(recipe.id, rating)} />

                  {entry.showComment ? (
                    <Textarea
                      value={entry.comment}
                      onChange={(e) => update(recipe.id, { comment: e.target.value })}
                      rows={2}
                      placeholder="Un commento (opzionale)"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => update(recipe.id, { showComment: true })}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 active:text-orange-700 transition-colors"
                    >
                      <MessageSquarePlus size={13} /> Aggiungi un commento
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" loading={submitting} className="w-full sm:w-auto">
        Invia {ratedCount > 0 ? `(${ratedCount} ricett${ratedCount === 1 ? "a" : "e"} votat${ratedCount === 1 ? "a" : "e"})` : ""}
      </Button>
    </form>
  );
}
