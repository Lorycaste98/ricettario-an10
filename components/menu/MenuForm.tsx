"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { X, Info, Plus, Users } from "lucide-react";
import { Button, IconButton } from "@/components/ds/Button";
import { Field, TextInput, TextArea, SearchField } from "@/components/ds/Field";
import { HiddenTag, QuickRecipeTag } from "@/components/ds/Tag";
import { Skeleton } from "@/components/ds/Progress";
import { ClocheIcon, LadleIcon } from "@/components/icons";
import { AdminThumb } from "@/components/admin/AdminTable";
import { FormBar, FormCard, FormError, rowFieldCls } from "@/components/admin/FormParts";
import { ReorderList, ReorderRow } from "@/components/ui/ReorderList";
import type { RecipeSummary } from "@/lib/types";

/*
 * Form menù (restyle fase 5C, tavola sezione 11): stessa barra e stessi blocchi del form ricetta.
 * Due colonne dagli 860px di contenitore: Informazioni | Ricette nel menù (11.8).
 * Solo aspetto: stato e payload sono quelli di sempre.
 */

interface Props {
  /** Se fornito, pre-popola il form per la modifica */
  initialData?: {
    id: number;
    name: string;
    description: string | null;
    date: string | null;
    servingTime: string | null;
    people: number | null;
    photo: string | null;
    published: boolean;
    recipeIds: number[];
    /** Porzioni override per ricetta (per recipeId); assente = usa il default della ricetta */
    recipeServings: Record<number, number | null>;
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
  const [people, setPeople] = useState(
    initialData?.people != null ? String(initialData.people) : ""
  );
  const [photo, setPhoto] = useState(initialData?.photo ?? "");
  const [published, setPublished] = useState(initialData?.published ?? true);

  // Ricette selezionate (in ordine) + porzioni override per ricetta (recipeId → porzioni)
  const [selectedIds, setSelectedIds] = useState<number[]>(initialData?.recipeIds ?? []);
  const [servingsById, setServingsById] = useState<Record<number, number | null>>(
    initialData?.recipeServings ?? {}
  );
  const [allRecipes, setAllRecipes] = useState<RecipeSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ricetta "veloce" (solo nome, niente scheda) creata al volo dal picker
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [creatingQuick, setCreatingQuick] = useState(false);

  // Carica tutte le ricette (incluse le "veloci", selezionabili solo qui)
  useEffect(() => {
    fetch("/api/recipes?limit=1000&includeQuick=1")
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

  // Porzioni override della ricetta nel menù: intero positivo, vuoto = usa il default
  const setServings = useCallback((id: number, raw: string) => {
    const n = parseInt(raw, 10);
    setServingsById((prev) => {
      const next = { ...prev };
      if (Number.isFinite(n) && n > 0) next[id] = n;
      else delete next[id];
      return next;
    });
  }, []);

  const addQuickRecipe = async () => {
    const name = quickName.trim();
    if (!name) return;
    setCreatingQuick(true);
    setError(null);
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quick: true }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Errore nella creazione della ricetta veloce");
      setCreatingQuick(false);
      return;
    }
    const created: RecipeSummary = await res.json();
    setAllRecipes((prev) => [...prev, created]);
    addRecipe(created.id);
    setQuickName("");
    setShowQuickForm(false);
    setCreatingQuick(false);
  };

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
      people: people.trim() ? Number(people) : null,
      photo: photo.trim() || null,
      published,
      recipes: selectedIds.map((recipeId) => ({
        recipeId,
        servings: servingsById[recipeId] ?? null,
      })),
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

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormBar
        title={name.trim() || (isEditing ? "Modifica menù" : "Nuovo menù")}
        published={published}
        onTogglePublished={() => setPublished((p) => !p)}
        publishedLabels={{ on: "Pronto", off: "Non pronto" }}
        onCancel={() => router.back()}
        saving={saving}
        saveLabel={isEditing ? "Salva" : "Crea"}
      />

      <div className="mx-auto grid max-w-6xl gap-(--gap) @min-[860px]:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.4fr)] @min-[860px]:items-start">
        {error && (
          <div className="@min-[860px]:col-span-2">
            <FormError>{error}</FormError>
          </div>
        )}

        <FormCard title="Informazioni" icon={<Info />}>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Nome menù" className="col-span-2">
              {(p) => <TextInput {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Cena di Natale" />}
            </Field>
            <Field label="Descrizione" className="col-span-2">
              {(p) => (
                <TextArea
                  {...p}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrizione dell'occasione…"
                  rows={2}
                />
              )}
            </Field>
            <Field label="Data">
              {(p) => <TextInput {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
            </Field>
            <Field
              label="Ora del servizio"
              hint={date ? "Serve a calcolare quando iniziare ogni ricetta." : "Prima scegli la data."}
            >
              {(p) => (
                <TextInput
                  {...p}
                  type="time"
                  value={servingTime}
                  onChange={(e) => setServingTime(e.target.value)}
                  disabled={!date}
                />
              )}
            </Field>
            <Field label="Persone">
              {(p) => (
                <TextInput
                  {...p}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  placeholder="Es. 8"
                />
              )}
            </Field>
            <Field label="Foto (indirizzo)" className="col-span-2">
              {(p) => <TextInput {...p} type="url" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://…" />}
            </Field>
          </div>
        </FormCard>

        <FormCard
          title="Ricette nel menù"
          icon={<ClocheIcon />}
          aside={selectedIds.length > 0 ? <span className="tabular">{selectedIds.length}</span> : undefined}
        >
          {/* 11.8 · ricette scelte, in ordine, con le porzioni per questo menù */}
          {selectedRecipes.length > 0 && (
            <ReorderList as="ul" values={selectedIds} onReorder={setSelectedIds} className="mb-2">
              {selectedRecipes.map((r) => (
                <ReorderRow
                  as="li"
                  key={r.id}
                  value={r.id}
                  handleSize="h-[1.875rem] w-6"
                  className="flex items-center gap-2 border-b border-blu-150 bg-white py-[0.375em] last:border-0"
                >
                  {(handle) => (
                    <>
                      {handle}
                      {/* sul telefono la miniatura ruberebbe spazio al nome */}
                      <span className="contents @max-[479px]:hidden">
                        <AdminThumb src={r.photo} alt="" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 leading-snug font-bold">{r.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-grigio">
                          {r.quick ? (
                            <QuickRecipeTag />
                          ) : (
                            <span>
                              ricetta: {r.servings != null ? `${r.servings} ${r.servingsUnit?.trim() || "persone"}` : "porzioni non indicate"}
                            </span>
                          )}
                          {!r.published && <HiddenTag />}
                        </div>
                      </div>
                      {/* Porzioni per questo menù (vuoto = quelle della ricetta). Le ricette
                          veloci non hanno ingredienti né porzioni: niente campo */}
                      {!r.quick && (
                        <label className="flex shrink-0 items-center gap-1 text-grigio">
                          <input
                            type="number"
                            min={1}
                            inputMode="numeric"
                            value={servingsById[r.id] != null ? String(servingsById[r.id]) : ""}
                            onChange={(e) => setServings(r.id, e.target.value)}
                            placeholder={r.servings != null ? String(r.servings) : "—"}
                            aria-label={`Porzioni di ${r.name} in questo menù`}
                            title="Porzioni per questo menù (vuoto = quelle della ricetta)"
                            className={clsx(rowFieldCls, "w-[3.75rem] text-center text-[0.9375rem]")}
                          />
                          <Users className="size-4" aria-hidden />
                        </label>
                      )}
                      <IconButton size="row" tone="danger" label={`Togli ${r.name} dal menù`} onClick={() => removeRecipe(r.id)}>
                        <X />
                      </IconButton>
                    </>
                  )}
                </ReorderRow>
              ))}
            </ReorderList>
          )}

          {/* 11.6 · cerca e aggiungi, oppure crea una ricetta veloce (solo il nome) */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <SearchField
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca ricette da aggiungere…"
                aria-label="Cerca ricette da aggiungere"
                className="flex-1"
              />
              <Button
                variant={showQuickForm ? "secondary" : "tonal"}
                onClick={() => setShowQuickForm((v) => !v)}
                icon={<LadleIcon />}
                title="Aggiungi una ricetta veloce: solo un nome, senza scheda (es. «Arrosticini»)"
                aria-expanded={showQuickForm}
              >
                Veloce
              </Button>
            </div>

            {showQuickForm && (
              <div className="flex items-center gap-2 rounded-[0.75rem] border border-blu-150 bg-blu-50 p-2">
                <TextInput
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addQuickRecipe();
                    }
                  }}
                  placeholder="Nome (es. Arrosticini, Insalata…)"
                  aria-label="Nome della ricetta veloce"
                  autoFocus
                />
                <Button variant="tonal" onClick={addQuickRecipe} loading={creatingQuick} disabled={!quickName.trim()} icon={<Plus />}>
                  Aggiungi
                </Button>
              </div>
            )}

            {loadingRecipes ? (
              <div className="flex flex-col gap-1.5" aria-label="Caricamento ricette">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11" />
                ))}
              </div>
            ) : filteredRecipes.length === 0 ? (
              <p className="py-3 text-center text-[0.875rem] text-grigio">
                {search ? "Nessuna ricetta trovata" : "Tutte le ricette sono già nel menù"}
              </p>
            ) : (
              <ul className="flex max-h-72 flex-col overflow-y-auto rounded-[0.75rem] border border-blu-150">
                {filteredRecipes.map((r) => (
                  <li key={r.id} className="border-b border-blu-150 last:border-0">
                    <button
                      type="button"
                      onClick={() => addRecipe(r.id)}
                      disabled={!r.published}
                      title={r.published ? undefined : "Ricetta non pronta: rendila visibile per poterla aggiungere"}
                      className="flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors enabled:hover:bg-blu-100 disabled:cursor-not-allowed"
                    >
                      <AdminThumb src={r.photo} alt="" />
                      <span className={clsx("min-w-0 flex-1 truncate", !r.published && "text-grigio")}>{r.name}</span>
                      {r.quick && <QuickRecipeTag />}
                      {r.published ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[0.8125rem] font-semibold text-blu-600">
                          <Plus className="size-4" aria-hidden />
                          Aggiungi
                        </span>
                      ) : (
                        <HiddenTag />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FormCard>
      </div>
    </form>
  );
}
