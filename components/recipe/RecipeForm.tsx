"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { type Category, type Tag } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IngredientRow { name: string; qty: string; unit: string }
interface StepRow { text: string; mins: string }
interface PhotoRow { url: string }

export interface RecipeFormData {
  name: string;
  servings: string;
  prep: string;
  cook: string;
  notes: string;
  links: string;
  photo: string;
  categoryIds: number[];
  tagIds: number[];
  ingredients: IngredientRow[];
  steps: StepRow[];
  photos: PhotoRow[];
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      {children}
    </section>
  );
}

// ─── RecipeForm ───────────────────────────────────────────────────────────────

export function RecipeForm({ recipeId, categories, tags, initialData }: Props) {
  const router = useRouter();
  const isEdit = !!recipeId;

  const [name, setName] = useState(initialData?.name ?? "");
  const [servings, setServings] = useState(initialData?.servings ?? "");
  const [prep, setPrep] = useState(initialData?.prep ?? "");
  const [cook, setCook] = useState(initialData?.cook ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [links, setLinks] = useState(initialData?.links ?? "");
  const [photo, setPhoto] = useState(initialData?.photo ?? "");
  const [categoryIds, setCategoryIds] = useState<number[]>(initialData?.categoryIds ?? []);
  const [tagIds, setTagIds] = useState<number[]>(initialData?.tagIds ?? []);
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initialData?.ingredients?.length ? initialData.ingredients : [{ name: "", qty: "", unit: "" }]
  );
  const [steps, setSteps] = useState<StepRow[]>(
    initialData?.steps?.length ? initialData.steps : [{ text: "", mins: "" }]
  );
  const [photos, setPhotos] = useState<PhotoRow[]>(initialData?.photos ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCat = (id: number) =>
    setCategoryIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleTag = (id: number) =>
    setTagIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const addIngredient = () => setIngredients((p) => [...p, { name: "", qty: "", unit: "" }]);
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

  const addPhoto = () => setPhotos((p) => [...p, { url: "" }]);
  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, j) => j !== i));
  const updatePhoto = (i: number, url: string) =>
    setPhotos((p) => p.map((r, j) => j === i ? { url } : r));

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Il nome è obbligatorio"); return; }
    setSaving(true);
    setError(null);

    const body = {
      name: name.trim(),
      servings: servings ? Number(servings) : null,
      prep: prep ? Number(prep) : null,
      cook: cook ? Number(cook) : null,
      notes: notes.trim() || null,
      links: links.trim() || null,
      photo: photo.trim() || null,
      categoryIds,
      tagIds,
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((i, order) => ({ name: i.name.trim(), qty: i.qty ? Number(i.qty) : null, unit: i.unit.trim() || null, order })),
      steps: steps
        .filter((s) => s.text.trim())
        .map((s, order) => ({ text: s.text.trim(), mins: s.mins ? Number(s.mins) : null, order })),
      photos: photos
        .filter((p) => p.url.trim())
        .map((p, order) => ({ url: p.url.trim(), order })),
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
  }, [name, servings, prep, cook, notes, links, photo, categoryIds, tagIds, ingredients, steps, photos, isEdit, recipeId, router]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Sticky top bar */}
      <div className="sticky top-[57px] z-30 -mx-4 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <h1 className="text-lg font-bold text-gray-900">
          {isEdit ? "Modifica ricetta" : "Nuova ricetta"}
        </h1>
        <div className="flex items-center gap-2">
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
      <Section title="Informazioni base">
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

      {/* 2. Foto principale */}
      <Section title="Foto principale">
        <div className="flex gap-4 items-start flex-wrap">
          {photo && (
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100">
              <Image src={photo} alt="Anteprima" fill className="object-cover" sizes="112px" />
            </div>
          )}
          <div className="flex-1 min-w-[200px] space-y-2">
            <Input value={photo} onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://res.cloudinary.com/..." />
            <div className="flex gap-2 flex-wrap">
              <ImageUploadButton onUrl={setPhoto} />
              {photo && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setPhoto("")}>
                  🗑 Rimuovi
                </Button>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Categorie */}
      {categories.length > 0 && (
        <Section title="Categorie">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c.id} type="button" onClick={() => toggleCat(c.id)}
                className={clsx(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  categoryIds.includes(c.id)
                    ? "border-transparent text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                )}
                style={categoryIds.includes(c.id) ? { backgroundColor: c.color, borderColor: c.color } : {}}>
                {categoryIds.includes(c.id) ? "✓ " : ""}{c.name}
              </button>
            ))}
          </div>
          {categoryIds.length > 0 && (
            <p className="text-xs text-gray-400">
              {categoryIds.length} categori{categoryIds.length === 1 ? "a" : "e"} selezionat{categoryIds.length === 1 ? "a" : "e"}
            </p>
          )}
        </Section>
      )}

      {/* 4. Tag */}
      {tags.length > 0 && (
        <Section title="Tag">
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
                className={clsx(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  tagIds.includes(t.id)
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                )}>
                #{t.name}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* 5. Ingredienti */}
      <Section title="Ingredienti">
        <div className="space-y-2">
          <div className="hidden sm:grid text-xs text-gray-400 font-medium pl-6 pr-8 gap-2"
            style={{ gridTemplateColumns: "4rem 5rem 1fr" }}>
            <span>Qtà</span><span>Unità</span><span>Ingrediente</span>
          </div>
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="flex flex-col shrink-0 gap-0">
                <button type="button" onClick={() => moveIngredient(i, -1)} disabled={i === 0}
                  className="text-[9px] leading-tight text-gray-300 hover:text-gray-500 disabled:opacity-20">▲</button>
                <button type="button" onClick={() => moveIngredient(i, 1)} disabled={i === ingredients.length - 1}
                  className="text-[9px] leading-tight text-gray-300 hover:text-gray-500 disabled:opacity-20">▼</button>
              </div>
              <input type="number" min={0} step="any" value={ing.qty}
                onChange={(e) => updateIngredient(i, "qty", e.target.value)} placeholder="Qtà"
                className="w-16 shrink-0 rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100" />
              <input type="text" value={ing.unit}
                onChange={(e) => updateIngredient(i, "unit", e.target.value)} placeholder="g/ml…"
                className="w-20 shrink-0 rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100" />
              <input type="text" value={ing.name}
                onChange={(e) => updateIngredient(i, "name", e.target.value)} placeholder="Ingrediente"
                className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100" />
              <button type="button" onClick={() => removeIngredient(i)}
                className="shrink-0 rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors">✕</button>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={addIngredient}>
          + Aggiungi ingrediente
        </Button>
      </Section>

      {/* 6. Procedura */}
      <Section title="Procedura">
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
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100" />
                  <span className="text-xs text-gray-400">minuti (opzionale)</span>
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

      {/* 7. Foto extra */}
      <Section title="Foto extra (galleria)">
        {photos.length === 0 && (
          <p className="text-sm text-gray-400">Nessuna foto extra. Aggiungine una qui sotto.</p>
        )}
        <div className="space-y-2">
          {photos.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              {p.url && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <Image src={p.url} alt="" fill className="object-cover" sizes="48px" />
                </div>
              )}
              <input type="text" value={p.url} onChange={(e) => updatePhoto(i, e.target.value)}
                placeholder="https://res.cloudinary.com/..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100" />
              <ImageUploadButton label="" small onUrl={(url) => updatePhoto(i, url)} />
              <button type="button" onClick={() => removePhoto(i)}
                className="shrink-0 rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors">✕</button>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={addPhoto}>
          + Aggiungi foto
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
