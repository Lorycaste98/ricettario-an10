import { MenuGrid } from "@/components/menu/MenuGrid";
import { getMenuSummaries } from "@/lib/queries";
import type { Metadata } from "next";
import { UtensilsCrossed } from "lucide-react";

export const metadata: Metadata = { title: "Menù — Ricettario" };

export default async function MenuListPage() {
  const menus = await getMenuSummaries();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/30 px-4 py-1.5 text-xs font-semibold text-sky-700 backdrop-blur-sm">
          <UtensilsCrossed size={12} />
          Menù
        </div>
        <h1 className="text-3xl font-bold text-sky-50 drop-shadow">I miei menù</h1>
        <p className="text-sky-200/80 text-sm">
          Raccolte di ricette per ogni occasione
        </p>
      </div>

      <MenuGrid menus={menus} />
    </div>
  );
}


