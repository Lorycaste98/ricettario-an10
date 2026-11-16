"use client";
import { useState } from "react";
import { PotIcon } from "@/components/icons";

interface Props {
  recipeId: number;
  initialCount: number;
}

export function CookCounter({ recipeId, initialCount }: Props) {
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const increment = async () => {
    setLoading(true);
    const res = await fetch(`/api/recipes/${recipeId}/cook`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setCount(data.cookCount);
    }
    setLoading(false);
  };

  const decrement = async () => {
    if (count === 0) return;
    setLoading(true);
    const res = await fetch(`/api/recipes/${recipeId}/cook`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      setCount(data.cookCount);
    }
    setLoading(false);
  };

  // Contatore «volte cucinata» (solo admin): stessa forma dello stepper dosi (3.13)
  const btn =
    "flex size-(--h-btn) items-center justify-center rounded-ctl border border-blu-200 bg-white text-xl font-bold text-blu-800 hover:bg-blu-100 disabled:opacity-40";
  return (
    <div className="flex items-center gap-3 rounded-card border border-blu-150 bg-white px-3.5 py-3">
      <PotIcon className="size-6 shrink-0 text-blu-700" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] text-grigio">Volte cucinata</p>
        <p className="tabular text-xl font-bold">{count}</p>
      </div>
      <button type="button" onClick={decrement} disabled={loading || count === 0} aria-label="Togli una cottura" className={btn}>
        −
      </button>
      <button type="button" onClick={increment} disabled={loading} aria-label="Aggiungi una cottura" className={btn}>
        +
      </button>
    </div>
  );
}
