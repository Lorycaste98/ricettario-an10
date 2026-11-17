"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { SearchField } from "@/components/ds/Field";
import { Segmented, VisibilityToggle } from "@/components/ds/Controls";
import { rowIconCls } from "@/components/ds/button-classes";
import { AdminEmptyRow, AdminRow, AdminTable, AdminThumb, DeleteRowButton, colCls } from "@/components/admin/AdminTable";
import { normalizeSearchText } from "@/lib/search";

/** Gestione ricette (12.1, schermata `docs/design/schermate/4-gestione-ricette`) */
interface RecipeItem {
  id: number;
  name: string;
  photo: string | null;
  published: boolean;
  cookCount: number;
  categories: { name: string; color: string }[];
}

type Filter = "all" | "ready" | "hidden";

const cooksLabel = (n: number) => (n === 0 ? "mai cucinata" : n === 1 ? "1 cottura" : `${n} cotture`);

export default function RicetteGestioneClient({ initialRecipes }: { initialRecipes: RecipeItem[] }) {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeItem[]>(initialRecipes);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const q = normalizeSearchText(query);
  const filtered = recipes.filter(
    (r) =>
      (filter === "all" || (filter === "ready") === r.published) &&
      (!q || normalizeSearchText(r.name).includes(q))
  );

  const togglePublished = async (item: RecipeItem) => {
    setBusyId(item.id);
    const next = !item.published;
    const res = await fetch(`/api/recipes/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: next }),
    }).catch(() => null);
    setBusyId(null);
    if (!res?.ok) return;
    setRecipes((prev) => prev.map((r) => (r.id === item.id ? { ...r, published: next } : r)));
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <SearchField value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca per nome" aria-label="Cerca ricetta" className="min-w-[12rem] flex-[2]" />
        <Segmented<Filter>
          label="Mostra"
          value={filter}
          onChange={setFilter}
          className="flex-1"
          options={[
            { value: "all", label: "Tutte" },
            { value: "ready", label: "Pronte", icon: <Eye aria-hidden /> },
            { value: "hidden", label: "Non pronte", icon: <EyeOff aria-hidden /> },
          ]}
        />
      </div>

      <AdminTable
        head={
          <>
            <span className="w-10" />
            <span className="flex-1">Ricetta</span>
            <span className={`${colCls} w-36`}>Categoria</span>
            <span className={`${colCls} w-28`}>Stato</span>
            <span className="w-[6.75rem] text-right">Visibile</span>
          </>
        }
      >
        {filtered.map((item) => {
          const cat = item.categories[0];
          const state = item.published ? cooksLabel(item.cookCount) : "non pronta";
          return (
            <AdminRow key={item.id}>
              <AdminThumb src={item.photo} alt={item.name} />
              <div className="min-w-0 flex-1">
                <Link href={`/ricette/${item.id}`} className={`block leading-tight font-bold break-words hover:underline ${item.published ? "" : "text-grigio"}`}>
                  {item.name}
                </Link>
                {/* tabella stretta: categoria e stato sotto il nome */}
                <p className="truncate text-(length:--fs-meta) text-grigio @min-[600px]/t:hidden">
                  {[cat?.name, state].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className={`${colCls} w-36 truncate text-(length:--fs-meta) text-grigio`}>
                {cat && <span aria-hidden className="mr-1.5 inline-block size-2 rounded-full" style={{ background: cat.color }} />}
                {cat?.name ?? "—"}
              </span>
              <span className={`${colCls} w-28 text-(length:--fs-meta) text-grigio`}>{state}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                <VisibilityToggle compact published={item.published} disabled={busyId === item.id} onToggle={() => void togglePublished(item)} />
                <Link href={`/admin/ricette/${item.id}`} className={rowIconCls} aria-label={`Modifica ${item.name}`} title="Modifica">
                  <Pencil aria-hidden />
                </Link>
                <DeleteRowButton
                  url={`/api/recipes/${item.id}`}
                  title={`Eliminare «${item.name}»?`}
                  message="La ricetta sparisce anche dai menù che la usano. L'azione è irreversibile."
                  onDeleted={() => setRecipes((prev) => prev.filter((r) => r.id !== item.id))}
                />
              </div>
            </AdminRow>
          );
        })}
        {filtered.length === 0 && <AdminEmptyRow>Nessuna ricetta trovata.</AdminEmptyRow>}
      </AdminTable>
    </div>
  );
}
