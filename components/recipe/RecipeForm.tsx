"use client";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { clsx } from "clsx";
import { Info, ImageIcon, ImagePlus, ListOrdered, Star, X, Check, StickyNote, LockOpen, RotateCcw, Plus, Link2 } from "lucide-react";
import { Button, IconButton } from "@/components/ds/Button";
import { Field, TextInput, TextArea, ReadonlyValue } from "@/components/ds/Field";
import { Switch } from "@/components/ds/Controls";
import { StepNumber } from "@/components/ds/Progress";
import { GroceryBagIcon } from "@/components/icons";
import { FormBar, FormCard, FormError, MiniChip, StepKindPicker, rowFieldCls } from "@/components/admin/FormParts";
import { IngredientCombobox } from "@/components/ui/IngredientCombobox";
import { CategoryCombobox } from "@/components/ui/CategoryCombobox";
import { TagCombobox } from "@/components/ui/TagCombobox";
import { ReorderList, ReorderRow } from "@/components/ui/ReorderList";
import { Modal } from "@/components/ui/Modal";
import { type Category, type Tag, type StepKind, formatMinutes } from "@/lib/types";
import {
  allocationOf,
  formatQty,
  resolveLinkQty,
  QTY_EPSILON,
  type Allocation,
} from "@/lib/step-ingredients";

/*
 * Form ricetta (restyle fase 5C, tavola sezione 11, prototipo docs/design/schermate/6-form-ricetta).
 * Cambia solo l'aspetto: stato, ripartizione delle quantità per passo, payload e conferma
 * «Salva comunque» sono quelli di sempre. Due colonne dagli 860px di contenitore
 * (Informazioni · Foto · Note | Ingredienti · Procedura), una sotto.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

// `uid` = identità stabile della riga per il drag & drop (le key per indice
// rompono il Reorder); generato client-side, mai inviato all'API.
interface IngredientRow { uid: string; name: string; qty: string; unit: string; description: string; optional: boolean; section: string }
/**
 * Ingrediente legato a un passo: riferito per **uid** della riga ingrediente (così
 * sopravvive a riordino e rimozione, gli indici no) + la quantità usata in questo
 * passo, come stringa come tutti i campi numerici del form ("" = non specificata).
 */
interface StepIngredientRow { uid: string; qty: string }
interface StepRow { uid: string; text: string; mins: string; kind: StepKind; ingredients: StepIngredientRow[] }

const uid = () => crypto.randomUUID();
const emptyIngredient = (section = ""): IngredientRow => ({ uid: uid(), name: "", qty: "", unit: "", description: "", optional: false, section });
const emptyStep = (): StepRow => ({ uid: uid(), text: "", mins: "", kind: "PREP", ingredients: [] });
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
  /** `stepIngredients[].idx` = posizioni nell'array `ingredients` qui sopra (gli id
      degli ingredienti cambiano a ogni salvataggio: il PUT fa delete-recreate);
      `qty` = quantità usata in quel passo, null = non specificata */
  steps: (Omit<StepRow, "uid" | "ingredients"> & {
    stepIngredients?: { idx: number; qty: number | null }[];
  })[];
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

// ─── Foto (11.5) ──────────────────────────────────────────────────────────────

const photoTileCls = "relative size-[4.75rem] shrink-0 overflow-hidden rounded-[0.75rem]";

/** Tessera tratteggiata «Aggiungi»: sceglie un file e lo carica su Cloudinary */
function PhotoAddTile({ onUrl }: { onUrl: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      onUrl(await uploadToCloudinary(file));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Errore upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={clsx(
          photoTileCls,
          "flex flex-col items-center justify-center gap-1 border-2 border-dashed border-blu-250 bg-blu-100 text-[0.6875rem] font-semibold text-blu-800 transition-colors hover:bg-blu-120 disabled:cursor-wait"
        )}
      >
        <ImagePlus className={clsx("size-5", uploading && "animate-pulse motion-reduce:animate-none")} aria-hidden />
        {uploading ? "Carico…" : "Aggiungi"}
      </button>
      {uploadError && <p className="basis-full text-[0.8125rem] text-rosa">{uploadError}</p>}
    </>
  );
}

// ─── Righe ingrediente (11.3) ─────────────────────────────────────────────────

/** id del <datalist> con le sezioni già usate (uno solo per form). */
const SECTIONS_LIST_ID = "ingredient-sections";

/** Campo numerico/unità di riga: testo un po' più piccolo su PC (su touch resta 16px, guardia iOS) */
const rowInputCls = clsx(rowFieldCls, "text-[0.9375rem]");

// ─── StepIngredients ──────────────────────────────────────────────────────────

/** Quantità della riga ingrediente come numero; null = non indicata o non valida. */
function rowTotal(row: IngredientRow): number | null {
  const n = Number(row.qty);
  return row.qty.trim() && Number.isFinite(n) && n >= 0 ? n : null;
}

/** Quantità di un legame (campo del form) come numero; null = "quanto serve". */
function linkQty(row: StepIngredientRow | undefined): number | null {
  if (!row?.qty.trim()) return null;
  const n = Number(row.qty);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** "500 g" / "q.b." — quantità + unità di una riga ingrediente. */
function amountLabel(qty: number | null, unit: string): string {
  const u = unit.trim();
  if (qty == null) return u || "q.b.";
  return u ? `${formatQty(qty)} ${u}` : formatQty(qty);
}

/**
 * Etichetta del chip di un legame: la quantità di QUESTO passo (o quella piena
 * dell'ingrediente se il legame non la indica e nessun altro passo la ripartisce
 * — vedi `resolveLinkQty`) davanti al nome.
 */
function chipLabel(ing: IngredientRow, link: StepIngredientRow, split: boolean): string {
  const qty = resolveLinkQty(linkQty(link), rowTotal(ing), split);
  const name = ing.name.trim();
  const amount = qty != null ? amountLabel(qty, ing.unit) : "";
  return amount ? `${amount} ${name}` : name;
}

/**
 * Ingredienti necessari a un passo (11.4): chip dei legami + pannello di selezione con la
 * quantità usata in questo passo.
 *
 * Opzionale per definizione (le ricette esistenti non hanno legami), quindi da chiuso è
 * una fila di chip con «+ ingrediente». Le quantità sono una ripartizione del totale della
 * riga ingrediente: il pannello mostra sempre «di X» e il residuo, e segnala in rosa se la
 * somma dei passi supera il totale (avviso, non blocco — vedi `handleSubmit`).
 */
function StepIngredients({
  all,
  selected,
  allocations,
  onToggle,
  onQtyChange,
}: {
  /** Tutte le righe ingrediente della ricetta con un nome (le altre non sono selezionabili) */
  all: IngredientRow[];
  selected: StepIngredientRow[];
  /** Ripartizione per uid ingrediente, calcolata su TUTTI i passi (vedi `allocations` nel form) */
  allocations: Map<string, Allocation>;
  onToggle: (ingredientUid: string) => void;
  onQtyChange: (ingredientUid: string, qty: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedByUid = new Map(selected.map((s) => [s.uid, s]));
  // Nell'ordine della lista ingredienti, non in quello di selezione: si rilegge come la lista
  const chips = all.filter((i) => selectedByUid.has(i.uid));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((ing) => (
          <MiniChip
            key={ing.uid}
            active
            tone={allocations.get(ing.uid)?.over ? "over" : "default"}
            onRemove={() => onToggle(ing.uid)}
            removeLabel={`Togli ${ing.name.trim()} dal passo`}
          >
            {chipLabel(ing, selectedByUid.get(ing.uid)!, !!allocations.get(ing.uid)?.split)}
          </MiniChip>
        ))}
        <MiniChip
          active={open}
          onClick={() => setOpen((v) => !v)}
          icon={open ? <Check /> : <Plus />}
          title="Scegli gli ingredienti che servono in questo passo e quanto ne serve"
        >
          {open ? "Fatto" : chips.length > 0 ? "Modifica" : "ingrediente"}
        </MiniChip>
      </div>

      {open && (
        <div className="rounded-[0.75rem] border border-blu-150 bg-blu-50 p-1.5">
          {all.length === 0 ? (
            <p className="px-1 py-0.5 text-[0.8125rem] text-grigio">
              Aggiungi prima gli ingredienti della ricetta: qui potrai spuntare quelli che servono in questo passo.
            </p>
          ) : (
            // Liste lunghe: il pannello scorre invece di allungare il passo
            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
              {all.map((ing) => {
                const link = selectedByUid.get(ing.uid);
                const active = !!link;
                const alloc = allocations.get(ing.uid);
                const total = rowTotal(ing);
                const own = linkQty(link);
                // Quanto ne resta per QUESTO passo: totale meno quello che si sono
                // già preso gli altri passi (la quota di questo non conta)
                const takenElsewhere = Math.round(((alloc?.assigned ?? 0) - (own ?? 0)) * 100) / 100;
                const availableHere = total != null ? Math.round((total - takenElsewhere) * 100) / 100 : null;
                const over = active && own != null && availableHere != null && own - availableHere > QTY_EPSILON;
                const unit = ing.unit.trim();

                return (
                  <li
                    key={ing.uid}
                    className={clsx(
                      "flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-[0.5rem] border bg-white px-1.5 py-1",
                      over ? "border-rosa-200 bg-rosa-50" : active ? "border-blu-200" : "border-blu-150"
                    )}
                  >
                    {/* Nome = interruttore del legame. Riga sua sul telefono, in linea quando c'è spazio */}
                    <button
                      type="button"
                      onClick={() => onToggle(ing.uid)}
                      aria-pressed={active}
                      title={active ? "Togli l'ingrediente dal passo" : "Aggiungi l'ingrediente al passo"}
                      className="flex min-h-[1.875rem] min-w-0 flex-1 basis-full items-center gap-2 rounded-[0.375rem] px-0.5 text-left text-[0.875rem] font-semibold @min-[480px]:basis-40"
                    >
                      <span
                        aria-hidden
                        className={clsx(
                          "inline-flex size-5 shrink-0 items-center justify-center rounded-[0.375rem] border-2",
                          active ? "border-verde bg-verde text-white" : "border-blu-250 bg-white"
                        )}
                      >
                        {active && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className="truncate">{ing.name.trim()}</span>
                    </button>

                    {active && (
                      <>
                        <span className="flex shrink-0 items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            inputMode="decimal"
                            value={link.qty}
                            onChange={(e) => onQtyChange(ing.uid, e.target.value)}
                            placeholder="q.b."
                            aria-label={`Quantità di ${ing.name.trim()} in questo passo`}
                            title="Quantità usata in questo passo (vuoto = quanto serve)"
                            className={clsx(rowInputCls, "w-[4.25rem] text-center", over && "border-rosa")}
                          />
                          {unit && <span className="text-[0.8125rem] text-grigio">{unit}</span>}
                          {/* «resto»/«tutto»: la quantità che ancora non è assegnata */}
                          {availableHere != null && availableHere > 0 && own !== availableHere && (
                            <MiniChip
                              onClick={() => onQtyChange(ing.uid, String(availableHere))}
                              title="Assegna a questo passo la quantità non ancora assegnata"
                            >
                              {takenElsewhere > 0 ? "resto" : "tutto"}
                            </MiniChip>
                          )}
                          {own != null && (
                            <IconButton size="row" label="Non specificare la quantità (quanto serve)" onClick={() => onQtyChange(ing.uid, "")}>
                              <RotateCcw />
                            </IconButton>
                          )}
                        </span>

                        <span
                          className={clsx(
                            "basis-full text-[0.75rem] @min-[480px]:ml-auto @min-[480px]:basis-auto @min-[480px]:text-right",
                            over ? "font-semibold text-rosa" : "text-grigio"
                          )}
                        >
                          {total == null ? (
                            "totale non indicato"
                          ) : over ? (
                            // clamp: se altri passi hanno già sforato, il disponibile qui è
                            // negativo e «disponibili -50 g» non si legge
                            `oltre il totale: disponibili ${amountLabel(Math.max(0, availableHere), unit)}`
                          ) : (
                            <>
                              di {amountLabel(total, unit)}
                              {takenElsewhere > 0 && ` · altri passi ${formatQty(takenElsewhere)}`}
                              {availableHere != null &&
                                availableHere > 0 &&
                                ` · resta ${formatQty(Math.max(0, availableHere - (own ?? 0)))}`}
                            </>
                          )}
                        </span>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
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
  // Ingredienti e step si inizializzano insieme: i legami del passo arrivano come
  // indici e vanno tradotti negli uid appena generati per le righe ingrediente.
  const [initialRows] = useState(() => {
    const ingRows: IngredientRow[] = initialData?.ingredients?.length
      ? initialData.ingredients.map((r) => ({ ...r, uid: uid() }))
      : [emptyIngredient()];
    const stepRows: StepRow[] = initialData?.steps?.length
      ? initialData.steps.map(({ stepIngredients, ...r }) => ({
          ...r,
          uid: uid(),
          ingredients: (stepIngredients ?? [])
            .map((l) => {
              const ingUid = ingRows[l.idx]?.uid;
              return ingUid ? { uid: ingUid, qty: l.qty != null ? String(l.qty) : "" } : null;
            })
            .filter((l): l is StepIngredientRow => !!l),
        }))
      : [emptyStep()];
    return { ingredients: ingRows, steps: stepRows };
  });

  const [ingredients, setIngredients] = useState<IngredientRow[]>(initialRows.ingredients);
  // Sezioni/preparazioni degli ingredienti (es. "Per l'impasto"): opzionali,
  // si attivano solo quando servono. In modifica sono già attive se salvate.
  const [useSections, setUseSections] = useState(
    () => initialData?.ingredients?.some((i) => i.section?.trim()) ?? false
  );
  const [steps, setSteps] = useState<StepRow[]>(initialRows.steps);
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

  // Somma i minuti degli step per tipo → alimenta prep/cottura
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

  /**
   * Prep/Cottura hanno due modalità:
   * - automatica (default): i campi sono in sola lettura e seguono SEMPRE la somma
   *   dei minuti degli step, live. Nessun bottone da ricordarsi di premere.
   * - manuale: sbloccata dall'utente, i campi si editano a mano e non vengono più
   *   toccati. Le ricette esistenti con tempi salvati partono di qui, così i valori
   *   già scelti non vengono sovrascritti.
   */
  const [timesManual, setTimesManual] = useState(
    () => !!(initialData?.prep?.trim() || initialData?.cook?.trim())
  );

  // Valori effettivi dei due campi (quelli mostrati e quelli salvati): in
  // automatico sono la somma degli step, in manuale lo stato editato a mano.
  const derivedStr = (m: number) => (m > 0 ? String(m) : "");
  const prepValue = timesManual ? prep : derivedStr(derived.prep);
  const cookValue = timesManual ? cook : derivedStr(derived.cook);

  /** Sblocca/riblocca i tempi; sbloccando si parte dai valori automatici correnti. */
  const toggleTimesManual = () => {
    if (!timesManual) {
      setPrep(derivedStr(derived.prep));
      setCook(derivedStr(derived.cook));
    }
    setTimesManual(!timesManual);
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
  const updateStep = (i: number, f: "text" | "mins" | "kind", v: string) =>
    setSteps((p) => p.map((r, j) => j === i ? { ...r, [f]: v } : r));
  /** Lega/slega un ingrediente al passo `i` (riferimento per uid della riga). */
  const toggleStepIngredient = (i: number, ingredientUid: string) =>
    setSteps((p) =>
      p.map((r, j) =>
        j === i
          ? {
              ...r,
              ingredients: r.ingredients.some((l) => l.uid === ingredientUid)
                ? r.ingredients.filter((l) => l.uid !== ingredientUid)
                : [...r.ingredients, { uid: ingredientUid, qty: "" }],
            }
          : r
      )
    );
  /** Quantità dell'ingrediente `ingredientUid` nel passo `i` ("" = quanto serve). */
  const setStepIngredientQty = (i: number, ingredientUid: string, qty: string) =>
    setSteps((p) =>
      p.map((r, j) =>
        j === i
          ? {
              ...r,
              ingredients: r.ingredients.map((l) =>
                l.uid === ingredientUid ? { ...l, qty } : l
              ),
            }
          : r
      )
    );

  // Solo le righe con un nome sono legabili (le vuote non arrivano nemmeno al salvataggio)
  const namedIngredients = useMemo(
    () => ingredients.filter((i) => i.name.trim()),
    [ingredients]
  );

  /**
   * Ripartizione di ogni ingrediente sui passi (uid → `Allocation`): quanto è già
   * assegnato, quanto resta, se la somma sfora il totale. Derivata a ogni render
   * da ingredienti + passi: cambiando il totale di una riga lo sforamento compare
   * subito, senza stato da tenere in sincrono.
   */
  const allocations = useMemo(() => {
    const map = new Map<string, Allocation>();
    for (const ing of ingredients) {
      const total = ing.qty.trim() && Number.isFinite(Number(ing.qty)) ? Number(ing.qty) : null;
      const qtys: (number | null)[] = [];
      for (const s of steps) {
        const link = s.ingredients.find((l) => l.uid === ing.uid);
        if (!link) continue;
        const n = Number(link.qty);
        qtys.push(link.qty.trim() && Number.isFinite(n) && n >= 0 ? n : null);
      }
      map.set(ing.uid, allocationOf(total, qtys));
    }
    return map;
  }, [ingredients, steps]);

  /** Ingredienti con più quantità assegnate del totale disponibile (avviso, non blocco). */
  const overAllocated = useMemo(
    () =>
      ingredients.filter((i) => {
        const a = allocations.get(i.uid);
        return !!a?.over;
      }),
    [ingredients, allocations]
  );

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

  const submitRecipe = useCallback(async () => {
    setSaving(true);
    setError(null);

    const validPhotos = photos.filter((p) => p.url.trim());
    // Le righe senza nome non vengono salvate: gli indici dei legami passo↔
    // ingrediente si calcolano sulla lista già filtrata, non su quella del form
    const savedIngredients = ingredients.filter((i) => i.name.trim());
    const ingredientIdxByUid = new Map(savedIngredients.map((i, idx) => [i.uid, idx]));
    // La foto principale: quella marcata come main, o la prima disponibile
    const mainPhoto =
      validPhotos.find((p) => p.isMain) ?? validPhotos[0] ?? null;

    const body = {
      name: name.trim(),
      createdAt: createdAt || null,
      servings: servings ? Number(servings) : null,
      servingsUnit: servingsUnit.trim() || null,
      prep: prepValue ? Number(prepValue) : null,
      cook: cookValue ? Number(cookValue) : null,
      notes: notes.trim() || null,
      links: links.trim() || null,
      photo: mainPhoto?.url.trim() || null,
      published,
      categoryIds,
      tagIds,
      ingredients: savedIngredients.map((i, order) => ({ name: i.name.trim(), qty: i.qty ? Number(i.qty) : null, unit: i.unit.trim() || null, description: i.description.trim() || null, optional: i.optional, section: useSections ? i.section.trim() || null : null, order })),
      steps: steps
        .filter((s) => s.text.trim())
        .map((s, order) => ({
          text: s.text.trim(),
          mins: s.mins ? Number(s.mins) : null,
          kind: s.kind,
          order,
          // Gli uid sono client-side: l'API riceve la posizione nell'array
          // `ingredients` + la quantità usata in questo passo ("" → null = q.b.)
          stepIngredients: s.ingredients
            .map((l) => ({ idx: ingredientIdxByUid.get(l.uid), qty: l.qty.trim() ? Number(l.qty) : null }))
            .filter((l): l is { idx: number; qty: number | null } => l.idx !== undefined),
        })),
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
  }, [name, createdAt, servings, servingsUnit, prepValue, cookValue, notes, links, published, categoryIds, tagIds, ingredients, useSections, steps, photos, isEdit, recipeId, router]);

  /**
   * Le quantità assegnate ai passi che superano il totale dell'ingrediente sono un
   * **avviso**, non un blocco: possono venire da un arrotondamento o da una scelta
   * voluta, e una ricetta lunga non deve restare non salvabile per questo. Si
   * chiede conferma una volta sola, elencando i casi.
   */
  const [confirmOver, setConfirmOver] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Il nome è obbligatorio"); return; }
    if (overAllocated.length > 0) { setConfirmOver(true); return; }
    void submitRecipe();
  };

  // Riga ingrediente su cui si sta lavorando: mostra la seconda fila (opzionale,
  // descrizione) anche se è vuota. Le altre la mostrano solo se c'è qualcosa da vedere.
  // Stato e non `:focus-within`: Safari non mette a fuoco i bottoni al tocco e la fila
  // sparirebbe prima che il tocco arrivi.
  const [activeRow, setActiveRow] = useState<string | null>(null);

  const stepsMinutes = derived.prep + derived.cook + derived.wait;
  const stepsCount = steps.filter((s) => s.text.trim()).length;
  const tagFieldId = "recipe-category-tags";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormBar
        title={name.trim() || (isEdit ? "Modifica ricetta" : "Nuova ricetta")}
        published={published}
        onTogglePublished={() => setPublished((p) => !p)}
        onCancel={() => router.back()}
        saving={saving}
        saveLabel={isEdit ? "Salva" : "Crea"}
      />

      <div className="mx-auto grid max-w-6xl gap-(--gap) @min-[860px]:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.4fr)] @min-[860px]:items-start">
        {error && (
          <div className="@min-[860px]:col-span-2">
            <FormError>{error}</FormError>
          </div>
        )}

        {/* ── Colonna A: Informazioni · Foto · Note ── */}
        <div className="flex min-w-0 flex-col gap-(--gap)">
          <FormCard title="Informazioni" icon={<Info />}>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Nome ricetta" className="col-span-2">
                {(p) => (
                  <TextInput {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Risotto allo zafferano" />
                )}
              </Field>
              <Field label="Porzioni">
                {(p) => (
                  <TextInput {...p} type="number" min={1} inputMode="numeric" value={servings} onChange={(e) => setServings(e.target.value)} placeholder="4" />
                )}
              </Field>
              <Field label="Unità">
                {(p) => (
                  <TextInput
                    {...p}
                    value={servingsUnit}
                    onChange={(e) => setServingsUnit(e.target.value)}
                    placeholder="persone"
                    title="Es. teglie da 28cm, pirofile… Vuoto = persone"
                  />
                )}
              </Field>

              {/* 11.9 · tempi: in automatico seguono i minuti dei passi, a mano si scrivono */}
              {(["prep", "cook"] as const).map((k) => {
                const label = k === "prep" ? "Prep." : "Cottura";
                const value = k === "prep" ? prepValue : cookValue;
                return (
                  <Field key={k} label={`${label} · ${timesManual ? "a mano" : "auto"}`}>
                    {(p) =>
                      timesManual ? (
                        <TextInput
                          {...p}
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={value}
                          onChange={(e) => (k === "prep" ? setPrep(e.target.value) : setCook(e.target.value))}
                          placeholder="min"
                        />
                      ) : (
                        <ReadonlyValue>{value ? `${value} min` : "—"}</ReadonlyValue>
                      )
                    }
                  </Field>
                );
              })}
              <div className="col-span-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-grigio">
                <span className="min-w-0 flex-1">
                  {derived.hasAny ? (
                    <>
                      Dai passi: prep. {derived.prep} · cottura {derived.cook}
                      {derived.wait > 0 && ` · attesa ${derived.wait}`} min
                    </>
                  ) : timesManual ? (
                    "Tempi scritti a mano"
                  ) : (
                    "Si calcolano dai minuti dei passi"
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTimesManual}
                  icon={timesManual ? <RotateCcw /> : <LockOpen />}
                  title={timesManual ? "Torna a calcolare Prep. e Cottura dai passi" : "Sblocca i campi per scrivere Prep. e Cottura a mano"}
                >
                  {timesManual ? "Torna automatico" : "Scrivi a mano"}
                </Button>
              </div>

              {/* 11.7 · categorie e tag nella stessa fila */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <p id={tagFieldId} className="text-[0.8125rem] font-semibold text-grigio">
                  Categoria e tag
                </p>
                <div role="group" aria-labelledby={tagFieldId} className="flex flex-wrap items-center gap-1.5">
                  <CategoryCombobox categories={categoryList} selectedIds={categoryIds} onToggle={toggleCat} onCreated={handleNewCategory} />
                  <TagCombobox tags={tagList} selectedIds={tagIds} onToggle={toggleTag} onCreated={handleNewTag} />
                </div>
              </div>
            </div>
          </FormCard>

          <FormCard title="Foto" icon={<ImageIcon />}>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) =>
                p.url ? (
                  <div key={i} className={clsx(photoTileCls, "bg-blu-100", p.isMain && "ring-[3px] ring-blu-800 ring-offset-2")}>
                    {/* tocco sulla foto = diventa la principale (quella delle card e della lista) */}
                    <button
                      type="button"
                      onClick={() => setPhotoAsMain(i)}
                      aria-label={p.isMain ? "Foto principale" : `Usa la foto ${i + 1} come principale`}
                      title={p.isMain ? "Foto principale" : "Usa come principale"}
                      className="absolute inset-0"
                    >
                      <Image src={p.url} alt="" fill className="object-cover" sizes="80px" />
                    </button>
                    {p.isMain && (
                      <span className="pointer-events-none absolute bottom-1 left-1 inline-flex size-5 items-center justify-center rounded-full bg-blu-800 text-white">
                        <Star className="size-3 fill-current" aria-hidden />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      aria-label={`Elimina la foto ${i + 1}`}
                      title="Elimina foto"
                      className="absolute top-1 right-1 inline-flex size-6 items-center justify-center rounded-full bg-white text-rosa shadow-[0_1px_3px_oklch(25%_0.038_228/.25)] hover:bg-rosa-50"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </div>
                ) : null
              )}
              <PhotoAddTile onUrl={addPhotoWithUrl} />
            </div>
            {photos.some((p) => p.url) && (
              <p className="mt-2 text-[0.8125rem] text-grigio">Tocca una foto per farla diventare la principale (quella delle card).</p>
            )}

            {/* Foto da indirizzo, per chi la incolla a mano */}
            {photos.some((p) => !p.url) && (
              <div className="mt-2 flex flex-col gap-1.5">
                {photos.map((p, i) =>
                  !p.url ? (
                    <div key={i} className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={p.url}
                        onChange={(e) => updatePhoto(i, e.target.value)}
                        placeholder="https://res.cloudinary.com/…"
                        aria-label="Indirizzo della foto"
                        className={clsx(rowInputCls, "flex-1")}
                      />
                      <IconButton size="row" tone="danger" label="Togli la riga" onClick={() => removePhoto(i)}>
                        <X />
                      </IconButton>
                    </div>
                  ) : null
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={addPhoto} icon={<Link2 />} className="mt-1.5 -ml-1.5">
              Da indirizzo
            </Button>
          </FormCard>

          <FormCard title="Note e fonte" icon={<StickyNote />}>
            <div className="flex flex-col gap-2.5">
              <Field label="Note">
                {(p) => (
                  <TextArea {...p} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Consigli, varianti, sostituzioni…" />
                )}
              </Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Link fonte" className="col-span-2 @min-[480px]:col-span-1">
                  {(p) => <TextInput {...p} type="url" value={links} onChange={(e) => setLinks(e.target.value)} placeholder="https://…" />}
                </Field>
                <Field label="Data della ricetta" className="col-span-2 @min-[480px]:col-span-1">
                  {(p) => <TextInput {...p} type="date" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} />}
                </Field>
              </div>
            </div>
          </FormCard>
        </div>

        {/* ── Colonna B: Ingredienti · Procedura ── */}
        <div className="flex min-w-0 flex-col gap-(--gap)">
          <FormCard
            title="Ingredienti"
            icon={<GroceryBagIcon />}
            aside={<Switch checked={useSections} onChange={setUseSections} label="Sezioni" />}
          >
            {useSections && (
              <p className="mb-1 text-[0.8125rem] text-grigio">
                Scrivi la preparazione di ogni riga (es. «Per l&apos;impasto»): il dettaglio le mostra raggruppate.
              </p>
            )}
            <ReorderList values={ingredients} onReorder={setIngredients}>
              {ingredients.map((ing, i) => {
                const alloc = allocations.get(ing.uid);
                const extras =
                  activeRow === ing.uid || useSections || ing.optional || showDescription(ing) || !!alloc?.over;
                return (
                  <ReorderRow key={ing.uid} value={ing} handleSize="h-[1.875rem] w-6" className="border-b border-blu-150 bg-white py-[0.375em] last:border-0">
                    {(handle) => (
                      <div onFocusCapture={() => setActiveRow(ing.uid)}>
                        <div className="flex items-center gap-1.5">
                          {handle}
                          <input
                            type="number"
                            min={0}
                            step="any"
                            inputMode="decimal"
                            value={ing.qty}
                            onChange={(e) => updateIngredient(i, "qty", e.target.value)}
                            placeholder="Qtà"
                            aria-label="Quantità"
                            className={clsx(rowInputCls, "w-[3.75rem] shrink-0 text-center")}
                          />
                          <input
                            type="text"
                            value={ing.unit}
                            onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                            placeholder="g"
                            aria-label="Unità"
                            className={clsx(rowInputCls, "w-[3.25rem] shrink-0 text-center")}
                          />
                          <IngredientCombobox
                            value={ing.name}
                            onChange={(v) => updateIngredient(i, "name", v)}
                            allIngredients={allIngredients}
                            onNewIngredient={handleNewIngredient}
                            placeholder="Ingrediente"
                            className={rowInputCls}
                          />
                          <IconButton size="row" tone="danger" label="Rimuovi ingrediente" onClick={() => removeIngredient(i)}>
                            <X />
                          </IconButton>
                        </div>
                        {extras && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-[calc(1.5rem+0.375rem)]">
                            {alloc?.over && (
                              <MiniChip tone="over" title="I passi usano più del totale indicato">
                                {formatQty(alloc.assigned)} / {ing.qty.trim()}
                                {ing.unit.trim() && ` ${ing.unit.trim()}`}
                              </MiniChip>
                            )}
                            {useSections && (
                              <input
                                type="text"
                                list={SECTIONS_LIST_ID}
                                value={ing.section}
                                onChange={(e) => updateIngredient(i, "section", e.target.value)}
                                placeholder="sezione"
                                aria-label="Sezione"
                                title="Preparazione di questo ingrediente (es. Per l'impasto)"
                                className={clsx(rowInputCls, "h-[1.625rem] w-[9.5rem] rounded-full")}
                              />
                            )}
                            <MiniChip
                              active={ing.optional}
                              onClick={() => toggleIngredientOptional(i)}
                              title="Ingrediente opzionale"
                            >
                              opz.
                            </MiniChip>
                            {showDescription(ing) ? (
                              <input
                                type="text"
                                value={ing.description}
                                autoFocus={descriptionOpen.has(ing.uid) && !ing.description}
                                onChange={(e) => updateIngredient(i, "description", e.target.value)}
                                placeholder="descrizione (es. fredda, a dadini…)"
                                aria-label="Descrizione"
                                className={clsx(rowInputCls, "h-[1.625rem] min-w-[10rem] flex-1")}
                              />
                            ) : (
                              <MiniChip onClick={() => openDescription(ing.uid)} icon={<Plus />}>
                                descrizione
                              </MiniChip>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </ReorderRow>
                );
              })}
            </ReorderList>
            {/* Tendina condivisa delle sezioni già usate nella ricetta */}
            {useSections && (
              <datalist id={SECTIONS_LIST_ID}>
                {sectionOptions.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            )}
            <Button variant="tonal" size="sm" onClick={addIngredient} icon={<Plus />} className="mt-2">
              Ingrediente
            </Button>
          </FormCard>

          <FormCard
            title="Procedura"
            icon={<ListOrdered />}
            aside={
              stepsCount > 0 ? (
                <span className="tabular">
                  {stepsCount} {stepsCount === 1 ? "passo" : "passi"}
                  {stepsMinutes > 0 && ` · ${formatMinutes(stepsMinutes)}`}
                </span>
              ) : undefined
            }
          >
            <ReorderList values={steps} onReorder={setSteps}>
              {steps.map((step, i) => (
                <ReorderRow
                  key={step.uid}
                  value={step}
                  handleSize="h-[1.875rem] w-6"
                  className="flex items-start gap-1.5 border-b border-blu-150 bg-white py-[0.5em] last:border-0"
                >
                  {(handle) => (
                    <>
                      {handle}
                      <span className="flex h-[1.875rem] items-center">
                        <StepNumber n={i + 1} state="todo" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StepKindPicker value={step.kind} onChange={(k) => updateStep(i, "kind", k)} />
                          <input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={step.mins}
                            onChange={(e) => updateStep(i, "mins", e.target.value)}
                            placeholder="—"
                            aria-label={`Minuti del passo ${i + 1}`}
                            className={clsx(rowInputCls, "w-[3.75rem] text-center")}
                          />
                          <span className="text-[0.8125rem] text-grigio">min</span>
                          <IconButton size="row" tone="danger" label={`Rimuovi il passo ${i + 1}`} onClick={() => removeStep(i)} className="ml-auto">
                            <X />
                          </IconButton>
                        </div>
                        <TextArea
                          value={step.text}
                          onChange={(e) => updateStep(i, "text", e.target.value)}
                          placeholder={`Descrivi il passo ${i + 1}…`}
                          aria-label={`Testo del passo ${i + 1}`}
                          rows={2}
                        />
                        {/* Ingredienti che servono in questo passo (con la quantità usata qui):
                            opzionali, mostrati in modalità cucina e sotto il passo nel dettaglio */}
                        <StepIngredients
                          all={namedIngredients}
                          selected={step.ingredients}
                          allocations={allocations}
                          onToggle={(u) => toggleStepIngredient(i, u)}
                          onQtyChange={(u, qty) => setStepIngredientQty(i, u, qty)}
                        />
                      </div>
                    </>
                  )}
                </ReorderRow>
              ))}
            </ReorderList>
            <Button variant="tonal" size="sm" onClick={addStep} icon={<Plus />} className="mt-2">
              Passo
            </Button>
          </FormCard>
        </div>
      </div>

      {/* Conferma sforamento quantità: avviso, non blocco (vedi handleSubmit) */}
      <Modal open={confirmOver} onClose={() => setConfirmOver(false)} title="Quantità oltre il totale" size="sm">
        <p className="text-[0.9375rem]">
          {overAllocated.length === 1 ? "In un ingrediente la somma" : `In ${overAllocated.length} ingredienti la somma`} delle
          quantità assegnate ai passi supera il totale della ricetta:
        </p>
        {/* La lista scorre da sé (non tutta la finestra): con molti ingredienti i due
            bottoni finivano oltre il bordo. 35dvh regge anche il telefono in orizzontale */}
        <ul className="mt-3 flex max-h-[35dvh] flex-col gap-1.5 overflow-y-auto">
          {overAllocated.map((ing) => {
            const a = allocations.get(ing.uid);
            const unit = ing.unit.trim();
            return (
              <li
                key={ing.uid}
                className="flex flex-wrap items-baseline gap-x-1.5 rounded-[0.625rem] border border-rosa-200 bg-rosa-50 px-2.5 py-1.5 text-[0.875rem]"
              >
                <span className="min-w-0 font-bold break-words">{ing.name.trim()}</span>
                <span className="tabular text-rosa">
                  assegnati {formatQty(a?.assigned ?? 0)}
                  {unit && ` ${unit}`} su {ing.qty.trim()}
                  {unit && ` ${unit}`}
                </span>
              </li>
            );
          })}
        </ul>
        {/* Su telefono in colonna, con l'azione principale in alto come su iOS */}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setConfirmOver(false)} disabled={saving}>
            Torna a correggere
          </Button>
          <Button
            onClick={() => {
              setConfirmOver(false);
              void submitRecipe();
            }}
            loading={saving}
          >
            Salva comunque
          </Button>
        </div>
      </Modal>
    </form>
  );
}
