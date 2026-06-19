"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { clsx } from "clsx";
import { Info, ImageIcon, Tag as TagIcon, Hash, Carrot, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { IngredientCombobox } from "@/components/ui/IngredientCombobox";
import { CategoryCombobox } from "@/components/ui/CategoryCombobox";
import { TagCombobox } from "@/components/ui/TagCombobox";
import { SectionHeader, type SectionTone } from "@/components/ui/SectionHeader";
import { type Category, type Tag } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IngredientRow { name: string; qty: string; unit: string; description: string }
interface StepRow { text: string; mins: string }
/** Riga foto interna al form: url + flag per la foto principale */
interface PhotoRow { url: string; isMain: boolean }

export interface RecipeFormData {
  name: string;
  servings: string;
  prep: string;
  cook: string;
  notes: string;
  links: string;
  /** URL della foto principale (mostrata nei card/lista) */
  photo: string;
  categoryIds: number[];
  tagIds: number[];
  ingredients: IngredientRow[];
  steps: StepRow[];
  /** Foto extra della galleria (NON include la foto principale) */
  photos: { url: string }[];
}

interface Props {
  recipeId?: number;
  categories: Category[];
  tags: Tag[];
  initialData?: RecipeFormData;
}

// ─── Cloudinary upload ────────────────────────────────────────────────────────

async function uploadToCloudinary(file: File): Promise<string> {
  const sigRes = await fetch("/api/upload");
  if (!sigRes.ok) throw new Error("Impossibile ottenere la firma di upload");
  const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json() as {
    signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string;
  };
  const formData = new FormData();
  formData.append("file", file);
  formData.append("signature", signature);
  formData.append("timestamp", String(timestamp));
  formData.append("api_key", apiKey);
  formData.append("folder", folder);
  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!uploadRes.ok) throw new Error("Upload su Cloudinary fallito");
  const data = await uploadRes.json() as { secure_url: string };
  return data.secure_url;
}

// ─── ImageUploadButton ────────────────────────────────────────────────────────

function ImageUploadButton({ onUrl, label = "Carica foto", small = false }: {
  onUrl: (url: string) => void; label?: string; small?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadToCloudinary(file);
      onUrl(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Errore upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <Button type="button" variant="secondary" size={small ? "sm" : "md"} loading={uploading}
        onClick={() => inputRef.current?.click()}>
        📷 {label}
      </Button>
      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  tone = "sky",
  hint,
  delay = 0,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone?: SectionTone;
  hint?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className="fade-up rounded-2xl border border-white/50 bg-white/60 backdrop-blur-sm p-5 sm:p-6 shadow-sm space-y-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <SectionHeader title={title} icon={icon} tone={tone} hint={hint} />
      {children}
    </section>
  );
}

// ─── shared inline input class ────────────────────────────────────────────────

const inlineInput =
  "rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm px-2 py-2 text-sm text-sky-950 placeholder:text-sky-600/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/30";

// ─── RecipeForm ───────────────────────────────────────────────────────────────

export function RecipeForm({ recipeId, categories, tags, initialData }: Props) {
  const router = useRouter();
  const isEdit = !!recipeId;

  // Liste locali: le categorie/tag creati al volo dalla form appaiono subito
  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [tagList, setTagList] = useState<Tag[]>(tags);

  const [name, setName] = useState(initialData?.name ?? "");
  const [servings, setServings] = useState(initialData?.servings ?? "");
  const [prep, setPrep] = useState(initialData?.prep ?? "");
  const [cook, setCook] = useState(initialData?.cook ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [links, setLinks] = useState(initialData?.links ?? "");
  const [categoryIds, setCategoryIds] = useState<number[]>(initialData?.categoryIds ?? []);
  const [tagIds, setTagIds] = useState<number[]>(initialData?.tagIds ?? []);
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initialData?.ingredients?.length ? initialData.ingredients : [{ name: "", qty: "", unit: "", description: "" }]
  );
  const [steps, setSteps] = useState<StepRow[]>(
    initialData?.steps?.length ? initialData.steps : [{ text: "", mins: "" }]
  );
  /**
   * Tutte le foto della ricetta in un unico array.
   * isMain = true indica la foto principale (mostrata nei card / lista).
   * Alla creazione la prima foto caricata diventa automaticamente principale.
   */
  const [photos, setPhotos] = useState<PhotoRow[]>(() => {
    const mainUrl = initialData?.photo?.trim() ?? "";
    const gallery = (initialData?.photos ?? []).map((p) => p.url.trim()).filter(Boolean);
    // Unifica: metti la foto principale per prima, poi le altre senza duplicati
    const allUrls = mainUrl
      ? [mainUrl, ...gallery.filter((u) => u !== mainUrl)]
      : [...gallery];
    if (allUrls.length === 0) return [];
    return allUrls.map((url, i) => ({ url, isMain: i === 0 && !!mainUrl }));
  });
  const [allIngredients, setAllIngredients] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ingredients")
      .then((r) => r.json())
      .then((data: Array<{ name: string }>) =>
        setAllIngredients(data.map((d) => d.name))
      )
      .catch(() => {});
  }, []);

  const handleNewIngredient = (name: string) => {
    setAllIngredients((prev) =>
      [...prev, name].sort((a, b) => a.localeCompare(b, "it"))
    );
  };

  const handleNewCategory = (cat: Category) => {
    setCategoryList((prev) =>
      [...prev, cat].sort((a, b) => a.name.localeCompare(b.name, "it"))
    );
    setCategoryIds((prev) => (prev.includes(cat.id) ? prev : [...prev, cat.id]));
  };

  const handleNewTag = (tag: Tag) => {
    setTagList((prev) =>
      [...prev, tag].sort((a, b) => a.name.localeCompare(b.name, "it"))
    );
    setTagIds((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
  };

  const toggleCat = (id: number) =>
    setCategoryIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleTag = (id: number) =>
    setTagIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const addIngredient = () => setIngredients((p) => [...p, { name: "", qty: "", unit: "", description: "" }]);
  const removeIngredient = (i: number) => setIngredients((p) => p.filter((_, j) => j !== i));
  const updateIngredient = (i: number, f: keyof IngredientRow, v: string) =>
    setIngredients((p) => p.map((r, j) => j === i ? { ...r, [f]: v } : r));
  const moveIngredient = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= ingredients.length) return;
    setIngredients((p) => { const a = [...p]; [a[i], a[j]] = [a[j], a[i]]; return a; });
  };

  const addStep = () => setSteps((p) => [...p, { text: "", mins: "" }]);
  const removeStep = (i: number) => setSteps((p) => p.filter((_, j) => j !== i));
  const updateStep = (i: number, f: keyof StepRow, v: string) =>
    setSteps((p) => p.map((r, j) => j === i ? { ...r, [f]: v } : r));
  const moveStep = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= steps.length) return;
    setSteps((p) => { const a = [...p]; [a[i], a[j]] = [a[j], a[i]]; return a; });
  };

  const addPhoto = () => setPhotos((p) => [...p, { url: "", isMain: false }]);
  const removePhoto = (i: number) =>
    setPhotos((prev) => {
      const next = prev.filter((_, j) => j !== i);
      // Se eliminata era la principale, promuovi la prima rimasta
      const wasMain = prev[i]?.isMain;
      if (wasMain && next.length > 0 && next[0].url) {
        return next.map((r, j) => ({ ...r, isMain: j === 0 }));
      }
      return next;
    });
  const updatePhoto = (i: number, url: string) =>
    setPhotos((prev) =>
      prev.map((r, j) => (j === i ? { ...r, url } : r))
    );
  /** Imposta la foto all'indice `i` come principale. */
  const setPhotoAsMain = (i: number) =>
    setPhotos((prev) => prev.map((r, j) => ({ ...r, isMain: j === i })));
  /** Aggiunge direttamente una foto già caricata su Cloudinary. */
  const addPhotoWithUrl = (url: string) =>
    setPhotos((prev) => {
      const isFirstMain = prev.length === 0;
      return [...prev, { url, isMain: isFirstMain }];
    });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Il nome è obbligatorio"); return; }
    setSaving(true);
    setError(null);

    const validPhotos = photos.filter((p) => p.url.trim());
    // La foto principale: quella marcata come main, o la prima disponibile
    const mainPhoto =
      validPhotos.find((p) => p.isMain) ?? validPhotos[0] ?? null;

    const body = {
      name: name.trim(),
      servings: servings ? Number(servings) : null,
      prep: prep ? Number(prep) : null,
      cook: cook ? Number(cook) : null,
      notes: notes.trim() || null,
      links: links.trim() || null,
      photo: mainPhoto?.url.trim() || null,
      categoryIds,
      tagIds,
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((i, order) => ({ name: i.name.trim(), qty: i.qty ? Number(i.qty) : null, unit: i.unit.trim() || null, description: i.description.trim() || null, order })),
      steps: steps
        .filter((s) => s.text.trim())
        .map((s, order) => ({ text: s.text.trim(), mins: s.mins ? Number(s.mins) : null, order })),
      photos: validPhotos.map((p, order) => ({ url: p.url.trim(), order })),
    };

    try {
      const res = isEdit
        ? await fetch(`/api/recipes/${recipeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/recipes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "Errore nel salvataggio");
      }

      const saved = await res.json() as { id: number };
      const targetId = isEdit ? recipeId : saved.id;
      router.push(`/ricette/${targetId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
      setSaving(false);
    }
  }, [name, servings, prep, cook, notes, links, categoryIds, tagIds, ingredients, steps, photos, isEdit, recipeId, router]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Sticky top bar */}
      <div className="sticky z-30 flex items-center justify-between gap-3 rounded-b-2xl border border-white/50 bg-white/70 backdrop-blur-xl px-5 py-3 shadow-lg shadow-black/[0.07] ring-1 ring-black/[0.04]" style={{ top: "calc(env(safe-area-inset-top, 0px) + 56px)" }}>
        <h1 className="text-sm font-semibold text-gray-800 truncate">
          {isEdit ? "Modifica ricetta" : "Nuova ricetta"}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
            Annulla
          </Button>
          <Button type="submit" size="sm" loading={saving}>
            {isEdit ? "Salva modifiche" : "Crea ricetta"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* 1. Info base */}
      <Section title="Informazioni base" icon={<Info size={18} />} tone="sky" delay={0}>
        <Input label="Nome ricetta *" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Es. Risotto allo zafferano" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Input label="Porzioni" type="number" min={1} value={servings}
            onChange={(e) => setServings(e.target.value)} placeholder="4" />
          <Input label="Preparazione (min)" type="number" min={0} value={prep}
            onChange={(e) => setPrep(e.target.value)} placeholder="20" />
          <Input label="Cottura (min)" type="number" min={0} value={cook}
            onChange={(e) => setCook(e.target.value)} placeholder="30" />
        </div>
        <Textarea label="Note" value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={3} placeholder="Consigli, varianti, sostituzioni..." />
        <Input label="Link fonte" type="url" value={links}
          onChange={(e) => setLinks(e.target.value)} placeholder="https://..." />
      </Section>

      {/* 2. Foto */}
      <Section
        title="Foto"
        icon={<ImageIcon size={18} />}
        tone="violet"
        delay={60}
        hint="La foto ⭐ Principale è mostrata nei card e nella lista."
      >

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p, i) => (
              <div
                key={i}
                className={clsx(
                  "relative overflow-hidden rounded-xl bg-gray-100 aspect-square",
                  p.isMain && "ring-2 ring-orange-400"
                )}
              >
                {/* Anteprima immagine */}
                {p.url ? (
                  <Image
                    src={p.url}
                    alt={`Foto ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300 text-3xl">
                    📷
                  </div>
                )}

                {/* Badge principale */}
                <button
                  type="button"
                  onClick={() => setPhotoAsMain(i)}
                  title={p.isMain ? "Foto principale" : "Imposta come principale"}
                  className={clsx(
                    "absolute bottom-0 left-0 right-0 py-1 text-center text-[11px] font-semibold transition-colors",
                    p.isMain
                      ? "bg-orange-500/90 text-white"
                      : "bg-black/40 text-white/80 hover:bg-orange-500/80"
                  )}
                >
                  {p.isMain ? "⭐ Principale" : "Imposta principale"}
                </button>

                {/* Pulsante elimina */}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  title="Elimina foto"
                  className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full bg-black/40 w-6 h-6 text-white hover:bg-red-500 transition-colors text-xs"
                >
                  ✕
                </button>

                {/* Sostituisci (se vuota o per aggiornare) */}
                {!p.url && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageUploadButton
                      small
                      label="Carica"
                      onUrl={(url) => updatePhoto(i, url)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap items-center">
          {/* Carica e aggiungi direttamente */}
          <ImageUploadButton
            label="Aggiungi foto"
            onUrl={addPhotoWithUrl}
          />
          {/* Aggiungi riga vuota (per incollare URL manualmente) */}
          <Button type="button" variant="ghost" size="sm" onClick={addPhoto}>
            + Inserisci URL
          </Button>
        </div>

        {/* Righe per URL manuali (foto senza immagine caricata) */}
        {photos.some((p) => !p.url) && (
          <div className="space-y-2 mt-1">
            {photos.map((p, i) =>
              !p.url ? (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-sky-600 w-5 shrink-0">{i + 1}.</span>
                  <input
                    type="text"
                    value={p.url}
                    onChange={(e) => updatePhoto(i, e.target.value)}
                    placeholder="https://res.cloudinary.com/..."
                    className={inlineInput + " flex-1"}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="shrink-0 rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : null
            )}
          </div>
        )}
      </Section>

      {/* 3. Categorie — wrapper z-20: ogni Section ha backdrop-blur (nuovo stacking
          context), quindi il dropdown va sollevato sopra le sezioni successive.
          Resta sotto la top bar sticky (z-30). */}
      <div className="relative z-20">
      <Section
        title="Categorie"
        icon={<TagIcon size={18} />}
        tone="orange"
        delay={120}
        hint="Cerca tra quelle esistenti o creane una nuova al volo."
      >
        <CategoryCombobox
          categories={categoryList}
          selectedIds={categoryIds}
          onToggle={toggleCat}
          onCreated={handleNewCategory}
          className={inlineInput + " w-full"}
        />
      </Section>
      </div>

      {/* 4. Tag — wrapper z-[15] (sotto Categorie, sopra Ingredienti) */}
      <div className="relative z-[15]">
      <Section
        title="Tag"
        icon={<Hash size={18} />}
        tone="amber"
        delay={180}
        hint="Cerca tra quelli esistenti o creane uno nuovo al volo."
      >
        <TagCombobox
          tags={tagList}
          selectedIds={tagIds}
          onToggle={toggleTag}
          onCreated={handleNewTag}
          className={inlineInput + " w-full"}
        />
      </Section>
      </div>

      {/* 5. Ingredienti — z-10 wrapper lifts this stacking context above the Procedura section */}
      <div className="relative z-10">
      <Section title="Ingredienti" icon={<Carrot size={18} />} tone="emerald" delay={240}>
        <div className="space-y-1.5">
          {/* Header — stessa griglia delle righe */}
          <div
            className="hidden sm:grid items-center gap-2 px-1 text-xs font-medium text-sky-600"
            style={{ gridTemplateColumns: "1.25rem 4rem 5rem 1fr 1.5rem" }}
          >
            <span />
            <span>Qtà</span>
            <span>Unità</span>
            <span>Ingrediente / Descrizione</span>
            <span />
          </div>

          {ingredients.map((ing, i) => (
            <div
              key={i}
              className="grid items-start gap-2"
              style={{ gridTemplateColumns: "1.25rem 4rem 5rem 1fr 1.5rem" }}
            >
              {/* Frecce */}
              <div className="flex flex-col items-center gap-0 pt-2">
                <button type="button" onClick={() => moveIngredient(i, -1)} disabled={i === 0}
                  className="text-[9px] leading-tight text-sky-400 hover:text-sky-700 disabled:opacity-20">▲</button>
                <button type="button" onClick={() => moveIngredient(i, 1)} disabled={i === ingredients.length - 1}
                  className="text-[9px] leading-tight text-sky-400 hover:text-sky-700 disabled:opacity-20">▼</button>
              </div>
              <input type="number" min={0} step="any" value={ing.qty}
                onChange={(e) => updateIngredient(i, "qty", e.target.value)} placeholder="Qtà"
                className={inlineInput + " w-full"} />
              <input type="text" value={ing.unit}
                onChange={(e) => updateIngredient(i, "unit", e.target.value)} placeholder="g/ml…"
                className={inlineInput + " w-full"} />
              <div className="flex flex-col gap-1">
                <IngredientCombobox
                  value={ing.name}
                  onChange={(v) => updateIngredient(i, "name", v)}
                  allIngredients={allIngredients}
                  onNewIngredient={handleNewIngredient}
                  placeholder="Ingrediente"
                  className={inlineInput + " w-full"}
                />
                <input type="text" value={ing.description}
                  onChange={(e) => updateIngredient(i, "description", e.target.value)}
                  placeholder="descrizione (es. fredda, bollente…)"
                  className={inlineInput + " w-full text-xs opacity-80"}
                />
              </div>
              <button type="button" onClick={() => removeIngredient(i)}
                className="flex items-center justify-center rounded p-1 text-sky-300 hover:text-red-400 transition-colors pt-2">✕</button>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={addIngredient}>
          + Aggiungi ingrediente
        </Button>
      </Section>
      </div>

      {/* 6. Procedura */}
      <Section title="Procedura" icon={<ListOrdered size={18} />} tone="sky" delay={300}>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white mt-2">
                {i + 1}
              </span>
              <div className="flex-1 space-y-1.5">
                <Textarea value={step.text} onChange={(e) => updateStep(i, "text", e.target.value)}
                  placeholder={`Descrivi il passo ${i + 1}...`} rows={2} />
                <div className="flex items-center gap-2">
                  <input type="number" min={0} value={step.mins}
                    onChange={(e) => updateStep(i, "mins", e.target.value)} placeholder="—"
                    className={inlineInput} />
                  <span className="text-xs text-sky-600">minuti (opzionale)</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 pt-2 shrink-0">
                <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0}
                  className="text-[9px] leading-tight text-gray-300 hover:text-gray-500 disabled:opacity-20">▲</button>
                <button type="button" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1}
                  className="text-[9px] leading-tight text-gray-300 hover:text-gray-500 disabled:opacity-20">▼</button>
                <button type="button" onClick={() => removeStep(i)}
                  className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors text-xs mt-0.5">✕</button>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={addStep}>
          + Aggiungi passo
        </Button>
      </Section>

      {/* Bottom save */}
      <div className="flex justify-end gap-3 pb-10">
        <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>
          Annulla
        </Button>
        <Button type="submit" size="lg" loading={saving}>
          {isEdit ? "💾 Salva modifiche" : "✅ Crea ricetta"}
        </Button>
      </div>
    </form>
  );
}
