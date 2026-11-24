"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ComponentType, type MouseEvent } from "react";
import { clsx } from "clsx";
import { motion, useReducedMotion } from "motion/react";
import { BookOpen, ChefHat, Heart, Search, UserRound } from "lucide-react";
import { openSearch } from "@/lib/search";
import { useAuth } from "@/components/AuthProvider";
import { useFavorites } from "@/lib/favorites";
import { An10Logo } from "@/components/brand/An10Logo";
import { An10ChefMark } from "@/components/brand/An10ChefMark";
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
 * tocco: lo stato ottimistico `pending` vale finché il pathname non cambia. Cerca non è mai attiva.
 * Il badge dei Preferiti resta rosa: l'arancio pieno è l'unica cosa arancio della barra.
 *
 * Cerca sta in uno slot a sé (`NavSearchItem`), separato dalle voci-pagina.
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
  const target = pending && pending.from === pathname ? pending.href : null;
  const isActive = (item: Item) => (target ? target === item.href : (item.match ?? [item.href]).some((b) => matches(pathname, b)));
  const onNavigate = (item: Item) => (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    setPending({ href: item.href, from: pathname });
  };
  return { isActive, onNavigate };
}

const TONE = {
  guest: {
    bar: "bg-blu-100 text-blu-800",
    edgeRail: "border-r border-blu-150",
    edgeTab: "border-t border-blu-150",
    ink: "text-blu-800",
    hover: "hover:bg-blu-150",
    ring: "[--ring:var(--color-blu-100)]",
  },
  chef: {
    bar: "bg-blu-800 text-nav-ink",
    edgeRail: "",
    edgeTab: "",
    ink: "text-nav-ink",
    hover: "hover:bg-blu-700 hover:text-white",
    ring: "[--ring:var(--color-blu-800)]",
  },
  backstage: {
    bar: "bg-adm-900 text-nav-ink",
    edgeRail: "",
    edgeTab: "",
    ink: "text-nav-ink",
    hover: "hover:bg-white/10 hover:text-white",
    ring: "[--ring:var(--color-adm-900)]",
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

/**
 * Voce «Cerca»: un'azione, non una pagina (apre l'overlay della ricerca globale, mai attiva).
 * Slot a sé: è il posto destinato al logo «10» centrale.
 */
export function NavSearchItem({ variant, tone }: { variant: Variant; tone: NavTone }) {
  const t = TONE[tone];
  const s = SHAPE[variant];
  return (
    <button type="button" onClick={() => openSearch()} className={s.outer}>
      <span className={clsx(s.box, t.ink, t.hover)}>
        <span className={s.icon}>
          <Search />
        </span>
        <span className="relative max-w-full truncate px-1">Cerca</span>
      </span>
    </button>
  );
}

/** 9.1 · barra laterale (≥ 700px) */
export function NavRail({ tone }: { tone: NavTone }) {
  const { before, after, you } = useNavItems();
  const { isActive, onNavigate } = useActive();
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
      {/* entrato: il «10» porta il cappello da cuoco (D9) */}
      <Link href="/" aria-label="AN10 · home" className={clsx("mb-2", tone === "guest" ? "text-blu-700" : "text-white")}>
        {tone === "guest" ? (
          <An10Logo variant="simbolo" title="" className="size-10" />
        ) : (
          <An10ChefMark className="h-[4.25rem] w-auto" />
        )}
      </Link>
      {before.map(item)}
      <NavSearchItem variant="rail" tone={tone} />
      {after.map(item)}
      <div className="mt-auto flex w-full flex-col items-center">{you && item(you)}</div>
    </nav>
  );
}

/** 9.2 · barra in basso (< 700px) */
export function TabBar({ tone }: { tone: NavTone }) {
  const { before, after, you } = useNavItems();
  const { isActive, onNavigate } = useActive();
  const t = TONE[tone];
  const item = (i: Item) => <NavItem key={i.href} item={i} variant="tab" tone={tone} on={isActive(i)} onClick={onNavigate(i)} />;

  return (
    <nav
      aria-label="Navigazione principale"
      className={clsx("fixed inset-x-0 bottom-0 z-40 flex px-1 transition-colors duration-300 min-[700px]:hidden", t.bar, t.edgeTab, t.ring)}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.5rem)", height: "calc(var(--tabs-h) + env(safe-area-inset-bottom, 0px))" }}
    >
      {before.map(item)}
      <NavSearchItem variant="tab" tone={tone} />
      {after.map(item)}
      {/* finché la sessione non è nota la quinta voce tiene il posto, vuota */}
      {you ? item(you) : <span aria-hidden className="flex-1" />}
    </nav>
  );
}
