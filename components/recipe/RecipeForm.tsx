"use client";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { clsx } from "clsx";
import { Info, ImageIcon, Tag as TagIcon, Hash, Carrot, ListOrdered, Camera, Star, X, Check, TriangleAlert, Save, CircleCheck, Layers, StickyNote, Lock, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { IngredientCombobox } from "@/components/ui/IngredientCombobox";
import { CategoryCombobox } from "@/components/ui/CategoryCombobox";
import { TagCombobox } from "@/components/ui/TagCombobox";
import { SectionHeader, type SectionTone } from "@/components/ui/SectionHeader";
import { PublishSwitch } from "@/components/ui/PublishSwitch";
import { ReorderList, ReorderRow } from "@/components/ui/ReorderList";
import { Modal } from "@/components/ui/Modal";
import { type Category, type Tag, type StepKind, STEP_KINDS, STEP_KIND_LABEL } from "@/lib/types";
import {
  allocationOf,
  formatQty,
  resolveLinkQty,
  QTY_EPSILON,
  type Allocation,
} from "@/lib/step-ingredients";

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

// ─── ImageUploadButton ────────────────────────────────────────────────────────

function ImageUploadButton({ onUrl, label = "Carica foto" }: {
  onUrl: (url: string) => void; label?: string;
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
      {/* Sempre "sm": nel form compatto un bottone md sovrasta i campi da 28px */}
      <Button type="button" variant="secondary" size="sm" loading={uploading}
        onClick={() => inputRef.current?.click()}>
        <Camera size={15} /> {label}
      </Button>
      {uploadError && <p className="text-[0.75em] text-red-500">{uploadError}</p>}
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
 * Altezza unica di TUTTI i controlli del form in versione compatta: campi (anche
 * quelli di `Input`, via `--field-h` sul `<form>`), maniglia di drag, bottoni
 * icona, chip e numero del passo. Prima ognuno andava per conto suo (24 / 32 /
 * ~20px) e la riga sembrava montata a pezzi. Se la cambi, cambia **anche**
 * `--field-h` sul `<form>`: sono lo stesso valore in due sintassi (28px = 1.75rem).
 */
const ROW_H = "h-7";

/**
 * Bottone icona delle righe (rimuovi, aggiungi descrizione): pastiglia chiara
 * fissa invece di una semplice icona tenue. Sullo sfondo a gradiente dell'app le
 * icone `sky-300`/`gray-300` diventavano invisibili in alcune zone. Stessa
 * impostazione dei bottoni riga del form menù e della maniglia di `ReorderList`.
 */
const rowIconBtn =
  `flex ${ROW_H} w-7 shrink-0 items-center justify-center rounded-lg border border-white/60 bg-white/70 shadow-sm transition-colors`;
const rowIconBtnNeutral = `${rowIconBtn} text-sky-600 hover:bg-white hover:text-sky-900`;
const rowIconBtnDanger = `${rowIconBtn} text-rose-500 hover:bg-rose-50 hover:text-rose-600`;


// py-1.5 su mobile (~34px), py-2 da sm in su — vedi anche `Input` in components/ui/Input.tsx
// Il testo dentro ai campi usa lo stesso knob di `Input` (--field-font-size):
// nelle righe fitte di ingredienti/step un campo alla dimensione piena stona
// contro i chip e le etichette accanto.
const inlineInput =
  "rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm px-2 py-1.5 sm:py-2 text-[length:var(--field-font-size,0.875em)] text-sky-950 placeholder:text-[1em] placeholder:text-sky-600/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/30";

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
        // Stessa altezza dei campi e dei bottoni della riga (vedi ROW_H)
        ROW_H,
        "inline-flex min-w-0 items-center gap-1 rounded-full border pl-2 pr-2 transition-colors focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-300/30",
        value.trim() ? "border-emerald-300 bg-emerald-100/70" : "border-white/60 bg-white/70"
      )}
    >
      <Layers size={11} className={clsx("shrink-0", value.trim() ? "text-emerald-700" : "text-sky-600")} />
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="sezione"
        title="Sezione/preparazione di questo ingrediente (es. Per l'impasto)"
        className={clsx(
          "min-w-0 bg-transparent text-[0.6875em] font-medium placeholder:font-normal focus:outline-none",
          compact ? "w-20" : "w-24 sm:w-28",
          value.trim() ? "text-emerald-900 placeholder:text-emerald-700/50" : "text-sky-900 placeholder:text-sky-600/70"
        )}
      />
    </span>
  );
}

/**
 * Avviso sulla riga ingrediente: i passi ne hanno assegnato più del totale.
 * Sta qui e non solo nel pannello del passo perché il numero sbagliato appartiene
 * all'ingrediente — chi apre il form deve vederlo senza aprire i passi. Compare
 * **solo** in caso di sforamento: la riga mobile è già al limite delle due righe.
 */
function OverAllocationChip({ assigned, total, unit }: { assigned: number; total: string; unit: string }) {
  const u = unit.trim();
  return (
    <span
      title={`I passi usano ${formatQty(assigned)}${u ? ` ${u}` : ""} di questo ingrediente, più del totale indicato`}
      className={clsx(
        ROW_H,
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2 text-[0.6875em] font-medium text-rose-800"
      )}
    >
      <TriangleAlert size={11} className="shrink-0" />
      <span className="tabular-nums">
        {formatQty(assigned)}/{total}
        {u && ` ${u}`}
      </span>
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
        ROW_H,
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 text-[0.6875em] font-medium transition-colors",
        active
          ? "border-amber-300 bg-amber-100 text-amber-800"
          : "border-white/60 bg-white/70 text-sky-600 hover:border-amber-200 hover:text-amber-700"
      )}
    >
      <TagIcon size={11} /> {compact ? "opz." : "opzionale"}
    </button>
  );
}

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
 * Ingredienti necessari a un passo: chip dei legami + pannello di selezione con la
 * quantità usata in questo passo.
 *
 * Opzionale per definizione (le ricette esistenti non hanno legami), quindi da
 * chiuso occupa una riga sola e non mostra nulla se non c'è niente di legato. Le
 * quantità sono una ripartizione del totale della riga ingrediente: il pannello
 * mostra sempre «di X» e il residuo, e segnala in rosa se la somma dei passi
 * supera il totale (avviso, non blocco — vedi `handleSubmit`).
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
  // Nell'ordine della lista ingredienti, non in quello di selezione: si rilegge
  // come la lista sopra
  const chips = all.filter((i) => selectedByUid.has(i.uid));

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((ing) => {
          const alloc = allocations.get(ing.uid);
          return (
            <span
              key={ing.uid}
              className={clsx(
                "inline-flex max-w-full items-center gap-1 rounded-full border py-0.5 pl-2 pr-1 text-[0.6875em] font-medium",
                alloc?.over
                  ? "border-rose-300 bg-rose-100/80 text-rose-900"
                  : "border-emerald-300 bg-emerald-100/70 text-emerald-900"
              )}
            >
              <span className="truncate">
                {chipLabel(ing, selectedByUid.get(ing.uid)!, !!alloc?.split)}
              </span>
              <button
                type="button"
                onClick={() => onToggle(ing.uid)}
                title="Togli l'ingrediente dal passo"
                className={clsx(
                  "shrink-0 rounded-full p-0.5 transition-colors",
                  alloc?.over
                    ? "text-rose-700 hover:bg-rose-200 hover:text-rose-900"
                    : "text-emerald-700 hover:bg-emerald-200 hover:text-emerald-900"
                )}
              >
                <X size={11} />
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title="Scegli gli ingredienti che servono in questo passo e quanto ne serve"
          className={clsx(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875em] font-medium transition-colors",
            open
              ? "border-emerald-300 bg-emerald-100/70 text-emerald-800"
              : "border-white/60 bg-white/70 text-sky-600 hover:border-emerald-200 hover:text-emerald-700"
          )}
        >
          <Carrot size={11} />
          {chips.length > 0 ? "Modifica" : "Ingredienti"}
        </button>
      </div>

      {open && (
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-1.5 sm:p-2">
          {all.length === 0 ? (
            <p className="text-[0.6875em] text-sky-700">
              Aggiungi prima gli ingredienti della ricetta: qui potrai spuntare quelli che servono in questo passo.
            </p>
          ) : (
            // Liste lunghe: il pannello scrolla invece di allungare il passo
            <ul className="max-h-64 space-y-1 overflow-y-auto pr-0.5">
              {all.map((ing) => {
                const link = selectedByUid.get(ing.uid);
                const active = !!link;
                const alloc = allocations.get(ing.uid);
                const total = rowTotal(ing);
                const own = linkQty(link);
                // Quanto ne resta per QUESTO passo: totale meno quello che si sono
                // già preso gli altri passi (la quota di questo non conta)
                const takenElsewhere = Math.round(((alloc?.assigned ?? 0) - (own ?? 0)) * 100) / 100;
                const availableHere =
                  total != null ? Math.round((total - takenElsewhere) * 100) / 100 : null;
                const over = active && own != null && availableHere != null
                  && own - availableHere > QTY_EPSILON;
                const unit = ing.unit.trim();

                return (
                  <li
                    key={ing.uid}
                    className={clsx(
                      "flex flex-wrap items-center gap-1 rounded-lg border px-1 py-1 transition-colors",
                      over
                        ? "border-rose-300 bg-rose-50/80"
                        : active
                        ? "border-emerald-300 bg-emerald-100/60"
                        : "border-white/70 bg-white/70"
                    )}
                  >
                    {/* Nome = toggle del legame. `basis-full` su mobile (riga sua,
                        i controlli quantità vanno sotto), in linea da sm in su */}
                    <button
                      type="button"
                      onClick={() => onToggle(ing.uid)}
                      title={active ? "Togli l'ingrediente dal passo" : "Aggiungi l'ingrediente al passo"}
                      className={clsx(
                        ROW_H,
                        "flex min-w-0 flex-1 basis-full items-center gap-1.5 rounded-md px-1 text-left text-[0.75em] font-medium transition-colors sm:basis-40",
                        active ? "text-emerald-900" : "text-sky-800 hover:text-emerald-700"
                      )}
                    >
                      <span
                        className={clsx(
                          "flex size-4 shrink-0 items-center justify-center rounded border",
                          active
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-sky-300 bg-white/80"
                        )}
                      >
                        {active && <Check size={11} />}
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
                            value={link.qty}
                            onChange={(e) => onQtyChange(ing.uid, e.target.value)}
                            placeholder="q.b."
                            title="Quantità usata in questo passo (vuoto = quanto serve)"
                            className={clsx(
                              inlineInput,
                              ROW_H,
                              "w-16 px-1.5 py-0 text-center",
                              over && "border-rose-300 bg-rose-50/80"
                            )}
                          />
                          {unit && (
                            <span className="text-[0.6875em] font-medium text-sky-700">{unit}</span>
                          )}
                          {/* "resto"/"tutto": la quantità che ancora non è assegnata */}
                          {availableHere != null && availableHere > 0 && own !== availableHere && (
                            <button
                              type="button"
                              onClick={() => onQtyChange(ing.uid, String(availableHere))}
                              title="Assegna a questo passo la quantità non ancora assegnata"
                              className={clsx(
                                ROW_H,
                                "shrink-0 rounded-full border border-white/70 bg-white/80 px-2 text-[0.6875em] font-medium text-sky-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
                              )}
                            >
                              {takenElsewhere > 0 ? "resto" : "tutto"}
                            </button>
                          )}
                          {own != null && (
                            <button
                              type="button"
                              onClick={() => onQtyChange(ing.uid, "")}
                              title="Non specificare la quantità (quanto serve)"
                              className={rowIconBtnNeutral}
                            >
                              <RotateCcw size={12} />
                            </button>
                          )}
                        </span>

                        {/* Riepilogo: su mobile va a capo da solo, su desktop si
                            allinea a destra */}
                        <span
                          className={clsx(
                            "basis-full text-[0.6875em] sm:ml-auto sm:basis-auto sm:text-right",
                            over ? "font-medium text-rose-700" : "text-sky-600"
                          )}
                        >
                          {total == null ? (
                            "totale non indicato"
                          ) : over ? (
                            // clamp: se altri passi hanno già sforato, il disponibile
                            // qui è negativo e "disponibili -50 g" non si legge
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

  return (
    // Due knob per la tipografia del form, non serve toccare altro:
    //  · `text-[…rem]`      → scala di TUTTI i testi (Input/Button/SectionHeader/
    //                         combobox e chip sono in `em`, seguono da soli)
    //  · `--field-font-size` → solo il testo digitato dentro ai campi, tenuto più
    //                         basso della scala generale perché nelle righe fitte
    //                         un campo a dimensione piena sovrasta chip ed etichette
    //  · `--field-h`         → altezza dei campi in versione compatta; stesso valore
    //                         di `ROW_H` (28px), così campi, maniglie, bottoni icona
    //                         e chip sono allineati sulla stessa banda
    // `data-compact-fields` disattiva su questo form la guardia anti-zoom iOS di
    // globals.css (`input { font-size: 16px }` su touch), che essendo non-layered
    // batteva ogni classe: senza, su mobile i campi restavano a 16px.
    <form
      onSubmit={handleSubmit}
      data-compact-fields
      className="space-y-4 sm:space-y-6 text-[0.9rem] sm:text-[0.95rem] [--field-font-size:0.75em] [--field-h:1.75rem]"
    >

      {/* Sticky top bar */}
      <div className="sticky z-30 flex items-center justify-between gap-2 rounded-b-2xl border border-white/50 bg-white/70 backdrop-blur-xl px-3 py-2 sm:gap-3 sm:px-5 sm:py-3 shadow-lg shadow-black/[0.07] ring-1 ring-black/[0.04]" style={{ top: "calc(env(safe-area-inset-top, 0px) + 56px)" }}>
        <h1 className="text-[0.875em] font-semibold text-gray-800 truncate">
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
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[0.875em] text-red-700">
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
          <Input
            label={<span className="inline-flex items-center gap-1">Prep. (min) {timesManual ? <Pencil size={11} className="text-amber-600" /> : <Lock size={11} className="text-sky-600" />}</span>}
            id="prep-min" type="number" min={0} value={prepValue} readOnly={!timesManual}
            onChange={(e) => setPrep(e.target.value)} placeholder={timesManual ? "20" : "—"}
            className={clsx(!timesManual && "cursor-default bg-sky-50/70 text-sky-800")}
            title={timesManual ? undefined : "Calcolato dai passi: sbloccalo per modificarlo a mano"} />
          <Input
            label={<span className="inline-flex items-center gap-1">Cottura (min) {timesManual ? <Pencil size={11} className="text-amber-600" /> : <Lock size={11} className="text-sky-600" />}</span>}
            id="cook-min" type="number" min={0} value={cookValue} readOnly={!timesManual}
            onChange={(e) => setCook(e.target.value)} placeholder={timesManual ? "30" : "—"}
            className={clsx(!timesManual && "cursor-default bg-sky-50/70 text-sky-800")}
            title={timesManual ? undefined : "Calcolato dai passi: sbloccalo per modificarlo a mano"} />
        </div>
        {/* Barra di stato dei tempi: sempre visibile, così si può passare a mano
            anche quando nessuno step ha minuti (altrimenti i campi resterebbero
            bloccati e vuoti senza via d'uscita). */}
        <div className={clsx(
          "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-2.5 py-1.5 text-[0.75em]",
          timesManual
            ? "border-amber-100 bg-amber-50/60 text-amber-800"
            : "border-sky-100 bg-sky-50/60 text-sky-700"
        )}>
          {derived.hasAny ? (
            <>
              <span className="font-medium">Dai passi:</span>
              <span>Prep <strong>{derived.prep}m</strong></span>
              <span>Cottura <strong>{derived.cook}m</strong></span>
              {derived.wait > 0 && <span>Attesa <strong>{derived.wait}m</strong></span>}
            </>
          ) : (
            <span className="font-medium">
              {timesManual ? "Valori inseriti a mano" : "I tempi si calcolano dai minuti dei passi"}
            </span>
          )}
          <button
            type="button"
            onClick={toggleTimesManual}
            className={clsx(
              "ml-auto inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[0.6875em] font-semibold text-white transition-colors",
              timesManual ? "bg-amber-500 hover:bg-amber-600" : "bg-sky-500 hover:bg-sky-600"
            )}
            title={timesManual
              ? "Torna a calcolare Prep. e Cottura dalla somma dei passi"
              : "Sblocca i campi per inserire Prep. e Cottura a mano"}
          >
            {timesManual ? <RotateCcw size={12} /> : <Pencil size={12} />}
            {timesManual ? "Torna automatico" : <>Modifica<span className="hidden sm:inline"> a mano</span></>}
          </button>
        </div>
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
                    "absolute bottom-0 left-0 right-0 py-1 text-center text-[0.6875em] font-semibold transition-colors",
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
                  <span className="text-[0.75em] text-sky-600 w-5 shrink-0">{i + 1}.</span>
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
              ROW_H,
              "inline-flex items-center gap-2 rounded-full border px-3 text-[0.75em] font-medium transition-colors",
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
          <p className="text-[0.75em] text-sky-600">
            {useSections
              ? "Assegna a ogni riga la sua preparazione (es. «Per l'impasto»): il dettaglio ricetta le mostra raggruppate."
              : "Attivale se la ricetta ha più preparazioni (es. impasto e crema)."}
          </p>
        </div>

        <div className="space-y-2">
          {/* Header colonne — solo desktop */}
          <div
            className="hidden sm:grid items-center gap-2 px-1 text-[0.75em] font-medium text-sky-600"
            style={{ gridTemplateColumns: "1.75rem 4rem 5rem 1fr 1.75rem" }}
          >
            <span />
            <span>Qtà</span>
            <span>Unità</span>
            <span>Ingrediente / Descrizione</span>
            <span />
          </div>

          <ReorderList values={ingredients} onReorder={setIngredients} className="space-y-2">
          {ingredients.map((ing, i) => (
            // handleSize: la maniglia deve essere alta quanto i campi della riga (ROW_H)
            <ReorderRow key={ing.uid} value={ing} handleSize={`${ROW_H} w-7`}>
            {(handle) => (
            <div>
              {/* ── Card mobile (compatta: nome + qtà/unità su due righe;
                     descrizione, opzionale e sezione solo se servono).
                     Maniglia, campi, bottoni e chip condividono ROW_H: la riga
                     deve leggersi come un blocco solo, non come pezzi diversi ── */}
              <div className="sm:hidden rounded-xl border border-white/50 bg-white/45 p-1.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  {handle}
                  <IngredientCombobox
                    value={ing.name}
                    onChange={(v) => updateIngredient(i, "name", v)}
                    allIngredients={allIngredients}
                    onNewIngredient={handleNewIngredient}
                    placeholder="Ingrediente"
                    className={`${inlineInput} ${ROW_H} min-w-0 flex-1 py-0`}
                  />
                  {/* Descrizione: rara, si apre su richiesta (icona qui per non
                      rubare una riga intera ai chip qtà/unità/sezione sotto) */}
                  {!showDescription(ing) && (
                    <button type="button" onClick={() => openDescription(ing.uid)}
                      title="Aggiungi una descrizione all'ingrediente"
                      className={rowIconBtnNeutral}><StickyNote size={14} /></button>
                  )}
                  <button type="button" onClick={() => removeIngredient(i)}
                    title="Rimuovi ingrediente"
                    className={rowIconBtnDanger}><X size={14} /></button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <input type="number" min={0} step="any" value={ing.qty}
                    onChange={(e) => updateIngredient(i, "qty", e.target.value)} placeholder="Qtà"
                    className={`${inlineInput} ${ROW_H} w-14 shrink-0 px-1.5 py-0 text-center`} />
                  <input type="text" value={ing.unit}
                    onChange={(e) => updateIngredient(i, "unit", e.target.value)} placeholder="g/ml"
                    className={`${inlineInput} ${ROW_H} w-16 shrink-0 px-1.5 py-0 text-center`} />
                  <OptionalChip compact active={ing.optional} onToggle={() => toggleIngredientOptional(i)} />
                  {allocations.get(ing.uid)?.over && (
                    <OverAllocationChip
                      assigned={allocations.get(ing.uid)!.assigned}
                      total={ing.qty.trim()}
                      unit={ing.unit}
                    />
                  )}
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
                    className={`${inlineInput} ${ROW_H} w-full py-0`}
                  />
                )}
              </div>

              {/* ── Grid desktop ── */}
              <div
                className="hidden sm:grid items-start gap-2"
                style={{ gridTemplateColumns: "1.75rem 4rem 5rem 1fr 1.75rem" }}
              >
                <div className="flex items-start justify-center">{handle}</div>
                <input type="number" min={0} step="any" value={ing.qty}
                  onChange={(e) => updateIngredient(i, "qty", e.target.value)} placeholder="Qtà"
                  className={`${inlineInput} ${ROW_H} w-full py-0`} />
                <input type="text" value={ing.unit}
                  onChange={(e) => updateIngredient(i, "unit", e.target.value)} placeholder="g/ml…"
                  className={`${inlineInput} ${ROW_H} w-full py-0`} />
                <div className="flex flex-col gap-1">
                  <IngredientCombobox
                    value={ing.name}
                    onChange={(v) => updateIngredient(i, "name", v)}
                    allIngredients={allIngredients}
                    onNewIngredient={handleNewIngredient}
                    placeholder="Ingrediente"
                    className={`${inlineInput} ${ROW_H} w-full py-0`}
                  />
                  <input type="text" value={ing.description}
                    onChange={(e) => updateIngredient(i, "description", e.target.value)}
                    placeholder="descrizione (es. fredda, bollente…)"
                    className={`${inlineInput} ${ROW_H} w-full py-0 opacity-80`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                  <OptionalChip active={ing.optional} onToggle={() => toggleIngredientOptional(i)} />
                  {allocations.get(ing.uid)?.over && (
                    <OverAllocationChip
                      assigned={allocations.get(ing.uid)!.assigned}
                      total={ing.qty.trim()}
                      unit={ing.unit}
                    />
                  )}
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
                  className={rowIconBtnDanger}><X size={14} /></button>
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
            <ReorderRow key={step.uid} value={step} handleSize={`${ROW_H} w-7`} className="flex gap-2 sm:gap-3 items-start">
            {(handle) => (
            <>
              <span className={`flex ${ROW_H} w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[0.75em] font-bold text-white`}>
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
                    className={`${inlineInput} ${ROW_H} shrink-0 py-0`}
                  >
                    {STEP_KINDS.map((k) => (
                      <option key={k} value={k}>{STEP_KIND_LABEL[k]}</option>
                    ))}
                  </select>
                  <input type="number" min={0} value={step.mins}
                    onChange={(e) => updateStep(i, "mins", e.target.value)} placeholder="—"
                    className={`${inlineInput} ${ROW_H} w-16 shrink-0 py-0 sm:w-20`} />
                  <span className="text-[0.6875em] text-sky-600 sm:text-[0.75em]">min (opz.)</span>
                </div>
                {/* Ingredienti che servono in questo passo (con la quantità usata
                    qui): opzionali, mostrati in modalità cucina e sotto il passo
                    nel dettaglio ricetta */}
                <StepIngredients
                  all={namedIngredients}
                  selected={step.ingredients}
                  allocations={allocations}
                  onToggle={(u) => toggleStepIngredient(i, u)}
                  onQtyChange={(u, qty) => setStepIngredientQty(i, u, qty)}
                />
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                {handle}
                <button type="button" onClick={() => removeStep(i)}
                  title="Rimuovi passo"
                  className={rowIconBtnDanger}><X size={14} /></button>
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

      {/* Bottom save — "md" e non più "lg": è il tasto più grande del form, ma
          accanto a campi da 28px un lg sembrava di un'altra pagina */}
      <div className="flex justify-end gap-2 pb-10">
        <Button type="button" variant="secondary" size="md" onClick={() => router.back()}>
          Annulla
        </Button>
        <Button type="submit" size="md" loading={saving}>
          {isEdit ? <span className="inline-flex items-center gap-1.5"><Save size={14} /> Salva modifiche</span> : <span className="inline-flex items-center gap-1.5"><CircleCheck size={14} /> Crea ricetta</span>}
        </Button>
      </div>

      {/* Conferma sforamento quantità: avviso, non blocco (vedi handleSubmit) */}
      <Modal
        open={confirmOver}
        onClose={() => setConfirmOver(false)}
        title="Quantità oltre il totale"
        size="sm"
      >
        <p className="text-sm text-sky-800">
          {overAllocated.length === 1
            ? "In un ingrediente la somma"
            : `In ${overAllocated.length} ingredienti la somma`}{" "}
          delle quantità assegnate ai passi supera il totale della ricetta:
        </p>
        {/* La lista scrolla da sé (non tutta la modale): con molti ingredienti
            sforati i due bottoni qui sotto finivano oltre il bordo dello schermo
            e bisognava scorrere la modale per trovarli. 35dvh regge anche il
            telefono in orizzontale, dove l'altezza utile è ~340px */}
        <ul className="mt-3 max-h-[35dvh] space-y-1.5 overflow-y-auto pr-0.5">
          {overAllocated.map((ing) => {
            const a = allocations.get(ing.uid);
            const unit = ing.unit.trim();
            return (
              <li
                key={ing.uid}
                className="flex flex-wrap items-baseline gap-x-1.5 rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-1.5 text-sm"
              >
                <span className="min-w-0 break-words font-semibold text-rose-900">{ing.name.trim()}</span>
                <span className="text-rose-700">
                  assegnati {formatQty(a?.assigned ?? 0)}
                  {unit && ` ${unit}`} su {ing.qty.trim()}
                  {unit && ` ${unit}`}
                </span>
              </li>
            );
          })}
        </ul>
        {/* Su mobile in colonna (le due etichette affiancate non stanno in 288px,
            la larghezza della modale "sm" su un telefono da 320px): `col-reverse`
            tiene l'azione principale in alto, come da abitudine su iOS */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
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
