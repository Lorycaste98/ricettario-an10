"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search, X, ChevronUp, ChevronDown, Loader2, UtensilsCrossed, CalendarDays, Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { RecipeSummary } from "@/lib/types";

interface Props {
  /** Se fornito, pre-popola il form per la modifica */
  initialData?: {
    id: number;
    name: string;
    description: string | null;
    date: string | null;
    servingTime: string | null;
    photo: string | null;
    recipeIds: number[];
  };
}

export function MenuForm({ initialData }: Props) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [date, setDate] = useState(
    initialData?.date ? initialData.date.slice(0, 10) : ""
  );
  const [servingTime, setServingTime] = useState(initialData?.servingTime ?? "");
  const [photo, setPhoto] = useState(initialData?.photo ?? "");

  // Ricette selezionate (in ordine)
  const [selectedIds, setSelectedIds] = useState<number[]>(initialData?.recipeIds ?? []);
  const [allRecipes, setAllRecipes] = useState<RecipeSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carica tutte le ricette
  useEffect(() => {
    fetch("/api/recipes?limit=1000")
      .then((r) => r.json())
      .then((d) => setAllRecipes(d.data ?? []))
      .finally(() => setLoadingRecipes(false));
  }, []);

  const filteredRecipes = allRecipes.filter(
    (r) =>
      !selectedIds.includes(r.id) &&
      r.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedRecipes = selectedIds
    .map((id) => allRecipes.find((r) => r.id === id))
    .filter(Boolean) as RecipeSummary[];

  const addRecipe = useCallback((id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeRecipe = useCallback((id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((idx: number) => {
    setSelectedIds((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Il nome del menu è obbligatorio"); return; }
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      date: date || null,
      servingTime: date && servingTime ? servingTime : null,
      photo: photo.trim() || null,
      recipeIds: selectedIds,
    };

    const res = await fetch(
      isEditing ? `/api/menus/${initialData!.id}` : "/api/menus",
      {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Errore nel salvataggio");
      setSaving(false);
      return;
    }

    router.push("/admin/menu");
    router.refresh();
  };

  const inputCls =
    "w-full rounded-xl border border-white/30 bg-white/20 px-3 py-2.5 text-sm text-sky-950 placeholder:text-sky-700/50 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-300/60 backdrop-blur-sm transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sticky top bar — stesso stile del form ricetta */}
      <div className="sticky top-[65px] z-30 flex items-center justify-between gap-3 rounded-b-2xl border border-white/50 bg-white/70 backdrop-blur-xl px-5 py-3 shadow-lg shadow-black/[0.07] ring-1 ring-black/[0.04]">
        <h1 className="text-sm font-semibold text-gray-800 truncate">
          {isEditing ? "Modifica menù" : "Nuovo menù"}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
            Annulla
          </Button>
          <Button type="submit" size="sm" loading={saving}>
            {isEditing ? "Salva modifiche" : "Crea menù"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300/40 bg-red-50/60 px-4 py-3 text-sm text-red-700 backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Campi base */}
      <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-sm p-5 sm:p-6 shadow-sm space-y-4">
        <SectionHeader title="Informazioni" icon={<Info size={18} />} tone="sky" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-sky-800">Nome menu *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Cena di Natale"
              className={inputCls}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-sky-800">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrizione dell'occasione…"
              rows={2}
              className={inputCls + " resize-none"}
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-sky-800">
              <CalendarDays size={12} /> Data e ora servizio (opzionale)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls + " flex-1"}
              />
              <input
                type="time"
                value={servingTime}
                onChange={(e) => setServingTime(e.target.value)}
                disabled={!date}
                title={date ? "Ora in cui i piatti vengono serviti" : "Imposta prima la data"}
                className={inputCls + " w-28 disabled:opacity-40"}
              />
            </div>
            {date && (
              <p className="mt-1 text-[11px] text-sky-600/70">
                L&apos;ora abilita il calcolo dell&apos;orario in cui iniziare ogni ricetta.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-sky-800">URL Foto (opzionale)</label>
            <input
              type="url"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://…"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Selezione ricette */}
      <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-sm p-5 sm:p-6 shadow-sm space-y-4">
        <SectionHeader
          title="Ricette nel menù"
          icon={<UtensilsCrossed size={18} />}
          tone="orange"
          hint="Cerca e ordina le ricette che compongono il menù."
          action={
            selectedIds.length > 0 ? (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-2 text-xs font-bold text-white">
                {selectedIds.length}
              </span>
            ) : undefined
          }
        />

        {/* Lista ordinata delle selezionate */}
        {selectedRecipes.length > 0 && (
          <ul className="space-y-2">
            {selectedRecipes.map((r, idx) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-white/30 bg-white/50 px-3 py-2"
              >
                {/* Thumb */}
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-sky-100">
                  {r.photo ? (
                    <Image src={r.photo} alt={r.name} fill className="object-cover" sizes="36px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <UtensilsCrossed size={14} className="text-sky-300" />
                    </div>
                  )}
                </div>
                {/* Name */}
                <span className="flex-1 min-w-0 text-sm font-medium text-sky-950 truncate">{r.name}</span>
                {/* Order number */}
                <span className="shrink-0 text-[10px] font-bold text-sky-400/60">#{idx + 1}</span>
                {/* Move buttons */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="flex h-5 w-5 items-center justify-center rounded text-sky-600 hover:bg-sky-100 disabled:opacity-25 transition"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === selectedRecipes.length - 1}
                    className="flex h-5 w-5 items-center justify-center rounded text-sky-600 hover:bg-sky-100 disabled:opacity-25 transition"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeRecipe(r.id)}
                  className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-sky-400 hover:bg-red-50 hover:text-red-500 transition"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Cerca e aggiungi */}
        <div>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca ricette da aggiungere…"
              className={inputCls + " pl-8"}
            />
          </div>

          {loadingRecipes ? (
            <div className="flex items-center gap-2 py-4 text-sm text-sky-600">
              <Loader2 size={14} className="animate-spin" /> Caricamento ricette…
            </div>
          ) : filteredRecipes.length === 0 ? (
            <p className="py-3 text-center text-xs text-sky-600/60">
              {search ? "Nessuna ricetta trovata" : "Tutte le ricette sono già nel menu"}
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-white/20 bg-white/30 p-1">
              {filteredRecipes.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => addRecipe(r.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/60 transition"
                  >
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-sky-100">
                      {r.photo ? (
                        <Image src={r.photo} alt={r.name} fill className="object-cover" sizes="32px" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <UtensilsCrossed size={12} className="text-sky-300" />
                        </div>
                      )}
                    </div>
                    <span className="flex-1 min-w-0 text-sm text-sky-950 truncate">{r.name}</span>
                    <span className="shrink-0 text-[10px] font-semibold text-sky-400">+ Aggiungi</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-white/30 bg-white/30 px-4 py-2.5 text-sm font-medium text-sky-800 hover:bg-white/50 transition backdrop-blur-sm"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition shadow-sm"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {isEditing ? "Salva modifiche" : "Crea menu"}
        </button>
      </div>
    </form>
  );
}

