"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type ComponentType, type MouseEvent } from "react";
import { clsx } from "clsx";
import { motion, useReducedMotion } from "motion/react";
import { BookOpen, ChefHat, Heart, UserRound } from "lucide-react";
import { getSearchOpen, openSearch, subscribeSearchOpen } from "@/lib/search";
import { useAuth } from "@/components/AuthProvider";
import { useFavorites } from "@/lib/favorites";
import { An10SearchMark } from "@/components/brand/An10SearchMark";
import { ClocheIcon } from "@/components/icons";

/**
 * Navigazione (tavola 9.1 barra laterale ≥ 700px, 9.2 barra in basso; D1, D7, D9).
 *
 * **Cinque voci, uguali per tutti**: Ricette · Menù · Cerca · Preferiti · [quinta voce].
 * - Visitatore: quinta voce «Accedi» (persona) → `/impostazioni` (Accedi in cima + scelte del dispositivo).
 * - Entrato: quinta voce = cappello da cuoco col nome → `/admin`, la zona «dietro le quinte»
 *   (gestione del sito + «Tu»: profilo, impostazioni, esci). È attiva su `/admin/*` e `/impostazioni`.
 *
 * **Tono della barra = chi sei** (D9): `guest` chiara (`blu-100`), `chef` blu scuro (`blu-800`),
 * `backstage` indaco (`adm-900`, D7). Lo decide `AppShell` (`navToneFor`).
 *
 * **Voce attiva**: riquadro `arancio-pieno` attorno a icona e scritta, che scivola fra le voci
 * (`layoutId`, 220 ms, niente rimbalzo; nessuno scorrimento con «Riduci movimento»). Parte al
 * tocco: lo stato ottimistico `pending` vale finché il pathname non cambia. **Cerca** si accende
 * finché l'overlay della ricerca è aperto (`subscribeSearchOpen` di `lib/search.ts`), poi il riquadro
 * torna sulla pagina. Il badge dei Preferiti resta rosa: l'arancio pieno è l'unica cosa arancio della barra.
 *
 * **Cerca = lente AN10** (9.6, `An10SearchMark`: il «10» dentro una lente, col cappello se sei
 * entrato), in uno slot a sé (`NavSearchItem`): al centro della barra in basso su una **collinetta**
 * del colore della barra, in cima alla barra laterale al posto del logo. Il logo non porta più a `/`:
 * la vetrina pubblica è solo la pagina d'ingresso di chi apre il link (scelta B, 24/11/2026).
 */
export type NavTone = "guest" | "chef" | "backstage";

/** Tono della barra: visitatore chiaro, entrato blu scuro, dietro le quinte indaco (D9). */
export function navToneFor(pathname: string, isAdmin: boolean, loading: boolean): NavTone {
  if (isBackstage(pathname, isAdmin)) return "backstage";
  // durante il controllo della sessione resta blu scuro: il cuoco è l'utente di tutti i giorni
  if (loading || isAdmin) return "chef";
  return "guest";
}

/** Zona «dietro le quinte»: Gestione e, per l'admin, le sue impostazioni */
export function isBackstage(pathname: string, isAdmin: boolean) {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  return isAdmin && (pathname === "/impostazioni" || pathname.startsWith("/impostazioni/"));
}

type Item = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
  /** percorsi in cui la voce è attiva (default: href) */
  match?: string[];
  /** quinta voce del visitatore: «Accedi» messo in evidenza */
  accent?: boolean;
};

function useNavItems() {
  const { isAdmin, username, loading } = useAuth();
  const { favorites, hydrated } = useFavorites();
  const favCount = hydrated ? favorites.size : 0;
  const before: Item[] = [
    { href: "/ricette", label: "Ricette", icon: BookOpen },
    { href: "/menu", label: "Menù", icon: ClocheIcon },
  ];
  const after: Item[] = [{ href: "/preferiti", label: "Preferiti", icon: Heart, badge: favCount }];
  const you: Item | null = loading
    ? null
    : isAdmin
      ? { href: "/admin", label: username || "Tu", icon: ChefHat, match: ["/admin", "/impostazioni"] }
      : { href: "/impostazioni", label: "Accedi", icon: UserRound, match: ["/impostazioni", "/login"], accent: true };
  return { before, after, you };
}

const matches = (path: string, base: string) => path === base || path.startsWith(base + "/");

/**
 * Voce attiva con stato ottimistico: al tocco il riquadro parte subito verso la nuova voce, poi
 * si riallinea al pathname. `pending.from` lega l'attesa alla pagina di partenza: appena il
 * pathname cambia, l'attesa non vale più (nessun effetto da sincronizzare).
 */
function useActive() {
  const pathname = usePathname();
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);
  const searchOpen = useSyncExternalStore(subscribeSearchOpen, getSearchOpen, () => false);
  const target = pending && pending.from === pathname ? pending.href : null;
  const isActive = (item: Item) =>
    !searchOpen && (target ? target === item.href : (item.match ?? [item.href]).some((b) => matches(pathname, b)));
  const onNavigate = (item: Item) => (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    setPending({ href: item.href, from: pathname });
  };
  return { isActive, onNavigate, searchOpen };
}

const TONE = {
  guest: {
    bar: "bg-blu-100 text-blu-800",
    edgeRail: "border-r border-blu-150",
    edgeTab: "border-t border-blu-150",
    ink: "text-blu-800",
    hover: "hover:bg-blu-150",
    ring: "[--ring:var(--color-blu-100)]",
    hump: "text-blu-100",
  },
  chef: {
    bar: "bg-blu-800 text-nav-ink",
    edgeRail: "",
    edgeTab: "",
    ink: "text-nav-ink",
    hover: "hover:bg-blu-700 hover:text-white",
    ring: "[--ring:var(--color-blu-800)]",
    hump: "text-blu-800",
  },
  backstage: {
    bar: "bg-adm-900 text-nav-ink",
    edgeRail: "",
    edgeTab: "",
    ink: "text-nav-ink",
    hover: "hover:bg-white/10 hover:text-white",
    ring: "[--ring:var(--color-adm-900)]",
    hump: "text-adm-900",
  },
} as const;

export function useLogout() {
  const router = useRouter();
  return async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
    window.location.reload();
  };
}

function Badge({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="tabular absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rosa px-1 text-[10px] leading-none font-bold text-white ring-2 ring-(--ring)">
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** Riquadro arancio della voce attiva: uno per barra, scivola da una voce all'altra */
function ActiveBox({ id }: { id: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      layoutId={id}
      aria-hidden
      className="absolute inset-0 rounded-ctl bg-arancio-pieno"
      transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.2, 0, 0, 1] }}
    />
  );
}

type Variant = "rail" | "tab";

const SHAPE: Record<Variant, { outer: string; box: string; icon: string }> = {
  rail: {
    outer: "flex w-full justify-center px-1.5",
    box: "relative flex w-full max-w-[4.25rem] flex-col items-center gap-1 rounded-ctl py-1.5 text-[0.6875rem] transition-colors [&_svg]:size-[1.375rem]",
    icon: "relative flex h-6 items-center justify-center",
  },
  tab: {
    outer: "flex min-w-0 flex-1 items-center justify-center px-0.5",
    box: "relative flex w-full max-w-[4.75rem] flex-col items-center gap-0.5 rounded-ctl pt-1 pb-0.5 text-[0.6875rem] transition-colors [&_svg]:size-[1.25rem]",
    icon: "relative flex h-[1.375rem] items-center justify-center",
  },
};

/** Voce-pagina della navigazione (link) */
function NavItem({ item, variant, tone, on, onClick }: { item: Item; variant: Variant; tone: NavTone; on: boolean; onClick: (e: MouseEvent) => void }) {
  const Icon = item.icon;
  const t = TONE[tone];
  const s = SHAPE[variant];
  // «Accedi» del visitatore: pastiglia blu scura piena, si vede subito (non arancio: l'arancio è la voce attiva)
  const accent = item.accent && !on;
  return (
    <Link href={item.href} onClick={onClick} aria-current={on ? "page" : undefined} className={s.outer}>
      <span className={clsx(s.box, on ? "font-bold text-white" : accent ? "bg-blu-800 font-semibold text-white" : clsx(t.ink, t.hover))}>
        {on && <ActiveBox id={`nav-active-${variant}`} />}
        <span className={s.icon}>
          <Icon />
          <Badge n={item.badge} />
        </span>
        <span className="relative max-w-full truncate px-1">{item.label}</span>
      </span>
    </Link>
  );
}

/** Collinetta sopra la barra in basso, del colore della barra, sotto la lente */
function Hump({ tone }: { tone: NavTone }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 92 14"
      preserveAspectRatio="none"
      className={clsx("pointer-events-none absolute bottom-full left-1/2 h-3.5 w-[5.75rem] -translate-x-1/2 transition-colors duration-300", TONE[tone].hump)}
    >
      <path d="M0 14 C20 14 25 0 46 0 C67 0 72 14 92 14 Z" fill="currentColor" />
      {/* visitatore: la barra chiara ha un filo in cima, la collinetta lo segue */}
      {tone === "guest" && <path d="M0 13.5 C20 13.5 25 0.5 46 0.5 C67 0.5 72 13.5 92 13.5" fill="none" className="stroke-blu-150" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

/**
 * 9.6 · voce «Cerca»: un'azione, non una pagina (apre l'overlay della ricerca globale). Lente AN10
 * un po' più grande delle altre icone; accesa (riquadro arancio) finché la ricerca è aperta.
 * Barra in basso: al centro, alzata sulla collinetta. Barra laterale: in cima, al posto del logo.
 */
export function NavSearchItem({ variant, tone, on }: { variant: Variant; tone: NavTone; on: boolean }) {
  const t = TONE[tone];
  const s = SHAPE[variant];
  const chef = tone !== "guest";
  return (
    <button type="button" onClick={() => openSearch()} aria-label="Cerca" className={clsx(s.outer, "relative")}>
      {variant === "tab" && <Hump tone={tone} />}
      <span className={clsx(s.box, variant === "tab" ? "-mt-[1.125rem]" : "mb-1", on ? "font-bold text-white" : clsx(t.ink, t.hover))}>
        {on && <ActiveBox id={`nav-active-${variant}`} />}
        {/* la lente si appoggia in basso: col cappello cresce verso l'alto, la scritta resta allineata */}
        <span className={clsx("relative flex w-full items-end justify-center", variant === "tab" ? "h-[2.5rem]" : "h-[3.25rem]")}>
          {/* misura in linea: la regola `[&_svg]:size-…` delle voci la rimpicciolirebbe come le altre icone */}
          <An10SearchMark
            chef={chef}
            className={clsx(!on && tone === "guest" && "text-blu-700")}
            style={{ width: variant === "tab" ? (chef ? "1.875rem" : "2.25rem") : chef ? "2.125rem" : "2.5rem", height: "auto" }}
          />
        </span>
        <span className="relative max-w-full truncate px-1">Cerca</span>
      </span>
    </button>
  );
}

/** 9.1 · barra laterale (≥ 700px) */
export function NavRail({ tone }: { tone: NavTone }) {
  const { before, after, you } = useNavItems();
  const { isActive, onNavigate, searchOpen } = useActive();
  const t = TONE[tone];
  const item = (i: Item) => <NavItem key={i.href} item={i} variant="rail" tone={tone} on={isActive(i)} onClick={onNavigate(i)} />;

  return (
    <nav
      aria-label="Navigazione principale"
      className={clsx(
        "sticky top-0 hidden h-dvh shrink-0 flex-col items-center gap-2 pb-4 transition-colors duration-300 min-[700px]:flex",
        t.bar,
        t.edgeRail,
        t.ring
      )}
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
        // iPhone in orizzontale: la barra si allarga sotto il notch invece di finirci sotto
        paddingLeft: "env(safe-area-inset-left, 0px)",
        width: "calc(clamp(4.5rem, calc(4.5rem + 12 * var(--f)), 5.25rem) + env(safe-area-inset-left, 0px))",
      }}
    >
      {/* in cima la lente AN10 (Cerca, 9.6): entrato, col cappello da cuoco (D9) */}
      <NavSearchItem variant="rail" tone={tone} on={searchOpen} />
      {before.map(item)}
      {after.map(item)}
      <div className="mt-auto flex w-full flex-col items-center">{you && item(you)}</div>
    </nav>
  );
}

/** 9.2 · barra in basso (< 700px) */
export function TabBar({ tone }: { tone: NavTone }) {
  const { before, after, you } = useNavItems();
  const { isActive, onNavigate, searchOpen } = useActive();
  const t = TONE[tone];
  const item = (i: Item) => <NavItem key={i.href} item={i} variant="tab" tone={tone} on={isActive(i)} onClick={onNavigate(i)} />;

  return (
    <nav
      aria-label="Navigazione principale"
      className={clsx("fixed inset-x-0 bottom-0 z-40 flex px-1 transition-colors duration-300 min-[700px]:hidden", t.bar, t.edgeTab, t.ring)}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.5rem)", height: "calc(var(--tabs-h) + env(safe-area-inset-bottom, 0px))" }}
    >
      {before.map(item)}
      <NavSearchItem variant="tab" tone={tone} on={searchOpen} />
      {after.map(item)}
      {/* finché la sessione non è nota la quinta voce tiene il posto, vuota */}
      {you ? item(you) : <span aria-hidden className="flex-1" />}
    </nav>
  );
}
