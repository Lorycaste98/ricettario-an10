import { getSession } from "@/lib/session";
import { getRecipeSummaries } from "@/lib/queries";
import { Heart } from "lucide-react";
import { FavoritesClient } from "./FavoritesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Preferiti — Ricettario" };

export default async function PreferitiPage() {
  const isAdmin = !!(await getSession());
  const recipes = await getRecipeSummaries(isAdmin);

  return (
    <div>
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/30 px-4 py-1.5 text-xs font-semibold text-sky-700 backdrop-blur-sm">
          <Heart size={12} />
          Preferiti
        </div>
        <h1 className="text-3xl font-bold text-sky-50 drop-shadow">Le tue ricette preferite</h1>
        <p className="text-sky-200/80 text-sm">Salvate localmente su questo dispositivo</p>
      </div>
      <FavoritesClient recipes={recipes} />
    </div>
  );
}
