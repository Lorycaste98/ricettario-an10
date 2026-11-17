"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { SearchField } from "@/components/ds/Field";
import { Segmented, VisibilityToggle } from "@/components/ds/Controls";
import { GuestRatingTag } from "@/components/ds/Tag";
import { rowIconCls } from "@/components/ds/button-classes";
import { AdminEmptyRow, AdminRow, AdminTable, AdminThumb, DeleteRowButton, colCls } from "@/components/admin/AdminTable";
import { normalizeSearchText } from "@/lib/search";

/** Gestione menù: stessa tabella delle ricette (12.1), con data, ricette e voto ospiti */
export interface AdminMenuItem {
  id: number;
  name: string;
  date: string | null;
  published: boolean;
  people: number | null;
  recipes: number;
  reviews: number;
  avgRating: number | null;
  thumb: string | null;
}

type Filter = "all" | "ready" | "hidden";

// Le date dei menù sono salvate a mezzanotte UTC: si formattano in UTC per non slittare di un giorno
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function MenuGestioneClient({ initialMenus }: { initialMenus: AdminMenuItem[] }) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const q = normalizeSearchText(query);
  const filtered = menus.filter(
    (m) => (filter === "all" || (filter === "ready") === m.published) && (!q || normalizeSearchText(m.name).includes(q))
  );

  const togglePublished = async (item: AdminMenuItem) => {
    setBusyId(item.id);
    const next = !item.published;
    const res = await fetch(`/api/menus/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: next }),
    }).catch(() => null);
    setBusyId(null);
    if (!res?.ok) return;
    setMenus((prev) => prev.map((m) => (m.id === item.id ? { ...m, published: next } : m)));
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <SearchField value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca per nome" aria-label="Cerca menù" className="min-w-[12rem] flex-[2]" />
        <Segmented<Filter>
          label="Mostra"
          value={filter}
          onChange={setFilter}
          className="flex-1"
          options={[
            { value: "all", label: "Tutti" },
            { value: "ready", label: "Pronti", icon: <Eye aria-hidden /> },
            { value: "hidden", label: "Non pronti", icon: <EyeOff aria-hidden /> },
          ]}
        />
      </div>

      <AdminTable
        head={
          <>
            <span className="w-10" />
            <span className="flex-1">Menù</span>
            <span className={`${colCls} w-28`}>Data</span>
            <span className={`${colCls} w-24`}>Ricette</span>
            <span className={`${colCls} w-20`}>Voto</span>
            <span className="w-[6.75rem] text-right">Visibile</span>
          </>
        }
      >
        {filtered.map((m) => {
          const meta = [m.date ? fmtDate(m.date) : "senza data", `${m.recipes} ricette`, m.people ? `${m.people} persone` : null].filter(Boolean).join(" · ");
          return (
            <AdminRow key={m.id}>
              <AdminThumb src={m.thumb} alt={m.name} />
              <div className="min-w-0 flex-1">
                <Link href={`/menu/${m.id}`} className={`block leading-tight font-bold break-words hover:underline ${m.published ? "" : "text-grigio"}`}>
                  {m.name}
                </Link>
                <p className="flex flex-wrap items-center gap-x-2 text-(length:--fs-meta) text-grigio @min-[600px]/t:hidden">
                  {meta}
                  {m.avgRating != null && <GuestRatingTag value={m.avgRating} count={m.reviews} />}
                </p>
              </div>
              <span className={`${colCls} w-28 text-(length:--fs-meta) text-grigio`}>{m.date ? fmtDate(m.date) : "—"}</span>
              <span className={`${colCls} w-24 text-(length:--fs-meta) text-grigio`}>
                {m.recipes}
                {m.people ? ` · ${m.people} pers.` : ""}
              </span>
              <span className={`${colCls} w-20`}>{m.avgRating != null ? <GuestRatingTag value={m.avgRating} count={m.reviews} /> : <span className="text-grigio">—</span>}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                <VisibilityToggle compact labels={{ on: "Pronto", off: "Non pronto" }} published={m.published} disabled={busyId === m.id} onToggle={() => void togglePublished(m)} />
                <Link href={`/admin/menu/${m.id}/modifica`} className={rowIconCls} aria-label={`Modifica ${m.name}`} title="Modifica">
                  <Pencil aria-hidden />
                </Link>
                <DeleteRowButton
                  url={`/api/menus/${m.id}`}
                  title={`Eliminare «${m.name}»?`}
                  message="Le ricette restano nel ricettario. L'azione è irreversibile."
                  onDeleted={() => setMenus((prev) => prev.filter((x) => x.id !== m.id))}
                />
              </div>
            </AdminRow>
          );
        })}
        {filtered.length === 0 && <AdminEmptyRow>Nessun menù trovato.</AdminEmptyRow>}
      </AdminTable>
    </div>
  );
}
