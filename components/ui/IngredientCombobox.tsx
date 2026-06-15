"use client";

import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  allIngredients: string[];
  onNewIngredient: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export function IngredientCombobox({
  value,
  onChange,
  allIngredients,
  onNewIngredient,
  placeholder = "Ingrediente",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toLowerCase();
  const filtered = query
    ? allIngredients.filter((n) => n.toLowerCase().includes(query))
    : allIngredients;

  const exactMatch = allIngredients.some((n) => n.toLowerCase() === query);
  const showAdd = query && !exactMatch;

  const selectItem = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  const handleAdd = async () => {
    const name = value.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      onNewIngredient(name);
      setOpen(false);
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasItems = filtered.length > 0 || !!showAdd;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && hasItems && (
        <div className="absolute left-0 right-0 top-full z-50 mt-0.5 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.slice(0, 25).map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectItem(name);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-sky-50 transition-colors"
            >
              {name}
            </button>
          ))}
          {showAdd && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                void handleAdd();
              }}
              disabled={adding}
              className="w-full flex items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
            >
              <Plus size={13} />
              {adding ? "Aggiunta…" : `Aggiungi "${value.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
