"use client";

import { useState } from "react";
import { ChevronRight, Download, FileDown, Loader2, Share2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ds/Button";
import { CutleryIcon, PotIcon } from "@/components/icons";
import { FormError } from "@/components/admin/FormParts";
import { Skeleton } from "@/components/ds/Progress";
import { useAuth } from "@/components/AuthProvider";
import {
  urlToDataUrl,
  logoPngDataUrl,
  safeFileName,
  type RecipePdfData,
} from "@/components/recipe/RecipePdfButton";
import type { StepIngredientLink } from "@/lib/step-ingredients";
import { GUEST_THEME_INK, guestSheet, type GuestCard, type GuestRecipe } from "@/lib/menu-guest-card";
import { GuestMenuEditor, toEditorState, toGuestCard, type GuestEditorState } from "./GuestMenuEditor";
import type { MenuPdfMeta, MenuPdfRecipe, MenuPdfTocItem } from "./MenuPdfDocument";

export interface MenuPdfProps {
  /** Ricette del menù in ordine. Le "veloci" (`quick`) non hanno dettaglio: solo nell'elenco in copertina */
  menu: MenuPdfMeta & { id: number; photo: string | null; recipes: { id: number; name: string; quick: boolean }[] };
}

/** Risposta (parziale) di GET /api/recipes/[id] usata per il PDF. */
interface RecipeDetailResponse {
  name: string;
  servings: number | null;
  servingsUnit?: string | null;
  prep: number | null;
  cook: number | null;
  notes: string | null;
  links: string | null;
  photo: string | null;
  categories: { name: string; color: string }[];
  tags: { name: string }[];
  ingredients: { id?: number; name: string; qty: number | null; unit: string | null; description: string | null; optional?: boolean; section?: string | null }[];
  steps: { text: string; mins: number | null; kind?: string; stepIngredients?: StepIngredientLink[] }[];
}

/** Una ricetta del menù dopo il caricamento: `detail` nullo = veloce oppure non letta */
interface Loaded {
  name: string;
  quick: boolean;
  detail: RecipeDetailResponse | null;
}

interface GuestData {
  recipes: GuestRecipe[];
  canSave: boolean;
}

/** File pronto: si scarica o si manda con il foglio di condivisione del sistema */
interface Ready {
  blob: Blob;
  fileName: string;
  /** Il foglio degli ospiti è stato generato ma l'organizzazione non si è salvata */
  notSaved?: boolean;
}

type Step = "choose" | "guest" | "missing" | "ready";

function toPdfData(r: RecipeDetailResponse): RecipePdfData {
  return {
    name: r.name,
    servings: r.servings,
    servingsUnit: r.servingsUnit ?? null,
    prep: r.prep,
    cook: r.cook,
    notes: r.notes,
    links: r.links,
    photo: r.photo,
    categories: r.categories.map((c) => ({ name: c.name, color: c.color })),
    tags: r.tags.map((t) => ({ name: t.name })),
    ingredients: r.ingredients.map((i) => ({
      id: i.id, name: i.name, qty: i.qty, unit: i.unit, description: i.description, optional: i.optional, section: i.section ?? null,
    })),
    steps: r.steps.map((s) => ({ text: s.text, mins: s.mins, kind: s.kind, stepIngredients: s.stepIngredients })),
  };
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Condivisione di file: Safari iPhone/iPad, Chrome Android, Edge/Chrome su Windows e macOS */
function canShareFile(file: File): boolean {
  return typeof navigator !== "undefined" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
}

/**
 * Esporta il menù in PDF: bottone tondo con icona (3.10) nella testata del dettaglio menù.
 * - Visitatori: scarica subito il PDF «Per la cucina».
 * - Admin: finestra (10.1) con la scelta fra **Per la cucina** (lista dei piatti + ricette con
 *   ingredienti e passi, `MenuPdfDocument`) e **Per gli ospiti** (menù da tavola,
 *   `GuestMenuPdfDocument`), che apre l'organizzazione per portate (`GuestMenuEditor`, salvata
 *   col menù in `MenuGuestCard`). Generato il file: «Scarica» e «Invia» (`navigator.share`, dove
 *   c'è). Il file si genera prima e si condivide dopo, con un tocco a parte: iOS accetta
 *   `navigator.share` solo dentro un gesto dell'utente, non al termine di un'attesa.
 */
export function MenuPdfButton({ menu }: MenuPdfProps) {
  const { isAdmin } = useAuth();
  const [step, setStep] = useState<Step | null>(null);
  const [busy, setBusy] = useState<"kitchen" | "guest" | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Ricette che non si sono potute leggere: si chiede se esportare senza
  const [missing, setMissing] = useState<{ failed: string[]; loaded: Loaded[] } | null>(null);
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [draft, setDraft] = useState<GuestEditorState | null>(null);
  const [ready, setReady] = useState<Ready | null>(null);

  const close = () => {
    if (busy) return;
    setStep(null);
    setError(null);
    setMissing(null);
    setReady(null);
  };

  const fileFor = (kind: "cucina" | "ospiti") => `${safeFileName(menu.name, "menu")} - ${kind}.pdf`;

  /* ── Per la cucina ── */

  const buildKitchen = async (loaded: Loaded[]): Promise<Blob> => {
    // Elenco della prima pagina: tutte le ricette in ordine di menù, veloci comprese
    const toc: MenuPdfTocItem[] = loaded.map((r) => ({ name: r.detail?.name ?? r.name, quick: r.quick }));

    const [{ pdf }, { MenuPdfDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("./MenuPdfDocument"),
    ]);

    const recipes: MenuPdfRecipe[] = await Promise.all(
      loaded.flatMap((r, i) =>
        r.detail
          ? [
              (async () => {
                const recipe = toPdfData(r.detail!);
                const photoData = recipe.photo ? await urlToDataUrl(recipe.photo) : undefined;
                return { recipe, photoData, number: i + 1 };
              })(),
            ]
          : []
      )
    );

    const [coverPhoto, logoData] = await Promise.all([
      menu.photo ? urlToDataUrl(menu.photo) : Promise.resolve(undefined),
      logoPngDataUrl(),
    ]);

    return pdf(
      <MenuPdfDocument
        menu={{ name: menu.name, description: menu.description, date: menu.date, servingTime: menu.servingTime, people: menu.people }}
        recipes={recipes}
        toc={toc}
        coverPhoto={coverPhoto}
        logoData={logoData}
      />
    ).toBlob();
  };

  /** Consegna il file: l'admin sceglie fra Scarica e Invia, il visitatore lo scarica e basta */
  const deliver = (blob: Blob, fileName: string, notSaved?: boolean) => {
    if (isAdmin) {
      setReady({ blob, fileName, notSaved });
      setStep("ready");
    } else {
      download(blob, fileName);
      setStep(null);
    }
  };

  const exportKitchen = async (loaded?: Loaded[]) => {
    if (busy) return;
    setBusy("kitchen");
    setError(null);
    try {
      let list = loaded;
      if (!list) {
        // Dettaglio completo di ogni ricetta (ingredienti, passi). Le veloci non si scaricano:
        // non hanno dettaglio (l'API risponde 404). Una ricetta che non risponde non deve far
        // fallire tutto il menù: la si segnala.
        const results: Loaded[] = await Promise.all(
          menu.recipes.map(async ({ id, name, quick }): Promise<Loaded> => {
            if (quick) return { name, quick: true, detail: null };
            try {
              const res = await fetch(`/api/recipes/${id}`);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return { name, quick: false, detail: (await res.json()) as RecipeDetailResponse };
            } catch (e) {
              console.error(`Errore export PDF menù: ricetta «${name}» (${id})`, e);
              return { name, quick: false, detail: null };
            }
          })
        );
        const failed = results.filter((r) => !r.quick && !r.detail);
        if (failed.length > 0) {
          setMissing({ failed: failed.map((r) => r.name), loaded: results.filter((r) => r.quick || r.detail) });
          setStep("missing");
          return;
        }
        list = results;
      }
      deliver(await buildKitchen(list), fileFor("cucina"));
    } catch (e) {
      console.error("Errore export PDF menù", e);
      setError("Non sono riuscito a creare il PDF.");
      if (!isAdmin) setStep("missing");
    } finally {
      setBusy(null);
    }
  };

  /* ── Per gli ospiti ── */

  const openGuest = async () => {
    setStep("guest");
    setError(null);
    if (guest) return;
    try {
      const res = await fetch(`/api/menus/${menu.id}/guest-card`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { card: GuestCard; recipes: GuestRecipe[]; canSave: boolean };
      setGuest({ recipes: data.recipes, canSave: data.canSave });
      setDraft(toEditorState(data.card));
    } catch (e) {
      console.error("Errore lettura foglio ospiti", e);
      setError("Non riesco a leggere le ricette del menù.");
    }
  };

  const exportGuest = async () => {
    if (!guest || !draft || busy) return;
    setBusy("guest");
    setError(null);
    const card = toGuestCard(draft);
    try {
      // Si salva l'organizzazione prima di disegnare: se non riesce il PDF esce lo stesso
      let notSaved = !guest.canSave;
      if (guest.canSave) {
        const res = await fetch(`/api/menus/${menu.id}/guest-card`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(card),
        }).catch(() => null);
        notSaved = !res?.ok;
      }

      const [{ pdf }, { GuestMenuPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./GuestMenuPdfDocument"),
      ]);
      const [logoTinted, logoBianco, photo] = await Promise.all([
        card.format === "phone" ? Promise.resolve(undefined) : logoPngDataUrl("blu", GUEST_THEME_INK[card.theme]),
        card.format === "phone" ? logoPngDataUrl("bianco") : Promise.resolve(undefined),
        card.format === "phone" && menu.photo ? urlToDataUrl(menu.photo) : Promise.resolve(undefined),
      ]);
      const blob = await pdf(
        <GuestMenuPdfDocument
          menu={{ name: menu.name, description: menu.description, date: menu.date, servingTime: menu.servingTime }}
          sheet={guestSheet(card, guest.recipes)}
          logo={logoTinted}
          logoBianco={logoBianco}
          photo={photo}
        />
      ).toBlob();
      deliver(blob, fileFor("ospiti"), notSaved);
    } catch (e) {
      console.error("Errore PDF ospiti", e);
      setError("Non sono riuscito a creare il PDF.");
    } finally {
      setBusy(null);
    }
  };

  /* ── Pronto ── */

  const share = async () => {
    if (!ready) return;
    const file = new File([ready.blob], ready.fileName, { type: "application/pdf" });
    try {
      await navigator.share({ files: [file], title: menu.name });
    } catch (e) {
      // Annullato dall'utente: nessun errore da mostrare
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error("Condivisione non riuscita", e);
      setError("Condivisione non riuscita: scarica il file e mandalo a mano.");
    }
  };

  const onButton = () => {
    if (isAdmin) {
      setStep("choose");
      setError(null);
    } else void exportKitchen();
  };

  const shareable = ready ? canShareFile(new File([ready.blob], ready.fileName, { type: "application/pdf" })) : false;
  const canSkip = missing?.loaded.some((r) => !r.quick) ?? false;

  const title =
    step === "guest" ? "Menù per gli ospiti" : step === "missing" ? "Ricetta non disponibile" : step === "ready" ? "PDF pronto" : "Esporta il menù";

  const footer =
    step === "guest" ? (
      <div className="flex w-full justify-between gap-2.5">
        <Button variant="secondary" onClick={() => setStep("choose")} disabled={!!busy}>
          Indietro
        </Button>
        <Button onClick={() => void exportGuest()} loading={busy === "guest"} disabled={!draft}>
          Crea il PDF
        </Button>
      </div>
    ) : undefined;

  return (
    <>
      <Modal open={step !== null} onClose={close} title={title} size={step === "guest" ? "lg" : "sm"} footer={footer}>
        {step === "choose" && (
          <div className="flex flex-col gap-2.5">
            <ChoiceCard
              icon={<PotIcon />}
              title="Per la cucina"
              text="Elenco dei piatti, poi ogni ricetta con ingredienti e passi."
              loading={busy === "kitchen"}
              disabled={!!busy || menu.recipes.length === 0}
              onClick={() => void exportKitchen()}
            />
            <ChoiceCard
              icon={<CutleryIcon />}
              title="Per gli ospiti"
              text="Un menù da tavola da mandare ad amici e parenti, con i piatti divisi per portata."
              disabled={!!busy}
              onClick={() => void openGuest()}
            />
            {error && <FormError>{error}</FormError>}
          </div>
        )}

        {step === "guest" &&
          (draft && guest ? (
            <div className="flex flex-col gap-4">
              {!guest.canSave && (
                <p className="rounded-ctl bg-blu-50 px-3 py-2 text-[0.875rem] text-grigio">L&apos;organizzazione per portate non si può ancora salvare: il PDF si crea lo stesso.</p>
              )}
              <GuestMenuEditor value={draft} onChange={setDraft} recipes={guest.recipes} />
              {error && <FormError>{error}</FormError>}
            </div>
          ) : error ? (
            <FormError action={<Button size="sm" variant="secondary" onClick={() => { setGuest(null); void openGuest(); }}>Riprova</Button>}>
              {error}
            </FormError>
          ) : (
            <div className="flex flex-col gap-3" aria-busy>
              <Skeleton className="h-(--h-btn) w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}

        {step === "missing" && (
          <>
            {missing ? (
              <p className="text-grigio">
                {missing.failed.length === 1 ? "Non riesco a leggere la ricetta " : "Non riesco a leggere le ricette "}
                <strong className="text-blu-950">{missing.failed.map((n) => `«${n}»`).join(", ")}</strong>.{" "}
                {canSkip
                  ? `Vuoi esportare il PDF senza ${missing.failed.length === 1 ? "questa ricetta" : "queste ricette"}?`
                  : "Nessun'altra ricetta del menù da esportare."}
              </p>
            ) : (
              <p className="text-grigio">{error}</p>
            )}
            <div className="mt-5 flex justify-end gap-2.5">
              <Button variant="secondary" onClick={close}>
                Annulla
              </Button>
              {missing && canSkip && (
                <Button loading={busy === "kitchen"} onClick={() => void exportKitchen(missing.loaded)}>
                  Esporta senza
                </Button>
              )}
            </div>
          </>
        )}

        {step === "ready" && ready && (
          <div className="flex flex-col gap-4">
            <p className="flex items-center gap-2 font-semibold break-all">
              <FileDown className="size-5 shrink-0 text-blu-800" aria-hidden />
              {ready.fileName}
            </p>
            {ready.notSaved && <p className="text-[0.875rem] text-grigio">L&apos;organizzazione per portate non è stata salvata: la prossima volta riparte da capo.</p>}
            <div className="flex flex-wrap gap-2.5">
              <Button icon={<Download />} onClick={() => download(ready.blob, ready.fileName)}>
                Scarica
              </Button>
              {shareable && (
                <Button variant="secondary" icon={<Share2 />} onClick={() => void share()}>
                  Invia
                </Button>
              )}
            </div>
            {error && <FormError>{error}</FormError>}
          </div>
        )}
      </Modal>

      <button
        type="button"
        onClick={onButton}
        disabled={busy !== null || menu.recipes.length === 0}
        aria-label="Esporta in PDF"
        title="Esporta in PDF"
        className="inline-flex size-(--h-icon) shrink-0 items-center justify-center rounded-full border border-blu-200 bg-white text-blu-800 transition-colors hover:bg-blu-100 disabled:opacity-60"
      >
        {busy && step === null ? <Loader2 size={20} className="animate-spin motion-reduce:animate-none" /> : <FileDown size={20} />}
      </button>
    </>
  );
}

/** Opzione della finestra di scelta: icona del progetto, titolo e una riga di spiegazione */
function ChoiceCard({
  icon,
  title,
  text,
  onClick,
  loading = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-[0.85em] rounded-card border border-blu-150 bg-white p-[0.85em] text-left transition-colors hover:bg-blu-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35 disabled:opacity-60"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-ctl bg-blu-120 text-blu-800 [&_svg]:size-6" aria-hidden>
        {loading ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-[0.875rem] leading-snug text-grigio">{text}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-grigio" aria-hidden />
    </button>
  );
}
