"use client";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import {
  ArrowDown,
  ArrowUp,
  BellRing,
  IdCard,
  ChefHat,
  LayoutGrid,
  LogIn,
  LogOut,
  RotateCcw,
  Search,
  User,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLogout } from "@/components/shell/AppNav";
import { Panel } from "@/components/ds/Panel";
import { Button, IconButton } from "@/components/ds/Button";
import { buttonClasses } from "@/components/ds/button-classes";
import { Select } from "@/components/ds/Field";
import { Chip, Segmented, Switch } from "@/components/ds/Controls";
import { ConfirmModal } from "@/components/ui/Modal";
import {
  CollectionBody,
  useCollectionView,
  ViewSwitch,
} from "@/components/ui/CollectionView";
import { PotIcon } from "@/components/icons";
import { CardConfigProvider, useCardConfig } from "@/components/CardConfigProvider";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { RecipeRow } from "@/components/recipe/RecipeRow";
import { MenuCard } from "@/components/menu/MenuCard";
import { MenuRow } from "@/components/menu/MenuRow";
import { MENU_FIELDS, RECIPE_FIELDS, type CardConfig } from "@/lib/card-config";
import type { MenuSummary, RecipeSummary } from "@/lib/types";
import {
  requestNotificationPermission,
  useKeepAwake,
  wakeLockSupported,
} from "@/lib/cooking-session";
import { useLocalStore } from "@/lib/local-store";
import {
  COST_OUTPUTS,
  LIST_LAYOUT,
  MENU_SORT_OPTIONS,
  RECIPE_SORT_OPTIONS,
  SEARCH_RECENT_KEY,
  clearRecentSearches,
  recipeSortFor,
  resetPreferences,
  useCostOutputs,
  useMenuSort,
  useRecipeSort,
  type ListKind,
  type MenuSortKey,
  type RecipeSortKey,
} from "@/lib/preferences";

const noopSubscribe = () => () => {};
// l'anteprima non misura nulla: la misura la fa il riquadro invisibile largo quanto la scheda
const noRef = () => {};

/**
 * Pagina Impostazioni: account in cima (admin: profilo ed esci; visitatore: accedi), poi le
 * preferenze del dispositivo in schede `Panel` — liste (con l'anteprima dal vivo), in cucina,
 * costi del menù (solo admin), ricerca — e in fondo «Ripristina». Nessun «Salva»: ogni scelta
 * vale subito. Le righe sono «etichetta · spiegazione · controllo» (`SettingRow`).
 */
type Samples = { recipe: RecipeSummary | null; menu: MenuSummary | null } | null;

export function SettingsClient({ samples }: { samples: Samples }) {
  const { isAdmin, loading } = useAuth();
  return (
    <div className="grid gap-(--gap) @min-[760px]:grid-cols-2">
      {!loading && <AccountPanel className="@min-[760px]:col-span-2" />}
      <ListsPanel className="@min-[760px]:col-span-2" />
      {isAdmin && samples && <CardInfoPanel samples={samples} className="@min-[760px]:col-span-2" />}
      <KitchenPanel />
      {isAdmin && <CostsPanel />}
      <SearchPanel />
      <ResetPanel className={clsx(!isAdmin && "@min-[760px]:col-span-2")} />
    </div>
  );
}

/** Riga di impostazione: etichetta e spiegazione a sinistra, controllo a destra (sotto, se stretto). */
function SettingRow({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-blu-150 py-[0.7em] first:pt-0 last:border-0 last:pb-0">
      <div className="min-w-[12rem] flex-1">
        <p className="text-[0.9375rem] font-semibold">{label}</p>
        {hint && <p className="text-[0.8125rem] text-grigio">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

// ── Account ──────────────────────────────────────────────────────────────────

function AccountPanel({ className }: { className?: string }) {
  const { isAdmin, username } = useAuth();
  const logout = useLogout();
  if (!isAdmin) {
    return (
      <Panel title="Account" icon={<User />} className={className}>
        <SettingRow
          label="Non sei entrato"
          hint="Entra per creare e modificare ricette e menù. Queste impostazioni valgono anche senza entrare, su questo dispositivo."
        >
          <Link href="/login" className={buttonClasses("primary", "md")}>
            <LogIn className="size-[1.15em]" aria-hidden /> Accedi
          </Link>
        </SettingRow>
      </Panel>
    );
  }
  return (
    <Panel title="Account" icon={<User />} className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blu-120 text-blu-800">
            <ChefHat className="size-5" aria-hidden />
          </span>
          <p className="min-w-0">
            <span className="block text-xs text-grigio">Connesso come</span>
            <span className="block truncate font-bold">{username}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/profilo"
            className={buttonClasses("secondary", "md")}
          >
            <User className="size-[1.15em]" aria-hidden /> Profilo e password
          </Link>
          <Button variant="danger" icon={<LogOut />} onClick={logout}>
            Esci
          </Button>
        </div>
      </div>
    </Panel>
  );
}

// ── Liste ────────────────────────────────────────────────────────────────────

function ListsPanel({ className }: { className?: string }) {
  const [list, setList] = useState<ListKind>("recipes");
  return (
    <Panel
      title="Liste"
      icon={<LayoutGrid />}
      meta="Come vedi Ricette, Preferiti e Menù"
      className={clsx("relative", className)}
      actions={
        <Segmented<ListKind>
          label="Lista da impostare"
          value={list}
          onChange={setList}
          options={[
            { value: "recipes", label: "Ricette" },
            { value: "menus", label: "Menù" },
          ]}
        />
      }
    >
      {/* key: cambiando lista si rimisura l'anteprima da capo */}
      <ListSettings key={list} list={list} />
    </Panel>
  );
}

function ListSettings({ list }: { list: ListKind }) {
  const {
    view,
    setView,
    ref: measureRef,
    gridStyle,
    cols,
    maxCols,
    isAuto,
    colsControl,
  } = useCollectionView(list);
  return (
    <div className="flex flex-col gap-[0.9em]">
      <div>
        <SettingRow
          label="Vista"
          hint={
            list === "recipes"
              ? "Griglia di card o lista a righe. Vale anche per i Preferiti."
              : "Griglia di card o lista a righe."
          }
        >
          <ViewSwitch view={view} onView={setView} />
        </SettingRow>
        {view === "grid" && (
          <SettingRow
            label="Card per riga"
            hint={
              isAuto
                ? "Automatico: dipende dalla larghezza dello schermo. Con − e + scegli tu; tocca il numero per tornare automatico."
                : `Al massimo ${maxCols} su questo schermo. Tocca il numero per tornare automatico.`
            }
          >
            {colsControl}
          </SettingRow>
        )}
        {list === "recipes" ? <RecipeSortRow /> : <MenuSortRow />}
      </div>

      {/* la misura si prende sulla larghezza piena della scheda (= quella della lista vera, che occupa
          tutta la pagina): così massimo e «automatico» sono gli stessi della lista */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute inset-x-0 top-0 grid h-0 gap-(--gap)"
      />
      {/* anteprima dal vivo: stesso numero di card per riga della lista, in piccolo */}
      <div className="rounded-ctl bg-blu-50 p-[0.75em]" aria-hidden>
        <p className="mb-2 text-xs font-bold tracking-[0.08em] text-grigio uppercase">
          Anteprima
        </p>
        <CollectionBody
          view={view}
          gridRef={noRef}
          gridStyle={gridStyle}
          fallbackCols={LIST_LAYOUT[list].fallbackCols}
          list="stack"
        >
          {Array.from({ length: view === "list" ? 3 : Math.max(1, cols) }).map(
            (_, i) =>
              view === "list" ? (
                <PreviewRow key={i} list={list} />
              ) : (
                <PreviewCard key={i} list={list} />
              ),
          )}
        </CollectionBody>
      </div>
    </div>
  );
}

/** Card d'esempio dell'anteprima: la sagoma di «Piatto» (ricette) o del «menù stampato» (menù). */
function PreviewCard({ list }: { list: ListKind }) {
  return (
    <div className="flex flex-col items-center rounded-card bg-blu-100 px-[8%] pt-[8%] pb-[0.7em]">
      {list === "recipes" ? (
        <span className="aspect-square w-[76%] rounded-full bg-white shadow-[0_0_0_4px_white,0_6px_14px_-6px_oklch(25%_0.038_228/.35)]" />
      ) : (
        <span className="flex aspect-[5/4] w-full items-center justify-center">
          <span className="flex h-[92%] w-[64%] -rotate-2 flex-col items-center justify-center gap-[6%] rounded-[0.4rem] bg-white px-[10%] shadow-[0_6px_14px_-6px_oklch(25%_0.038_228/.35)]">
            <span className="h-1 w-full rounded-full bg-blu-120" />
            <span className="h-1 w-4/5 rounded-full bg-blu-120" />
            <span className="h-1 w-1/2 rounded-full bg-blu-120" />
          </span>
        </span>
      )}
      <span className="mt-2 h-2 w-3/4 rounded-full bg-blu-200" />
      <span className="mt-1.5 h-1.5 w-1/2 rounded-full bg-blu-150" />
    </div>
  );
}

function PreviewRow({ list }: { list: ListKind }) {
  return (
    <div className="flex items-center gap-3 py-1">
      {list === "recipes" ? (
        <span className="size-10 shrink-0 rounded-full bg-white shadow-[0_0_0_2px_white,0_0_0_3px_var(--color-blu-150)]" />
      ) : (
        <span className="h-11 w-9 shrink-0 rounded-[0.4rem] bg-white shadow-[0_3px_8px_-3px_oklch(25%_0.038_228/.3)]" />
      )}
      <span className="flex flex-1 flex-col gap-1.5">
        <span className="h-2 w-1/2 rounded-full bg-blu-200" />
        <span className="h-1.5 w-1/3 rounded-full bg-blu-150" />
      </span>
    </div>
  );
}

function OrderButton({
  order,
  onToggle,
}: {
  order: "asc" | "desc";
  onToggle: () => void;
}) {
  return (
    <IconButton
      shape="square"
      label={
        order === "asc"
          ? "Crescente: tocca per decrescente"
          : "Decrescente: tocca per crescente"
      }
      onClick={onToggle}
    >
      {order === "asc" ? <ArrowUp /> : <ArrowDown />}
    </IconButton>
  );
}

function RecipeSortRow() {
  const { isAdmin } = useAuth();
  const { pref, setPref, order, setOrder } = useRecipeSort();
  const sort = recipeSortFor(pref, isAdmin);
  const options = isAdmin
    ? RECIPE_SORT_OPTIONS
    : RECIPE_SORT_OPTIONS.filter((o) => !o.adminOnly);
  return (
    <SettingRow
      label="Ordine"
      hint="Come sono ordinate le ricette quando apri la libreria. Lo cambi anche dai filtri."
    >
      <Select
        aria-label="Ordina le ricette per"
        value={sort}
        onChange={(e) => setPref(e.target.value as RecipeSortKey)}
        className="w-40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <OrderButton
        order={order}
        onToggle={() => setOrder(order === "asc" ? "desc" : "asc")}
      />
    </SettingRow>
  );
}

function MenuSortRow() {
  const { sort, setSort, order, setOrder } = useMenuSort();
  return (
    <SettingRow
      label="Ordine"
      hint="Come sono ordinati i menù. Lo cambi anche dai filtri."
    >
      <Select
        aria-label="Ordina i menù per"
        value={sort}
        onChange={(e) => setSort(e.target.value as MenuSortKey)}
        className="w-40"
      >
        {MENU_SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <OrderButton
        order={order}
        onToggle={() => setOrder(order === "asc" ? "desc" : "asc")}
      />
    </SettingRow>
  );
}

// ── In cucina ────────────────────────────────────────────────────────────────

function useNotificationPermission(): [
  NotificationPermission | "unsupported" | null,
  () => void,
] {
  const [bump, setBump] = useState(0);
  const perm = useSyncExternalStore(
    noopSubscribe,
    () =>
      typeof Notification === "undefined"
        ? "unsupported"
        : Notification.permission,
    () => null,
  );
  const ask = () =>
    void requestNotificationPermission().then(() => setBump(bump + 1));
  return [perm, ask];
}

function KitchenPanel() {
  const [keepAwake, setKeepAwake] = useKeepAwake();
  const wakeLock = useSyncExternalStore(
    noopSubscribe,
    wakeLockSupported,
    () => false,
  );
  const [perm, ask] = useNotificationPermission();
  return (
    <Panel
      title="In cucina"
      icon={<PotIcon />}
      meta="Timer dei passi e «Sto cucinando»"
    >
      <div>
        <SettingRow
          label="Schermo acceso durante i timer"
          hint={
            wakeLock
              ? "Lo schermo non si spegne finché un timer corre, così suona anche se non tocchi il telefono."
              : "Questo browser non permette di tenere lo schermo acceso."
          }
        >
          <Switch
            checked={wakeLock && keepAwake}
            onChange={setKeepAwake}
            label="Schermo acceso"
            hideLabel
            disabled={!wakeLock}
          />
        </SettingRow>
        <SettingRow
          label="Notifiche dei timer"
          hint={
            perm === "granted"
              ? "Attive: un timer finito ti avvisa anche se sei in un'altra scheda o app."
              : perm === "denied"
                ? "Bloccate: si riattivano dalle impostazioni del browser per questo sito."
                : perm === "unsupported"
                  ? "Questo browser non manda notifiche."
                  : "Un timer finito ti avvisa anche se sei in un'altra scheda o app. A telefono bloccato non arrivano."
          }
        >
          {perm === "default" ? (
            <Button
              size="sm"
              variant="secondary"
              icon={<BellRing />}
              onClick={ask}
            >
              Attiva
            </Button>
          ) : (
            <span
              className={clsx(
                "text-[0.8125rem] font-semibold",
                perm === "granted" ? "text-verde" : "text-grigio",
              )}
            >
              {perm === "granted"
                ? "Attive"
                : perm === "denied"
                  ? "Bloccate"
                  : "—"}
            </span>
          )}
        </SettingRow>
      </div>
    </Panel>
  );
}

// ── Costi del menù (admin) ───────────────────────────────────────────────────

function CostsPanel() {
  const { outputs, toggle } = useCostOutputs();
  return (
    <Panel
      title="Costi del menù"
      icon={
        <span className="text-[1.05em] leading-none font-extrabold">€</span>
      }
      meta="Cosa mostrare sotto il totale dei costi"
    >
      <div className="flex flex-col gap-2">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Risultati da mostrare"
        >
          {COST_OUTPUTS.map((o) => (
            <Chip
              key={o.value}
              active={outputs.includes(o.value)}
              onClick={() => toggle(o.value)}
            >
              {o.label}
            </Chip>
          ))}
        </div>
        <p className="text-[0.8125rem] text-grigio">
          {COST_OUTPUTS.map((o) => `${o.label}: ${o.hint}`).join(" · ")}. Le
          stesse scelte sono anche nella sezione Costi di ogni menù.
        </p>
      </div>
    </Panel>
  );
}

// ── Informazioni sulle card (admin, per tutti) ───────────────────────────────

/**
 * Cosa mostrano card e righe delle liste, per tutti (`lib/card-config.ts`). Bozza locale con
 * l'anteprima su una ricetta e un menù veri, a due larghezze (card stretta come sul telefono e
 * larga) e in riga; «Salva per tutti» la scrive nel database e ricarica la pagina.
 */
function CardInfoPanel({ samples, className }: { samples: NonNullable<Samples>; className?: string }) {
  const saved = useCardConfig();
  const router = useRouter();
  const [kind, setKind] = useState<"recipe" | "menu">("recipe");
  const [draft, setDraft] = useState<CardConfig>(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = JSON.stringify(draft) !== JSON.stringify(saved);

  const fields = kind === "recipe" ? RECIPE_FIELDS : MENU_FIELDS;
  const values = draft[kind] as Record<string, boolean>;
  const toggle = (field: string, on: boolean) => setDraft({ ...draft, [kind]: { ...draft[kind], [field]: on } });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/site-settings/card-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Non sono riuscito a salvare. Riprova tra poco.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title="Informazioni sulle card"
      icon={<IdCard />}
      meta="Le scegli tu per tutti: le vedono anche gli ospiti e chi non è entrato"
      className={className}
      actions={
        <Segmented<"recipe" | "menu">
          label="Card da impostare"
          value={kind}
          onChange={setKind}
          options={[
            { value: "recipe", label: "Ricette" },
            { value: "menu", label: "Menù" },
          ]}
        />
      }
    >
      <div className="grid gap-[1.25em] @min-[760px]:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div>
          {fields.map((f) => (
            <SettingRow key={f.value} label={f.label} hint={f.hint}>
              <Switch checked={values[f.value]} onChange={(on) => toggle(f.value, on)} label={f.label} hideLabel />
            </SettingRow>
          ))}
        </div>

        {/* anteprima con la bozza: card vere, non cliccabili */}
        <div className="flex flex-col gap-2 rounded-ctl bg-blu-50 p-[0.75em]">
          <p className="text-xs font-bold tracking-[0.08em] text-grigio uppercase">Anteprima</p>
          <CardConfigProvider value={draft}>
            <div inert className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start gap-3">
                <figure className="flex w-[10.5rem] flex-col gap-1">
                  {kind === "recipe" ? samples.recipe && <RecipeCard recipe={samples.recipe} /> : samples.menu && <MenuCard menu={samples.menu} />}
                  <figcaption className="text-center text-[0.6875rem] text-grigio">stretta (telefono)</figcaption>
                </figure>
                <figure className="flex w-[15rem] max-w-full flex-col gap-1">
                  {kind === "recipe" ? samples.recipe && <RecipeCard recipe={samples.recipe} /> : samples.menu && <MenuCard menu={samples.menu} />}
                  <figcaption className="text-center text-[0.6875rem] text-grigio">larga (iPad, PC)</figcaption>
                </figure>
              </div>
              <div>
                {kind === "recipe" ? samples.recipe && <RecipeRow recipe={samples.recipe} /> : samples.menu && <MenuRow menu={samples.menu} />}
                <p className="text-center text-[0.6875rem] text-grigio">vista a lista</p>
              </div>
            </div>
          </CardConfigProvider>
        </div>
      </div>

      {error && <p className="text-[0.8125rem] text-rosa">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => setDraft(saved)} disabled={!changed || saving}>
          Annulla modifiche
        </Button>
        <Button onClick={save} disabled={!changed} loading={saving}>
          Salva per tutti
        </Button>
      </div>
    </Panel>
  );
}

// ── Ricerca ──────────────────────────────────────────────────────────────────

const parseRecent = (raw: string): string[] => {
  const v: unknown = JSON.parse(raw);
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
};

function SearchPanel() {
  const [recent] = useLocalStore<string[]>(SEARCH_RECENT_KEY, [], parseRecent);
  return (
    <Panel title="Ricerca" icon={<Search />}>
      <SettingRow
        label="Ricerche recenti"
        hint={
          recent.length
            ? `${recent.length} su questo dispositivo: ${recent.slice(0, 3).join(", ")}${recent.length > 3 ? "…" : ""}`
            : "Nessuna ricerca salvata."
        }
      >
        <Button
          size="sm"
          variant="secondary"
          onClick={clearRecentSearches}
          disabled={recent.length === 0}
        >
          Cancella
        </Button>
      </SettingRow>
    </Panel>
  );
}

// ── Ripristina ───────────────────────────────────────────────────────────────

function ResetPanel({ className }: { className?: string }) {
  const { isAdmin } = useAuth();
  const [confirm, setConfirm] = useState(false);
  return (
    <Panel title="Ripristina" icon={<RotateCcw />} className={className}>
      <SettingRow
        label="Torna alle scelte di partenza"
        hint="Vista, card per riga, ordine, schermo acceso e costi. Preferiti, lista della spesa e ricette in corso restano."
      >
        <Button size="sm" variant="danger" onClick={() => setConfirm(true)}>
          Ripristina
        </Button>
      </SettingRow>
      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          resetPreferences();
          setConfirm(false);
        }}
        title="Ripristinare le impostazioni?"
        message={isAdmin ? "Le scelte di questa pagina tornano come all'inizio, sul tuo account e quindi su tutti i tuoi dispositivi." : "Le scelte di questa pagina tornano come all'inizio, su questo dispositivo."}
        confirmLabel="Ripristina"
      />
    </Panel>
  );
}
