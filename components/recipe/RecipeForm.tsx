"use client";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { clsx } from "clsx";
import { Info, ImageIcon, Tag as TagIcon, Hash, Carrot, ListOrdered, Camera, Star, X, TriangleAlert, Save, CircleCheck, Layers, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { IngredientCombobox } from "@/components/ui/IngredientCombobox";
import { CategoryCombobox } from "@/components/ui/CategoryCombobox";
import { TagCombobox } from "@/components/ui/TagCombobox";
import { SectionHeader, type SectionTone } from "@/components/ui/SectionHeader";
import { PublishSwitch } from "@/components/ui/PublishSwitch";
import { ReorderList, ReorderRow } from "@/components/ui/ReorderList";
import { type Category, type Tag, type StepKind, STEP_KINDS, STEP_KIND_LABEL } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

// `uid` = identità stabile della riga per il drag & drop (le key per indice
// rompono il Reorder); generato client-side, mai inviato all'API.
interface IngredientRow { uid: string; name: string; qty: string; unit: string; description: string; optional: boolean; section: string }
interface StepRow { uid: string; text: string; mins: string; kind: StepKind }

const uid = () => crypto.randomUUID();
const emptyIngredient = (section = ""): IngredientRow => ({ uid: uid(), name: "", qty: "", unit: "", description: "", optional: false, section });
const emptyStep = (): StepRow => ({ uid: uid(), text: "", mins: "", kind: "PREP" });
/** Riga foto interna al form: url + flag per la foto principale */
interface PhotoRow { url: string; isMain: boolean }

export interface RecipeFormData {
  name: string;
  /** Data della ricetta (createdAt) in formato "YYYY-MM-DD" */
  createdAt: string;
  servings: string;
  /** Unità delle porzioni (es. "teglie da 28cm"); vuota = persone/porzioni */
  servingsUnit: string;
  prep: string;
  cook: string;
  notes: string;
  links: string;
  /** URL della foto principale (mostrata nei card/lista) */
  photo: string;
  /** Ricetta pronta (visibile ai visitatori). false = "non pronta", nascosta */
  published: boolean;
  categoryIds: number[];
  tagIds: number[];
  ingredients: Omit<IngredientRow, "uid">[];
  steps: Omit<StepRow, "uid">[];
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
        <Camera size={15} /> {label}
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
  className,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone?: SectionTone;
  hint?: string;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={clsx(
        "fade-up rounded-2xl border border-white/50 bg-white/60 backdrop-blur-sm p-3 sm:p-6 shadow-sm space-y-2.5 sm:space-y-4",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <SectionHeader title={title} icon={icon} tone={tone} hint={hint} />
      {children}
    </section>
  );
}

// ─── shared inline input / icon-button classes ────────────────────────────────

/**
 * Bottone icona delle righe (rimuovi, aggiungi descrizione): pastiglia chiara
 * fissa invece di una semplice icona tenue. Sullo sfondo a gradiente dell'app le
 * icone `sky-300`/`gray-300` diventavano invisibili in alcune zone. Stessa
 * impostazione dei bottoni riga del form menù e della maniglia di `ReorderList`.
 */
const rowIconBtn =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/60 bg-white/70 shadow-sm transition-colors";
const rowIconBtnNeutral = `${rowIconBtn} text-sky-600 hover:bg-white hover:text-sky-900`;
const rowIconBtnDanger = `${rowIconBtn} text-rose-500 hover:bg-rose-50 hover:text-rose-600`;


// py-1.5 su mobile (~34px), py-2 da sm in su — vedi anche `Input` in components/ui/Input.tsx
const inlineInput =
  "rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm px-2 py-1.5 sm:py-2 text-sm text-sky-950 placeholder:text-sm placeholder:text-sky-600/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/30";

// ─── OptionalChip ─────────────────────────────────────────────────────────────

// ─── SectionField ─────────────────────────────────────────────────────────────

/** id del <datalist> con le sezioni già usate (uno solo per form). */
const SECTIONS_LIST_ID = "ingredient-sections";

/**
 * Campo "sezione" della riga ingrediente (visibile solo con le sezioni attive):
 * input libero con `datalist` delle sezioni già usate nella ricetta, così la
 * seconda riga in poi si sceglie dalla tendina invece di riscriverla.
 */
function SectionField({
  value,
  onChange,
  listId,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  /** id del <datalist> condiviso (uno solo per form: le righe sono duplicate mobile/desktop) */
  listId: string;
  /** Riga mobile: campo più stretto per stare sulla stessa riga di qtà/unità */
  compact?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex min-w-0 items-center gap-1 self-start rounded-full border py-0.5 pl-2 pr-1 transition-colors focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-300/30",
        value.trim() ? "border-emerald-300 bg-emerald-100/70" : "border-white/60 bg-white/70"
      )}
    >
      <Layers size={10} className={clsx("shrink-0", value.trim() ? "text-emerald-700" : "text-sky-600")} />
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="sezione"
        title="Sezione/preparazione di questo ingrediente (es. Per l'impasto)"
        className={clsx(
          "min-w-0 bg-transparent text-[11px] font-medium placeholder:font-normal focus:outline-none",
          compact ? "w-20" : "w-24 sm:w-28",
          value.trim() ? "text-emerald-900 placeholder:text-emerald-700/50" : "text-sky-900 placeholder:text-sky-600/70"
        )}
      />
    </span>
  );
}

/** Chip-toggle "opzionale" per la riga ingrediente (`compact` = etichetta corta, riga mobile). */
function OptionalChip({ active, onToggle, compact = false }: { active: boolean; onToggle: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title="Segna come ingrediente opzionale"
      className={clsx(
        "inline-flex items-center gap-1 self-start rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
        active
          ? "border-amber-300 bg-amber-100 text-amber-800"
          : "border-white/60 bg-white/70 text-sky-600 hover:border-amber-200 hover:text-amber-700"
      )}
    >
      <TagIcon size={10} /> {compact ? "opz." : "opzionale"}
    </button>
  );
}

// ─── Date helper ──────────────────────────────────────────────────────────────

/** Data odierna locale in formato "YYYY-MM-DD" (per <input type="date">). */
function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// ─── RecipeForm ───────────────────────────────────────────────────────────────

export function RecipeForm({ recipeId, categories, tags, initialData }: Props) {
  const router = useRouter();
  const isEdit = !!recipeId;

  // Liste locali: le categorie/tag creati al volo dalla form appaiono subito
  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [tagList, setTagList] = useState<Tag[]>(tags);

  const [name, setName] = useState(initialData?.name ?? "");
  // Data della ricetta: alla creazione default = oggi, sempre modificabile dall'utente
  const [createdAt, setCreatedAt] = useState(initialData?.createdAt ?? todayISO());
  const [servings, setServings] = useState(initialData?.servings ?? "");
  const [servingsUnit, setServingsUnit] = useState(initialData?.servingsUnit ?? "");
  const [prep, setPrep] = useState(initialData?.prep ?? "");
  const [cook, setCook] = useState(initialData?.cook ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [links, setLinks] = useState(initialData?.links ?? "");
  // Ricette nuove: pronte di default; in modifica riflette lo stato salvato
  const [published, setPublished] = useState(initialData?.published ?? true);
  const [categoryIds, setCategoryIds] = useState<number[]>(initialData?.categoryIds ?? []);
  const [tagIds, setTagIds] = useState<number[]>(initialData?.tagIds ?? []);
  const [ingredients, setIngredients] = useState<IngredientRow[]>(() =>
    initialData?.ingredients?.length
      ? initialData.ingredients.map((r) => ({ ...r, uid: uid() }))
      : [emptyIngredient()]
  );
  // Sezioni/preparazioni degli ingredienti (es. "Per l'impasto"): opzionali,
  // si attivano solo quando servono. In modifica sono già attive se salvate.
  const [useSections, setUseSections] = useState(
    () => initialData?.ingredients?.some((i) => i.section?.trim()) ?? false
  );
  const [steps, setSteps] = useState<StepRow[]>(() =>
    initialData?.steps?.length
      ? initialData.steps.map((r) => ({ ...r, uid: uid() }))
      : [emptyStep()]
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

  // Somma i minuti degli step per tipo → suggerisce prep/cottura
  const derived = useMemo(() => {
    let prepM = 0, cookM = 0, waitM = 0;
    for (const s of steps) {
      const m = Number(s.mins);
      if (!m || m <= 0) continue;
      if (s.kind === "COOK") cookM += m;
      else if (s.kind === "WAIT") waitM += m;
      else prepM += m;
    }
    return { prep: prepM, cook: cookM, wait: waitM, hasAny: prepM + cookM + waitM > 0 };
  }, [steps]);

  // Auto-compila i campi VUOTI dalla derivazione (ricette nuove); non sovrascrive
  // mai valori già presenti (incl. quelli salvati di ricette esistenti).
  useEffect(() => {
    if (derived.prep > 0) setPrep((cur) => (cur === "" ? String(derived.prep) : cur));
  }, [derived.prep]);
  useEffect(() => {
    if (derived.cook > 0) setCook((cur) => (cur === "" ? String(derived.cook) : cur));
  }, [derived.cook]);

  const applyDerived = () => {
    setPrep(derived.prep > 0 ? String(derived.prep) : "");
    setCook(derived.cook > 0 ? String(derived.cook) : "");
  };

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

  // Righe con la descrizione aperta a mano su mobile (le già compilate si vedono sempre)
  const [descriptionOpen, setDescriptionOpen] = useState<Set<string>>(new Set());
  const showDescription = (row: IngredientRow) => !!row.description.trim() || descriptionOpen.has(row.uid);
  const openDescription = (rowUid: string) =>
    setDescriptionOpen((prev) => new Set(prev).add(rowUid));

  // Sezioni già usate: alimentano la tendina del campo sezione
  const sectionOptions = useMemo(
    () => [...new Set(ingredients.map((i) => i.section.trim()).filter(Boolean))],
    [ingredients]
  );

  // La nuova riga eredita la sezione dell'ultima: inserendo gli ingredienti di
  // una preparazione alla volta non serve riscriverla ogni volta
  const addIngredient = () =>
    setIngredients((p) => [...p, emptyIngredient(useSections ? p[p.length - 1]?.section ?? "" : "")]);
  const removeIngredient = (i: number) => setIngredients((p) => p.filter((_, j) => j !== i));
  const updateIngredient = (i: number, f: keyof IngredientRow, v: string) =>
    setIngredients((p) => p.map((r, j) => j === i ? { ...r, [f]: v } : r));
  const toggleIngredientOptional = (i: number) =>
    setIngredients((p) => p.map((r, j) => j === i ? { ...r, optional: !r.optional } : r));

  const addStep = () => setSteps((p) => [...p, emptyStep()]);
  const removeStep = (i: number) => setSteps((p) => p.filter((_, j) => j !== i));
  const updateStep = (i: number, f: keyof StepRow, v: string) =>
    setSteps((p) => p.map((r, j) => j === i ? { ...r, [f]: v } : r));

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
      createdAt: createdAt || null,
      servings: servings ? Number(servings) : null,
      servingsUnit: servingsUnit.trim() || null,
      prep: prep ? Number(prep) : null,
      cook: cook ? Number(cook) : null,
      notes: notes.trim() || null,
      links: links.trim() || null,
      photo: mainPhoto?.url.trim() || null,
      published,
      categoryIds,
      tagIds,
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((i, order) => ({ name: i.name.trim(), qty: i.qty ? Number(i.qty) : null, unit: i.unit.trim() || null, description: i.description.trim() || null, optional: i.optional, section: useSections ? i.section.trim() || null : null, order })),
      steps: steps
        .filter((s) => s.text.trim())
        .map((s, order) => ({ text: s.text.trim(), mins: s.mins ? Number(s.mins) : null, kind: s.kind, order })),
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
  }, [name, createdAt, servings, servingsUnit, prep, cook, notes, links, published, categoryIds, tagIds, ingredients, useSections, steps, photos, isEdit, recipeId, router]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

      {/* Sticky top bar */}
      <div className="sticky z-30 flex items-center justify-between gap-2 rounded-b-2xl border border-white/50 bg-white/70 backdrop-blur-xl px-3 py-2 sm:gap-3 sm:px-5 sm:py-3 shadow-lg shadow-black/[0.07] ring-1 ring-black/[0.04]" style={{ top: "calc(env(safe-area-inset-top, 0px) + 56px)" }}>
        <h1 className="text-sm font-semibold text-gray-800 truncate">
          {isEdit ? "Modifica ricetta" : "Nuova ricetta"}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <PublishSwitch published={published} onToggle={() => setPublished((p) => !p)} />
          <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
            Annulla
          </Button>
          <Button type="submit" size="sm" loading={saving}>
            {/* Etichetta corta su mobile: lascia respiro al titolo nella barra sticky */}
            <span className="sm:hidden">{isEdit ? "Salva" : "Crea"}</span>
            <span className="hidden sm:inline">{isEdit ? "Salva modifiche" : "Crea ricetta"}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <TriangleAlert size={16} className="shrink-0" /> <span>{error}</span>
        </div>
      )}

      {/* 1. Info base */}
      <Section title="Informazioni base" icon={<Info size={18} />} tone="sky" delay={0}>
        <Input label="Nome ricetta *" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Es. Risotto allo zafferano" />
        <Input label="Data" type="date" value={createdAt}
          onChange={(e) => setCreatedAt(e.target.value)} />
        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
          <Input label="Porzioni" type="number" min={1} value={servings}
            onChange={(e) => setServings(e.target.value)} placeholder="4" />
          <Input label="Unità" type="text" value={servingsUnit}
            onChange={(e) => setServingsUnit(e.target.value)}
            placeholder="porzioni" title="Es. teglie da 28cm, pirofile… Vuoto = persone" />
          <Input label="Prep. (min)" type="number" min={0} value={prep}
            onChange={(e) => setPrep(e.target.value)} placeholder="20" />
          <Input label="Cottura (min)" type="number" min={0} value={cook}
            onChange={(e) => setCook(e.target.value)} placeholder="30" />
        </div>
        {derived.hasAny && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-sky-50/60 border border-sky-100 px-3 py-2 text-xs text-sky-700">
            <span className="font-medium">Dai passi:</span>
            <span>Prep <strong>{derived.prep}m</strong></span>
            <span>Cottura <strong>{derived.cook}m</strong></span>
            {derived.wait > 0 && <span>Attesa <strong>{derived.wait}m</strong></span>}
            <button
              type="button"
              onClick={applyDerived}
              className="ml-auto shrink-0 rounded-md bg-sky-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-600 transition-colors"
              title="Copia i minuti calcolati dai passi nei campi Prep. e Cottura"
            >
              Applica<span className="hidden sm:inline"> a Prep/Cottura</span>
            </button>
          </div>
        )}
        <Textarea label="Note" value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={2} placeholder="Consigli, varianti, sostituzioni..." />
        <Input label="Link fonte" type="url" value={links}
          onChange={(e) => setLinks(e.target.value)} placeholder="https://..." />
      </Section>

      {/* 2. Foto */}
      <Section
        title="Foto"
        icon={<ImageIcon size={18} />}
        tone="violet"
        delay={60}
        hint="La foto contrassegnata come Principale è mostrata nei card e nella lista."
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
                  <div className="flex h-full items-center justify-center text-gray-300">
                    <ImageIcon size={30} />
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
                  {p.isMain ? <span className="inline-flex items-center gap-1"><Star size={11} className="fill-current" /> Principale</span> : "Imposta principale"}
                </button>

                {/* Pulsante elimina */}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  title="Elimina foto"
                  className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full bg-black/40 w-6 h-6 text-white hover:bg-red-500 transition-colors"
                >
                  <X size={14} />
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
                    title="Rimuovi riga foto"
                    className={rowIconBtnDanger}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : null
            )}
          </div>
        )}
      </Section>

      {/* 3-4. Categorie + Tag affiancate su desktop (meno spazio verticale).
          Wrapper z-20/z-[15]: ogni Section ha backdrop-blur (nuovo stacking
          context), quindi i dropdown vanno sollevati sopra le sezioni successive.
          Restano sotto la top bar sticky (z-30). */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 sm:items-stretch">
      <div className="relative z-20 h-full">
      <Section
        title="Categorie"
        icon={<TagIcon size={18} />}
        tone="orange"
        delay={120}
        hint="Cerca tra quelle esistenti o creane una nuova al volo."
        className="h-full"
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

      <div className="relative z-[15] h-full">
      <Section
        title="Tag"
        icon={<Hash size={18} />}
        tone="amber"
        delay={180}
        hint="Cerca tra quelli esistenti o creane uno nuovo al volo."
        className="h-full"
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
      </div>

      {/* 5. Ingredienti — z-10 wrapper lifts this stacking context above the Procedura section */}
      <div className="relative z-10">
      <Section title="Ingredienti" icon={<Carrot size={18} />} tone="emerald" delay={240}>
        {/* Sezioni/preparazioni: opzionali, da attivare solo quando servono
            (es. una ricetta con impasto + crema). Da spente non si vede nulla. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <button
            type="button"
            role="switch"
            aria-checked={useSections}
            onClick={() => setUseSections((v) => !v)}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              useSections
                ? "border-emerald-300 bg-emerald-100/80 text-emerald-800"
                : "border-white/40 bg-white/40 text-sky-700 hover:bg-white/60"
            )}
          >
            <Layers size={13} className="shrink-0" />
            Sezioni
            <span
              className={clsx(
                "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors",
                useSections ? "bg-emerald-500" : "bg-sky-900/20"
              )}
            >
              <span
                className={clsx(
                  "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform",
                  useSections ? "translate-x-3.5" : "translate-x-0.5"
                )}
              />
            </span>
          </button>
          <p className="text-xs text-sky-600">
            {useSections
              ? "Assegna a ogni riga la sua preparazione (es. «Per l'impasto»): il dettaglio ricetta le mostra raggruppate."
              : "Attivale se la ricetta ha più preparazioni (es. impasto e crema)."}
          </p>
        </div>

        <div className="space-y-2">
          {/* Header colonne — solo desktop */}
          <div
            className="hidden sm:grid items-center gap-2 px-1 text-xs font-medium text-sky-600"
            style={{ gridTemplateColumns: "1.5rem 4rem 5rem 1fr 1.5rem" }}
          >
            <span />
            <span>Qtà</span>
            <span>Unità</span>
            <span>Ingrediente / Descrizione</span>
            <span />
          </div>

          <ReorderList values={ingredients} onReorder={setIngredients} className="space-y-2">
          {ingredients.map((ing, i) => (
            <ReorderRow key={ing.uid} value={ing}>
            {(handle) => (
            <div>
              {/* ── Card mobile (compatta: nome + qtà/unità su due righe;
                     descrizione, opzionale e sezione solo se servono) ── */}
              <div className="sm:hidden rounded-xl border border-white/50 bg-white/45 p-1.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  {handle}
                  <IngredientCombobox
                    value={ing.name}
                    onChange={(v) => updateIngredient(i, "name", v)}
                    allIngredients={allIngredients}
                    onNewIngredient={handleNewIngredient}
                    placeholder="Ingrediente"
                    className={inlineInput + " h-8 min-w-0 flex-1 py-0"}
                  />
                  {/* Descrizione: rara, si apre su richiesta (icona qui per non
                      rubare una riga intera ai chip qtà/unità/sezione sotto) */}
                  {!showDescription(ing) && (
                    <button type="button" onClick={() => openDescription(ing.uid)}
                      title="Aggiungi una descrizione all'ingrediente"
                      className={rowIconBtnNeutral}><StickyNote size={13} /></button>
                  )}
                  <button type="button" onClick={() => removeIngredient(i)}
                    title="Rimuovi ingrediente"
                    className={rowIconBtnDanger}><X size={13} /></button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <input type="number" min={0} step="any" value={ing.qty}
                    onChange={(e) => updateIngredient(i, "qty", e.target.value)} placeholder="Qtà"
                    className={inlineInput + " h-8 w-14 shrink-0 px-1.5 py-0 text-center"} />
                  <input type="text" value={ing.unit}
                    onChange={(e) => updateIngredient(i, "unit", e.target.value)} placeholder="g/ml"
                    className={inlineInput + " h-8 w-16 shrink-0 px-1.5 py-0 text-center"} />
                  <OptionalChip compact active={ing.optional} onToggle={() => toggleIngredientOptional(i)} />
                  {useSections && (
                    <SectionField
                      compact
                      value={ing.section}
                      onChange={(v) => updateIngredient(i, "section", v)}
                      listId={SECTIONS_LIST_ID}
                    />
                  )}
                </div>
                {showDescription(ing) && (
                  <input type="text" value={ing.description} autoFocus={descriptionOpen.has(ing.uid) && !ing.description}
                    onChange={(e) => updateIngredient(i, "description", e.target.value)}
                    placeholder="Descrizione (es. fredda, bollente…)"
                    className={inlineInput + " h-8 w-full py-0 text-xs"}
                  />
                )}
              </div>

              {/* ── Grid desktop ── */}
              <div
                className="hidden sm:grid items-start gap-2"
                style={{ gridTemplateColumns: "1.75rem 4rem 5rem 1fr 1.75rem" }}
              >
                <div className="flex items-start justify-center pt-1.5">{handle}</div>
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
                  <div className="flex flex-wrap items-center gap-2">
                  <OptionalChip active={ing.optional} onToggle={() => toggleIngredientOptional(i)} />
                  {useSections && (
                    <SectionField
                      value={ing.section}
                      onChange={(v) => updateIngredient(i, "section", v)}
                      listId={SECTIONS_LIST_ID}
                    />
                  )}
                </div>
                </div>
                <button type="button" onClick={() => removeIngredient(i)}
                  title="Rimuovi ingrediente"
                  className={rowIconBtnDanger + " mt-1"}><X size={13} /></button>
              </div>
            </div>
            )}
            </ReorderRow>
          ))}
          </ReorderList>
        </div>
        {/* Tendina condivisa delle sezioni già usate nella ricetta */}
        {useSections && (
          <datalist id={SECTIONS_LIST_ID}>
            {sectionOptions.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={addIngredient}>
          + Aggiungi ingrediente
        </Button>
      </Section>
      </div>

      {/* 6. Procedura */}
      <Section title="Procedura" icon={<ListOrdered size={18} />} tone="sky" delay={300}>
        <ReorderList values={steps} onReorder={setSteps} className="space-y-3 sm:space-y-4">
          {steps.map((step, i) => (
            <ReorderRow key={step.uid} value={step} className="flex gap-2 sm:gap-3 items-start">
            {(handle) => (
            <>
              <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white mt-1.5 sm:mt-2">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0 space-y-1.5">
                <Textarea value={step.text} onChange={(e) => updateStep(i, "text", e.target.value)}
                  placeholder={`Descrivi il passo ${i + 1}...`} rows={2} />
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <select
                    value={step.kind}
                    onChange={(e) => updateStep(i, "kind", e.target.value as StepKind)}
                    title="Tipo di tempo di questo passo"
                    className={inlineInput + " shrink-0 text-xs sm:text-sm"}
                  >
                    {STEP_KINDS.map((k) => (
                      <option key={k} value={k}>{STEP_KIND_LABEL[k]}</option>
                    ))}
                  </select>
                  <input type="number" min={0} value={step.mins}
                    onChange={(e) => updateStep(i, "mins", e.target.value)} placeholder="—"
                    className={inlineInput + " w-16 shrink-0 text-xs sm:w-20 sm:text-sm"} />
                  <span className="text-[11px] text-sky-600 sm:text-xs">min (opz.)</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 pt-1.5 sm:pt-2 shrink-0">
                {handle}
                <button type="button" onClick={() => removeStep(i)}
                  title="Rimuovi passo"
                  className={rowIconBtnDanger}><X size={13} /></button>
              </div>
            </>
            )}
            </ReorderRow>
          ))}
        </ReorderList>
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
          {isEdit ? <span className="inline-flex items-center gap-1.5"><Save size={16} /> Salva modifiche</span> : <span className="inline-flex items-center gap-1.5"><CircleCheck size={16} /> Crea ricetta</span>}
        </Button>
      </div>
    </form>
  );
}
