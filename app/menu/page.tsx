import { MenuGrid, NewMenuLink } from "@/components/menu/MenuGrid";
import { NextMenuCard } from "@/components/menu/NextMenuCard";
import { getMenuSummaries, getNextMenu } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/ds/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Menù — Ricettario" };

/** Menù con data da ieri in poi (fuori dal componente: Date.now non è una funzione pura) */
function countUpcoming(menus: { date: string | null }[]) {
  const since = Date.now() - 36 * 3600_000;
  return menus.filter((m) => m.date && new Date(m.date).getTime() > since).length;
}

export default async function MenuListPage() {
  const isAdmin = !!(await getSession());
  const [menus, next] = await Promise.all([getMenuSummaries(isAdmin), getNextMenu(isAdmin)]);
  const upcoming = countUpcoming(menus);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Menù"
        meta={`${menus.length} menù${upcoming ? ` · ${upcoming} in programma` : ""}`}
        actions={<NewMenuLink />}
      />
      {next && <NextMenuCard menu={next} />}
      <MenuGrid menus={menus} />
    </div>
  );
}
