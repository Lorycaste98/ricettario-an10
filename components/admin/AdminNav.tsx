"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { ComponentType, ReactNode } from "react";
import { ChevronLeft, LayoutDashboard, Plus } from "lucide-react";
import { backLinkCls } from "@/components/ui/BackLink";
import type { AdminOverview } from "@/lib/admin-overview";
import { ADMIN_CREATE, ADMIN_FORM_ROUTE, ADMIN_SECTIONS, ADMIN_YOU, AREA_CLS, sectionCount, type AdminArea } from "@/components/admin/admin-sections";

type Icon = ComponentType<{ className?: string }>;

/**
 * Cornice dell'area Gestione (restyle fase 5, DESIGN.md D7).
 * - Le voci stanno in `admin-sections.ts` (condivise con la dashboard).
 * - `AdminFrame`: usato da `app/admin/layout.tsx` e, per l'admin, da `app/impostazioni/layout.tsx`
 *   (le impostazioni sono nel blocco «Tu» della stessa zona, D9).
 *   Da 900px di contenitore mette a sinistra la sotto-navigazione a colonna; sotto,
 *   ogni sotto-pagina ha in cima «‹ Gestione» (su iPhone la dashboard fa da elenco).
 *   I form (nuova/modifica ricetta e menù) occupano tutta la larghezza: hanno la loro barra.
 */


export function AdminFrame({
  overview,
  isSuperAdmin,
  children,
}: {
  overview: AdminOverview;
  isSuperAdmin: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (ADMIN_FORM_ROUTE.test(pathname)) return <>{children}</>;
  const home = pathname === "/admin";

  return (
    <div className="items-start gap-(--gap) @min-[900px]:grid @min-[900px]:grid-cols-[clamp(13rem,21cqi,15.5rem)_minmax(0,1fr)]">
      <AdminSubNav overview={overview} isSuperAdmin={isSuperAdmin} pathname={pathname} />
      <div className="flex min-w-0 flex-col gap-3">
        {!home && (
          <Link href="/admin" className={clsx(backLinkCls, "self-start @min-[900px]:hidden")}>
            <ChevronLeft size={18} className="shrink-0" aria-hidden />
            <span className="truncate">Gestione</span>
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}

function GroupTitle({ children }: { children: ReactNode }) {
  return <p className="px-2.5 pt-3 pb-1 text-[0.6875rem] font-bold tracking-[0.08em] text-grigio uppercase first:pt-0">{children}</p>;
}

/** Sotto-navigazione a colonna di Gestione (solo da 900px di contenitore) */
function AdminSubNav({ overview, isSuperAdmin, pathname }: { overview: AdminOverview; isSuperAdmin: boolean; pathname: string }) {
  const item = (href: string, label: string, Icon: Icon, area: AdminArea, count?: number, exact = false) => {
    const on = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        key={href}
        href={href}
        aria-current={on ? "page" : undefined}
        className={clsx(
          "flex min-h-10 items-center gap-2.5 rounded-[0.625rem] px-2.5 text-[0.9375rem] transition-colors",
          on ? "bg-white font-bold shadow-[0_1px_2px_oklch(27%_0.05_255/.1)]" : "hover:bg-adm-150"
        )}
      >
        <Icon className={clsx("size-[1.1rem] shrink-0", AREA_CLS[area].text)} />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count !== undefined && <span className="tabular text-[0.8125rem] text-grigio">{count}</span>}
      </Link>
    );
  };

  const sections = ADMIN_SECTIONS.filter((s) => !s.superOnly || isSuperAdmin);

  return (
    <nav
      aria-label="Gestione"
      className="sticky hidden max-h-[calc(100dvh-2rem)] flex-col gap-0.5 overflow-y-auto rounded-card border border-adm-150 bg-adm-100 p-2.5 @min-[900px]:flex"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
    >
      <GroupTitle>Crea</GroupTitle>
      <div className="flex flex-col gap-1.5 border-b border-adm-150 pb-3">
        {ADMIN_CREATE.map(({ href, label, icon: Icon, area }) => (
          <Link
            key={href}
            href={href}
            className="flex h-10 items-center gap-2.5 rounded-[0.625rem] border border-blu-200 bg-white px-2.5 text-[0.9375rem] font-semibold transition-colors hover:bg-blu-50"
          >
            <Icon className={clsx("size-[1.1rem] shrink-0", AREA_CLS[area].text)} />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-arancio-pieno text-white">
              <Plus className="size-3.5" strokeWidth={3} />
            </span>
          </Link>
        ))}
      </div>
      <GroupTitle>Consulta e gestisci</GroupTitle>
      {item("/admin", "Panoramica", LayoutDashboard, "ricette", undefined, true)}
      {sections.filter((s) => s.group === "contenuti").map((s) => item(s.href, s.label, s.icon, s.area, sectionCount(s.key, overview)))}
      <GroupTitle>Persone</GroupTitle>
      {sections.filter((s) => s.group === "persone").map((s) => item(s.href, s.label, s.icon, s.area, sectionCount(s.key, overview)))}
      <GroupTitle>Sito</GroupTitle>
      {sections.filter((s) => s.group === "sito").map((s) => item(s.href, s.label, s.icon, s.area, sectionCount(s.key, overview)))}
      <GroupTitle>Tu</GroupTitle>
      {ADMIN_YOU.map((y) => item(y.href, y.label, y.icon, y.area))}
    </nav>
  );
}
