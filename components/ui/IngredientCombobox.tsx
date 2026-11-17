"use client";

import { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";
import { Plus } from "lucide-react";
import { dropdownCls, dropdownItemCls, dropdownNewCls } from "@/components/admin/FormParts";

// Elemento 11.6 · cerca e crea (ingrediente): suggerimenti dal catalogo IngredientMaster
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
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder={placeholder}
        className={clsx("w-full", className)}
        autoComplete="off"
      />
      {open && hasItems && (
        <div className={dropdownCls}>
          {filtered.slice(0, 25).map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectItem(name);
              }}
              className={dropdownItemCls}
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
              className={clsx(dropdownItemCls, dropdownNewCls)}
            >
              <Plus aria-hidden />
              {adding ? "Aggiunta…" : `Crea «${value.trim()}»`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
