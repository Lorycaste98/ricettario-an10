"use client";
import { useState } from "react";
import { CookingPot } from "lucide-react";

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

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm px-4 py-3">
      <CookingPot size={24} className="text-orange-500" />
      <div className="flex-1">
        <p className="text-sm font-medium text-sky-800">Volte cucinata</p>
        <p className="text-2xl font-bold text-orange-500">{count}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={decrement}
          disabled={loading || count === 0}
          className="h-8 w-8 rounded-full border border-white/40 bg-white/60 text-sky-800 hover:bg-white/80 disabled:opacity-40 transition-colors text-lg leading-none"
        >
          −
        </button>
        <button
          onClick={increment}
          disabled={loading}
          className="h-8 w-8 rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 transition-colors text-lg leading-none"
        >
          +
        </button>
      </div>
    </div>
  );
}

