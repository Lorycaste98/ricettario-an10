"use client";

import { useEffect, useRef, useState } from "react";
import { Tag as TagIcon, Bookmark, Check, X, Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { ColorPicker, PALETTE } from "@/components/ui/ColorPicker";
import { ReorderList, ReorderRow } from "@/components/ui/ReorderList";

// ---------------------------------------------------------------------------
// Tipi
// ---------------------------------------------------------------------------
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

interface Props {
  initialCategories: Category[];
  initialTags: Tag[];
}

// ---------------------------------------------------------------------------
// Componente principale
// ---------------------------------------------------------------------------
export default function VocabolarioClient({ initialCategories, initialTags }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [tags, setTags] = useState<Tag[]>(initialTags);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <CategoriesPanel categories={categories} setCategories={setCategories} />
      <TagsPanel tags={tags} setTags={setTags} />
    </div>
  );
}

// ===========================================================================
// SEZIONE CATEGORIE
// ===========================================================================
function CategoriesPanel({
  categories,
  setCategories,
}: {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}) {
  const confirm = useConfirm();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newName.trim()) { setError("Inserisci un nome."); return; }
    setAdding(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    const json = await res.json();
    setAdding(false);
    if (!res.ok) { setError(json.error ?? "Errore"); return; }
    setCategories((prev) => [...prev, { ...json, _count: { recipes: 0 } }]);
    setNewName("");
    setNewColor(PALETTE[0]);
  }

  function startEdit(cat: Category) {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setError("");
  }

  async function handleSaveEdit(id: number) {
    setError("");
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Errore"); return; }
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: json.name, color: json.color } : c))
    );
    setEditId(null);
  }

  // Durante il drag onReorder aggiorna solo lo stato; il PUT parte al rilascio.
  // Il ref si aggiorna in un effect (niente scritture ai ref durante il render)
  // e gli effect girano comunque prima dell'evento dragEnd.
  const categoriesRef = useRef(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);
  function persistOrder() {
    fetch("/api/categories/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: categoriesRef.current.map((c) => c.id) }),
    }).catch(() => {});
  }

  async function handleDelete(id: number, name: string) {
    const ok = await confirm({
      title: `Eliminare la categoria "${name}"?`,
      message: "Verrà rimossa da tutte le ricette.",
      confirmLabel: "Elimina",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) { setError("Impossibile eliminare."); return; }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"><TagIcon size={15} /> Categorie ({categories.length})</h2>

      {/* Form aggiunta */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome categoria…"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <button
            type="submit"
            disabled={adding}
            className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            +
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>

      {/* Lista */}
      <ReorderList
        as="ul"
        values={categories}
        onReorder={setCategories}
        layoutScroll
        className="space-y-1.5 max-h-96 overflow-y-auto pr-1"
      >
        {categories.map((cat) =>
          editId === cat.id ? (
            <ReorderRow as="li" key={cat.id} value={cat} onDragEnd={persistOrder} className="flex items-center gap-2">
            {(handle) => (
            <>
              <div className="shrink-0 -ml-1">{handle}</div>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 rounded-lg border border-orange-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <ColorPicker value={editColor} onChange={setEditColor} compact />
              <button onClick={() => handleSaveEdit(cat.id)} className="rounded-lg bg-green-500 px-2.5 py-1.5 text-xs text-white hover:bg-green-600 transition-colors"><Check size={14} /></button>
              <button onClick={() => setEditId(null)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"><X size={14} /></button>
            </>
            )}
            </ReorderRow>
          ) : (
            <ReorderRow as="li" key={cat.id} value={cat} onDragEnd={persistOrder} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 group">
            {(handle) => (
            <>
              <div className="shrink-0 -ml-1">{handle}</div>
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 truncate text-sm text-gray-700">{cat.name}</span>
              <span className="text-xs text-gray-400">{cat._count.recipes} ric.</span>
              <button onClick={() => startEdit(cat)} className="hidden group-hover:block text-sky-500 hover:text-sky-700 px-1"><Pencil size={14} /></button>
              <button onClick={() => handleDelete(cat.id, cat.name)} className="hidden group-hover:block text-red-400 hover:text-red-600 px-1"><Trash2 size={14} /></button>
            </>
            )}
            </ReorderRow>
          )
        )}
      </ReorderList>
    </section>
  );
}

// ===========================================================================
// SEZIONE TAG
// ===========================================================================
function TagsPanel({
  tags,
  setTags,
}: {
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
}) {
  const confirm = useConfirm();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newName.trim()) { setError("Inserisci un nome."); return; }
    setAdding(true);
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const json = await res.json();
    setAdding(false);
    if (!res.ok) { setError(json.error ?? "Errore"); return; }
    setTags((prev) => [...prev, { ...json, _count: { recipes: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName("");
  }

  async function handleSaveEdit(id: number) {
    setError("");
    if (!editName.trim()) { setError("Il nome non può essere vuoto."); return; }
    const res = await fetch(`/api/tags/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Errore"); return; }
    setTags((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: json.name } : t))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditId(null);
  }

  async function handleDelete(id: number, name: string) {
    const ok = await confirm({
      title: `Eliminare il tag "${name}"?`,
      message: "Verrà rimosso da tutte le ricette.",
      confirmLabel: "Elimina",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (!res.ok) { setError("Impossibile eliminare."); return; }
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"><Bookmark size={15} /> Tag ingredienti ({tags.length})</h2>

      {/* Form aggiunta */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome tag…"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            type="submit"
            disabled={adding}
            className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            +
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>

      {/* Ricerca rapida */}
      <TagSearch tags={tags} onEdit={(t) => { setEditId(t.id); setEditName(t.name); setError(""); }} onDelete={handleDelete} editId={editId} editName={editName} setEditName={setEditName} onSaveEdit={handleSaveEdit} onCancelEdit={() => setEditId(null)} />
    </section>
  );
}

function TagSearch({
  tags, onEdit, onDelete, editId, editName, setEditName, onSaveEdit, onCancelEdit,
}: {
  tags: Tag[];
  onEdit: (t: Tag) => void;
  onDelete: (id: number, name: string) => void;
  editId: number | null;
  editName: string;
  setEditName: (v: string) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? tags.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()))
    : tags;

  return (
    <div className="space-y-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cerca tag…"
        className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
      <ul className="space-y-1 max-h-80 overflow-y-auto pr-1">
        {filtered.map((tag) =>
          editId === tag.id ? (
            <li key={tag.id} className="flex items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 rounded-lg border border-orange-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                onKeyDown={(e) => { if (e.key === "Enter") onSaveEdit(tag.id); if (e.key === "Escape") onCancelEdit(); }}
                autoFocus
              />
              <button onClick={() => onSaveEdit(tag.id)} className="rounded-lg bg-green-500 px-2.5 py-1.5 text-xs text-white hover:bg-green-600 transition-colors"><Check size={14} /></button>
              <button onClick={onCancelEdit} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"><X size={14} /></button>
            </li>
          ) : (
            <li key={tag.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 group">
              <span className="flex-1 truncate text-sm text-gray-700">{tag.name}</span>
              <span className="text-xs text-gray-400">{tag._count.recipes} ric.</span>
              <button onClick={() => onEdit(tag)} className="hidden group-hover:block text-sky-500 hover:text-sky-700 px-1"><Pencil size={14} /></button>
              <button onClick={() => onDelete(tag.id, tag.name)} className="hidden group-hover:block text-red-400 hover:text-red-600 px-1"><Trash2 size={14} /></button>
            </li>
          )
        )}
        {filtered.length === 0 && (
          <li className="py-4 text-center text-sm text-gray-400">Nessun tag trovato.</li>
        )}
      </ul>
    </div>
  );
}

