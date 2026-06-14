"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Tipi
// ---------------------------------------------------------------------------
interface Category {
  id: number;
  name: string;
  color: string;
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
// Palette colori predefinita
// ---------------------------------------------------------------------------
const PALETTE = [
  "#0A7EA4", "#2e7d32", "#ad1457", "#558b2f", "#1565c0",
  "#37474f", "#6a1b9a", "#00695c", "#e64a19", "#0277bd",
  "#e65100", "#24addb", "#068604", "#f57f17", "#c62828",
];

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
    setCategories((prev) => [...prev, { ...json, _count: { recipes: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
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
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditId(null);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Eliminare la categoria "${name}"? Verrà rimossa da tutte le ricette.`)) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) { setError("Impossibile eliminare."); return; }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-gray-700">🏷️ Categorie ({categories.length})</h2>

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
      <ul className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
        {categories.map((cat) =>
          editId === cat.id ? (
            <li key={cat.id} className="flex items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 rounded-lg border border-orange-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <ColorPicker value={editColor} onChange={setEditColor} compact />
              <button onClick={() => handleSaveEdit(cat.id)} className="rounded-lg bg-green-500 px-2.5 py-1.5 text-xs text-white hover:bg-green-600 transition-colors">✓</button>
              <button onClick={() => setEditId(null)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">✕</button>
            </li>
          ) : (
            <li key={cat.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 group">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 truncate text-sm text-gray-700">{cat.name}</span>
              <span className="text-xs text-gray-400">{cat._count.recipes} ric.</span>
              <button onClick={() => startEdit(cat)} className="hidden group-hover:block text-xs text-sky-500 hover:text-sky-700 px-1">✎</button>
              <button onClick={() => handleDelete(cat.id, cat.name)} className="hidden group-hover:block text-xs text-red-400 hover:text-red-600 px-1">🗑</button>
            </li>
          )
        )}
      </ul>
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
    if (!confirm(`Eliminare il tag "${name}"? Verrà rimosso da tutte le ricette.`)) return;
    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (!res.ok) { setError("Impossibile eliminare."); return; }
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-gray-700">🔖 Tag ingredienti ({tags.length})</h2>

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
              <button onClick={() => onSaveEdit(tag.id)} className="rounded-lg bg-green-500 px-2.5 py-1.5 text-xs text-white hover:bg-green-600 transition-colors">✓</button>
              <button onClick={onCancelEdit} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">✕</button>
            </li>
          ) : (
            <li key={tag.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 group">
              <span className="flex-1 truncate text-sm text-gray-700">{tag.name}</span>
              <span className="text-xs text-gray-400">{tag._count.recipes} ric.</span>
              <button onClick={() => onEdit(tag)} className="hidden group-hover:block text-xs text-sky-500 hover:text-sky-700 px-1">✎</button>
              <button onClick={() => onDelete(tag.id, tag.name)} className="hidden group-hover:block text-xs text-red-400 hover:text-red-600 px-1">🗑</button>
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

// ===========================================================================
// Color Picker
// ===========================================================================
function ColorPicker({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`rounded-lg border border-gray-200 ${compact ? "h-8 w-8" : "h-9 w-9"} flex items-center justify-center`}
        title="Scegli colore"
      >
        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: value }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { onChange(c); setOpen(false); }}
                className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: value === c ? "#000" : "transparent" }}
              />
            ))}
          </div>
          {/* Input colore libero */}
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-7 rounded cursor-pointer"
            title="Colore personalizzato"
          />
        </div>
      )}
    </div>
  );
}

