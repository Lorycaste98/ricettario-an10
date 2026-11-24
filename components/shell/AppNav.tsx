"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentType, type ReactNode } from "react";
import { clsx } from "clsx";
import { BookOpen, ChefHat, Heart, Search, Settings, UserRound } from "lucide-react";
import { openSearch } from "@/lib/search";
import { useAuth } from "@/components/AuthProvider";
import { useFavorites } from "@/lib/favorites";
import { An10Logo } from "@/components/brand/An10Logo";
import { ClocheIcon } from "@/components/icons";

/**
 * Navigazione del restyle (tavola 9.1 e 9.2). Unico punto di rottura legato allo schermo (D1):
 * da 700px in su barra laterale, sotto barra in basso. Voci: Ricette, Menù, Preferiti (badge),
 * Cerca (apre l'overlay della ricerca globale, non è una pagina), Gestione (solo admin) e **Impostazioni** (`/impostazioni`,
 * per tutti: lì ci sono anche account, profilo ed esci per l'admin e «Accedi» per i visitatori).
 * Le azioni admin del vecchio sottomenu «Dashboard» stanno nella pagina /admin.
 */
type Item = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
  match?: string;
  /** voce-azione (Cerca): bottone invece di link, mai «attiva» */
  onClick?: () => void;
};

function useNavItems() {
  const { isAdmin } = useAuth();
  const { favorites, hydrated } = useFavorites();
  const favCount = hydrated ? favorites.size : 0;
  const main: Item[] = [
    { href: "/ricette", label: "Ricette", icon: BookOpen },
    { href: "/menu", label: "Menù", icon: ClocheIcon },
    { href: "#cerca", label: "Cerca", icon: Search, onClick: () => openSearch() },
    { href: "/preferiti", label: "Preferiti", icon: Heart, badge: favCount },
  ];
  const admin: Item | null = isAdmin ? { href: "/admin", label: "Gestione", icon: Settings, match: "/admin" } : null;
  // ingranaggio = Gestione; le impostazioni sono «tue», quindi la persona. Etichetta «Account»:
  // «Impostazioni» non ci sta nella barra in basso; la pagina si apre con la scheda account in cima
  const settings: Item = { href: "/impostazioni", label: "Account", icon: UserRound };
  return { main, admin, settings };
}

function useIsActive() {
  const pathname = usePathname();
  return (item: Item) => {
    if (item.onClick) return false;
    const base = item.match ?? item.href;
    return pathname === base || pathname.startsWith(base + "/");
  };
}

export function useLogout() {
  const router = useRouter();
  return async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
    window.location.reload();
  };
}

/** Voce di navigazione: link a una pagina, oppure bottone per le voci-azione (Cerca). */
function NavTarget({ item, on, className, children }: { item: Item; on: boolean; className: string; children: ReactNode }) {
  if (item.onClick) {
    return (
      <button type="button" onClick={item.onClick} className={className}>
        {children}
      </button>
    );
  }
  return (
    <Link href={item.href} aria-current={on ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
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
export function NavRail({ adminArea = false }: { adminArea?: boolean }) {
  const { main, admin, settings } = useNavItems();
  const isActive = useIsActive();
  const { isAdmin, username, loading } = useAuth();

  const railItem = (item: Item) => {
    const on = isActive(item);
    const Icon = item.icon;
    return (
      <NavTarget
        key={item.href}
        item={item}
        on={on}
        className={clsx("group flex flex-col items-center gap-1 text-[0.6875rem]", on ? "font-bold text-white" : "text-nav-ink hover:text-white")}
      >
        <span
          className={clsx(
            "relative flex h-[2.375rem] w-11 items-center justify-center rounded-ctl transition-colors [&>svg]:size-[1.375rem]",
            adminArea ? "[--ring:var(--color-adm-900)]" : "[--ring:var(--color-blu-800)]",
            on ? "bg-arancio-pieno text-white" : adminArea ? "group-hover:bg-white/10" : "group-hover:bg-blu-700"
          )}
        >
          <Icon />
          <Badge n={item.badge} />
        </span>
        {item.label}
      </NavTarget>
    );
  };

  return (
    <nav
      aria-label="Navigazione principale"
      className={clsx(
        "sticky top-0 hidden h-dvh shrink-0 flex-col items-center gap-3.5 pb-4 text-nav-ink transition-colors min-[700px]:flex",
        adminArea ? "bg-adm-900" : "bg-blu-800"
      )}
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
        // iPhone in orizzontale: la barra si allarga sotto il notch invece di finirci sotto
        paddingLeft: "env(safe-area-inset-left, 0px)",
        width: "calc(clamp(4.5rem, calc(4.5rem + 12 * var(--f)), 5.25rem) + env(safe-area-inset-left, 0px))",
      }}
    >
      <Link href="/" aria-label="AN10 · home" className="mb-1 text-white">
        <An10Logo variant="simbolo" title="" className="size-10" />
      </Link>
      {main.map(railItem)}
      <div className="mt-auto flex flex-col items-center gap-3.5">
        {admin && railItem(admin)}
        {!loading &&
          (isAdmin ? (
            // admin: il cappello col nome, porta alle Impostazioni (account, profilo, esci)
            <Link
              href={settings.href}
              aria-current={isActive(settings) ? "page" : undefined}
              aria-label={`Account e impostazioni · ${username || ""}`}
              className={clsx("flex flex-col items-center gap-1 text-[0.6875rem] hover:text-white", isActive(settings) ? "font-bold text-white" : "text-nav-ink")}
            >
              <span
                className={clsx(
                  "flex size-[2.375rem] items-center justify-center rounded-full border [&>svg]:size-5",
                  isActive(settings) ? "border-transparent bg-arancio-pieno text-white" : clsx("bg-blu-950/30", adminArea ? "border-white/20" : "border-blu-700")
                )}
              >
                <ChefHat />
              </span>
              <span className="max-w-[4.5rem] truncate">{username || "Account"}</span>
            </Link>
          ) : (
            railItem(settings)
          ))}
      </div>
    </nav>
  );
}

/** 9.2 · barra in basso (< 700px) */
export function TabBar({ adminArea = false }: { adminArea?: boolean }) {
  const { main, admin, settings } = useNavItems();
  const isActive = useIsActive();
  const { loading } = useAuth();

  const tab = (item: Item) => {
    const on = isActive(item);
    const Icon = item.icon;
    return (
      <NavTarget
        key={item.href}
        item={item}
        on={on}
        className={clsx("flex min-w-0 flex-1 flex-col items-center gap-0.5 pt-1.5 text-[0.6875rem]", on ? "font-bold text-white" : "text-nav-ink")}
      >
        {/* stessa resa della barra laterale (9.1): voce attiva su pastiglia arancio */}
        <span
          className={clsx(
            "relative flex h-7 w-12 items-center justify-center rounded-full [&>svg]:size-[1.25rem]",
            adminArea ? "[--ring:var(--color-adm-900)]" : "[--ring:var(--color-blu-800)]",
            on && "bg-arancio-pieno text-white"
          )}
        >
          <Icon />
          <Badge n={item.badge} />
        </span>
        <span className="max-w-full truncate">{item.label}</span>
      </NavTarget>
    );
  };

  return (
    <nav
      aria-label="Navigazione principale"
      className={clsx("fixed inset-x-0 bottom-0 z-40 flex min-[700px]:hidden", adminArea ? "bg-adm-900" : "bg-blu-800")}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.5rem)", height: "calc(var(--tabs-h) + env(safe-area-inset-bottom, 0px))" }}
    >
      {main.map(tab)}
      {admin && tab(admin)}
      {!loading && tab(settings)}
    </nav>
  );
}

