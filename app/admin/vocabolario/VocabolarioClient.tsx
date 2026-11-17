"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Hash, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/ds/Button";
import { Field, SearchField, TextInput } from "@/components/ds/Field";
import { Panel } from "@/components/ds/Panel";
import { Modal } from "@/components/ui/Modal";
import { ColorSwatches, nextPaletteColor } from "@/components/ui/ColorPicker";
import { ReorderList, ReorderRow } from "@/components/ui/ReorderList";
import { normalizeSearchText } from "@/lib/search";

/**
 * Categorie e tag (12.4, 12.5). Categorie: righe trascinabili (ordine salvato al rilascio) con
 * pallino colore; tag: lista con ricerca. Creazione, modifica ed eliminazione in una finestra,
 * così sul telefono non servono azioni nascoste al passaggio del mouse.
 */
interface Category {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
  _count: { recipes: number };
}

interface Tag {
  id: number;
  name: string;
  _count: { recipes: number };
}

/** Stato della finestra: nuovo elemento (id null) o modifica */
type Editing = { kind: "category"; id: number | null; name: string; color: string } | { kind: "tag"; id: number | null; name: string };

const recipesLabel = (n: number) => (n === 1 ? "1 ricetta" : `${n} ricette`);

export default function VocabolarioClient({ initialCategories, initialTags }: { initialCategories: Category[]; initialTags: Tag[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [tagQuery, setTagQuery] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Il drag aggiorna solo lo stato; il PUT parte al rilascio con l'ordine corrente
  const categoriesRef = useRef(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);
  const persistOrder = () => {
    fetch("/api/categories/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: categoriesRef.current.map((c) => c.id) }),
    }).catch(() => {});
  };

  const open = (e: Editing) => {
    setError("");
    setConfirmDelete(false);
    setEditing(e);
  };

  const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, "it");

  const save = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return setError("Inserisci un nome.");
    setBusy(true);
    setError("");
    const isCat = editing.kind === "category";
    const base = isCat ? "/api/categories" : "/api/tags";
    const body = isCat ? { name, color: editing.color } : { name };
    const res = await fetch(editing.id ? `${base}/${editing.id}` : base, {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const json = (await res?.json().catch(() => null)) as (Partial<Category> & { error?: string }) | null;
    setBusy(false);
    if (!res?.ok || !json) return setError(json?.error ?? "Non è stato possibile salvare.");

    if (isCat) {
      setCategories((prev) =>
        editing.id
          ? prev.map((c) => (c.id === editing.id ? { ...c, name: json.name ?? c.name, color: json.color ?? c.color } : c))
          : [...prev, { ...(json as Category), _count: { recipes: 0 } }]
      );
    } else {
      setTags((prev) =>
        (editing.id ? prev.map((t) => (t.id === editing.id ? { ...t, name: json.name ?? t.name } : t)) : [...prev, { ...(json as Tag), _count: { recipes: 0 } }]).sort(byName)
      );
    }
    setEditing(null);
  };

  const remove = async () => {
    if (!editing?.id) return;
    setBusy(true);
    const url = editing.kind === "category" ? `/api/categories/${editing.id}` : `/api/tags/${editing.id}`;
    const res = await fetch(url, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError("Non è stato possibile eliminare.");
    if (editing.kind === "category") setCategories((prev) => prev.filter((c) => c.id !== editing.id));
    else setTags((prev) => prev.filter((t) => t.id !== editing.id));
    setEditing(null);
  };

  const q = normalizeSearchText(tagQuery);
  const shownTags = q ? tags.filter((t) => normalizeSearchText(t.name).includes(q)) : tags;
  const kindLabel = editing?.kind === "category" ? "categoria" : "tag";
  const usedBy = editing?.id
    ? (editing.kind === "category" ? categories.find((c) => c.id === editing.id) : tags.find((t) => t.id === editing.id))?._count.recipes ?? 0
    : 0;

  return (
    <div className="grid items-start gap-(--gap) @min-[1000px]:grid-cols-2">
      {/* 12.4 · categorie */}
      <Panel
        title="Categorie"
        icon={<Tags />}
        meta="Trascina per cambiare l'ordine dei filtri"
        actions={
          <Button
            variant="tonal"
            size="sm"
            icon={<Plus />}
            onClick={() => open({ kind: "category", id: null, name: "", color: nextPaletteColor(categories.map((c) => c.color)) })}
          >
            Categoria
          </Button>
        }
      >
        <ReorderList as="ul" values={categories} onReorder={setCategories} className="-my-1 divide-y divide-blu-150">
          {categories.map((cat) => (
            <ReorderRow as="li" key={cat.id} value={cat} onDragEnd={persistOrder} handleSize="size-8" className="flex min-h-12 items-center gap-2.5 bg-white py-1">
              {(handle) => (
                <>
                  {handle}
                  <span aria-hidden className="size-3.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="min-w-0 flex-1 truncate font-bold">{cat.name}</span>
                  <span className="tabular shrink-0 text-(length:--fs-meta) text-grigio">{cat._count.recipes}</span>
                  <IconButton label={`Modifica ${cat.name}`} size="row" onClick={() => open({ kind: "category", id: cat.id, name: cat.name, color: cat.color })}>
                    <Pencil />
                  </IconButton>
                </>
              )}
            </ReorderRow>
          ))}
        </ReorderList>
        {categories.length === 0 && <p className="text-grigio">Nessuna categoria ancora.</p>}
      </Panel>

      {/* tag */}
      <Panel
        title="Tag"
        icon={<Hash />}
        meta={`${tags.length} tag`}
        actions={
          <Button variant="tonal" size="sm" icon={<Plus />} onClick={() => open({ kind: "tag", id: null, name: tagQuery.trim() })}>
            Tag
          </Button>
        }
      >
        <SearchField value={tagQuery} onChange={(e) => setTagQuery(e.target.value)} placeholder="Cerca tag" aria-label="Cerca tag" />
        <ul className="-my-1 max-h-[32rem] divide-y divide-blu-150 overflow-y-auto">
          {shownTags.map((tag) => (
            <li key={tag.id} className="flex min-h-11 items-center gap-2.5 py-1">
              <span className="min-w-0 flex-1 truncate font-semibold">
                <span className="text-grigio">#</span>
                {tag.name}
              </span>
              <span className="tabular shrink-0 text-(length:--fs-meta) text-grigio">{tag._count.recipes}</span>
              <IconButton label={`Modifica ${tag.name}`} size="row" onClick={() => open({ kind: "tag", id: tag.id, name: tag.name })}>
                <Pencil />
              </IconButton>
            </li>
          ))}
          {shownTags.length === 0 && <li className="py-6 text-center text-grigio">Nessun tag trovato.</li>}
        </ul>
      </Panel>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `${editing.id ? "Modifica" : editing.kind === "category" ? "Nuova" : "Nuovo"} ${kindLabel}` : ""}
        size="sm"
      >
        {editing && (
          <form onSubmit={save} className="flex flex-col gap-4">
            <Field label="Nome" error={error || undefined}>
              {(p) => <TextInput {...p} autoFocus value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />}
            </Field>
            {editing.kind === "category" && (
              <div className="flex flex-col gap-2">
                <span className="text-[0.8125rem] font-semibold text-grigio">Colore</span>
                <ColorSwatches value={editing.color} onChange={(color) => setEditing({ ...editing, color })} />
              </div>
            )}

            {confirmDelete ? (
              <div className="flex flex-col gap-3 rounded-ctl border border-rosa-200 bg-rosa-50 p-3">
                <p>
                  Eliminare «{editing.name}»?{" "}
                  {usedBy > 0 ? `Verrà tolto da ${recipesLabel(usedBy)}.` : "Nessuna ricetta lo usa."}
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                    No
                  </Button>
                  <Button variant="dangerSolid" size="sm" loading={busy} onClick={() => void remove()}>
                    Elimina
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {editing.id && (
                  <Button variant="danger" icon={<Trash2 />} onClick={() => setConfirmDelete(true)}>
                    Elimina
                  </Button>
                )}
                <span className="flex-1" />
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Annulla
                </Button>
                <Button type="submit" loading={busy}>
                  Salva
                </Button>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}
