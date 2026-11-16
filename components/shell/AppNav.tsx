"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";
import { clsx } from "clsx";
import { BookOpen, ChefHat, Heart, LogIn, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useFavorites } from "@/lib/favorites";
import { An10Logo } from "@/components/brand/An10Logo";
import { ClocheIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ds/Button";

/**
 * Navigazione del restyle (tavola 9.1 e 9.2). Unico punto di rottura legato allo schermo (D1):
 * da 700px in su barra laterale, sotto barra in basso. Voci: Ricette, Menù, Preferiti (badge),
 * Gestione (solo admin) e account (Profilo/Esci per l'admin, Accedi per i visitatori).
 * Le azioni admin del vecchio sottomenu «Dashboard» stanno nella pagina /admin.
 */
type Item = { href: string; label: string; icon: ComponentType<{ className?: string }>; badge?: number; match?: string };

function useNavItems() {
  const { isAdmin } = useAuth();
  const { favorites, hydrated } = useFavorites();
  const favCount = hydrated ? favorites.size : 0;
  const main: Item[] = [
    { href: "/ricette", label: "Ricette", icon: BookOpen },
    { href: "/menu", label: "Menù", icon: ClocheIcon },
    { href: "/preferiti", label: "Preferiti", icon: Heart, badge: favCount },
  ];
  const admin: Item | null = isAdmin ? { href: "/admin", label: "Gestione", icon: Settings, match: "/admin" } : null;
  return { main, admin };
}

function useIsActive() {
  const pathname = usePathname();
  return (item: Item) => {
    const base = item.match ?? item.href;
    return pathname === base || pathname.startsWith(base + "/");
  };
}

function useLogout() {
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
    <span className="tabular absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rosa px-1 text-[10px] leading-none font-bold text-white ring-2 ring-[var(--ring)]">
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** 9.1 · barra laterale (≥ 700px) */
export function NavRail() {
  const { main, admin } = useNavItems();
  const isActive = useIsActive();
  const { isAdmin, username, loading } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const logout = useLogout();

  const railItem = (item: Item) => {
    const on = isActive(item);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={on ? "page" : undefined}
        className={clsx("group flex flex-col items-center gap-1 text-[0.6875rem]", on ? "font-bold text-white" : "text-nav-ink hover:text-white")}
      >
        <span
          className={clsx(
            "relative flex h-[2.375rem] w-11 items-center justify-center rounded-ctl transition-colors [--ring:var(--color-blu-800)] [&>svg]:size-[1.375rem]",
            on ? "bg-arancio text-white" : "group-hover:bg-blu-700"
          )}
        >
          <Icon />
          <Badge n={item.badge} />
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navigazione principale"
      className="sticky top-0 hidden h-dvh w-[clamp(4.5rem,calc(4.5rem+12*var(--f)),5.25rem)] shrink-0 flex-col items-center gap-3.5 bg-blu-800 pb-4 text-nav-ink min-[700px]:flex"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
    >
      <Link href="/" aria-label="AN10 · home" className="mb-1 text-white">
        <An10Logo variant="simbolo" title="" className="size-10" />
      </Link>
      {main.map(railItem)}
      <div className="mt-auto flex flex-col items-center gap-3.5">
        {admin && railItem(admin)}
        {!loading &&
          (isAdmin ? (
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              className="flex flex-col items-center gap-1 text-[0.6875rem] text-nav-ink hover:text-white"
            >
              <span className="flex size-[2.375rem] items-center justify-center rounded-full border border-blu-700 bg-blu-950/30 [&>svg]:size-5">
                <ChefHat />
              </span>
              <span className="max-w-[4.5rem] truncate">{username || "Account"}</span>
            </button>
          ) : (
            railItem({ href: "/login", label: "Accedi", icon: LogIn })
          ))}
      </div>
      <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} onLogout={logout} />
    </nav>
  );
}

/** 9.2 · barra in basso (< 700px) */
export function TabBar() {
  const { main, admin } = useNavItems();
  const isActive = useIsActive();
  const { isAdmin, loading } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const logout = useLogout();

  const tab = (item: Item) => {
    const on = isActive(item);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={on ? "page" : undefined}
        className={clsx("flex min-w-0 flex-1 flex-col items-center gap-0.5 pt-1.5 text-[0.6875rem]", on ? "font-bold text-arancio" : "text-grigio")}
      >
        <span className="relative [--ring:white] [&>svg]:size-[1.375rem]">
          <Icon />
          <Badge n={item.badge} />
        </span>
        <span className="max-w-full truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-blu-150 bg-white min-[700px]:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.5rem)", height: "calc(var(--tabs-h) + env(safe-area-inset-bottom, 0px))" }}
    >
      {main.map(tab)}
      {admin && tab(admin)}
      {!loading &&
        (isAdmin ? (
          <button type="button" onClick={() => setAccountOpen(true)} className="flex min-w-0 flex-1 flex-col items-center gap-0.5 pt-1.5 text-[0.6875rem] text-grigio">
            <User className="size-[1.375rem]" />
            Account
          </button>
        ) : (
          tab({ href: "/login", label: "Accedi", icon: LogIn })
        ))}
      <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} onLogout={logout} />
    </nav>
  );
}

function AccountDialog({ open, onClose, onLogout }: { open: boolean; onClose: () => void; onLogout: () => void }) {
  const { username } = useAuth();
  return (
    <Modal open={open} onClose={onClose} title="Account" size="sm">
      <div className="ds flex flex-col gap-3">
        <p className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-full bg-blu-120 text-blu-800">
            <ChefHat className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-xs text-grigio">Connesso come</span>
            <span className="font-bold">{username}</span>
          </span>
        </p>
        <Link
          href="/admin/profilo"
          onClick={onClose}
          className="inline-flex h-(--h-btn) items-center gap-2 rounded-ctl border border-blu-200 bg-white px-[1.05em] font-semibold hover:bg-blu-100"
        >
          <User className="size-[1.15em]" aria-hidden /> Profilo e password
        </Link>
        <Button variant="danger" icon={<LogOut />} onClick={onLogout}>
          Esci dall&apos;account
        </Button>
      </div>
    </Modal>
  );
}
