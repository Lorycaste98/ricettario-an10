/**
 * Voci dell'area Gestione (restyle fase 5, D7), condivise fra la sotto-navigazione
 * (`AdminNav.tsx`, client) e la dashboard (`AdminDashboard.tsx`, server): stesse icone e stessi
 * colori di area (13.2). Modulo senza "use client" apposta: un server component non può leggere
 * costanti esportate da un modulo client (riceverebbe un riferimento, non l'array).
 */
import type { ComponentType } from "react";
import { BookOpen, Star, Tags, Upload, Users } from "lucide-react";
import { ClocheIcon, GroceryBagIcon } from "@/components/icons";
import type { AdminOverview } from "@/lib/admin-overview";

export type AdminArea = "ricette" | "menu" | "ingredienti" | "vocabolario" | "recensioni" | "neutro";

/** Colori di area (13.2): icona, fondo dell'icona, filo in cima alla tessera. Classi scritte per esteso per Tailwind. */
export const AREA_CLS: Record<AdminArea, { text: string; bg: string; top: string }> = {
  ricette: { text: "text-area-ricette", bg: "bg-area-ricette-50", top: "border-t-area-ricette" },
  menu: { text: "text-area-menu", bg: "bg-area-menu-50", top: "border-t-area-menu" },
  ingredienti: { text: "text-area-ingredienti", bg: "bg-area-ingredienti-50", top: "border-t-area-ingredienti" },
  vocabolario: { text: "text-area-vocabolario", bg: "bg-area-vocabolario-50", top: "border-t-area-vocabolario" },
  recensioni: { text: "text-giallo-ink", bg: "bg-oro-50", top: "border-t-giallo-ink" },
  neutro: { text: "text-adm-900", bg: "bg-adm-100", top: "border-t-adm-900" },
};

type Icon = ComponentType<{ className?: string }>;

export interface AdminEntry {
  href: string;
  label: string;
  icon: Icon;
  area: AdminArea;
}

export const ADMIN_CREATE: (AdminEntry & { hint: string })[] = [
  { href: "/admin/ricette/nuova", label: "Nuova ricetta", hint: "Ingredienti, passi, foto", icon: BookOpen, area: "ricette" },
  { href: "/admin/menu/nuovo", label: "Nuovo menù", hint: "Ricette, data, persone", icon: ClocheIcon, area: "menu" },
  { href: "/admin/import", label: "Importa ricette", hint: "Da file JSON", icon: Upload, area: "neutro" },
];

export type AdminSectionKey = "ricette" | "menu" | "ingredienti" | "vocabolario" | "recensioni" | "utenti";

export const ADMIN_SECTIONS: (AdminEntry & { key: AdminSectionKey; group: "contenuti" | "persone"; superOnly?: boolean })[] = [
  { key: "ricette", href: "/admin/ricette", label: "Ricette", icon: BookOpen, area: "ricette", group: "contenuti" },
  { key: "menu", href: "/admin/menu", label: "Menù", icon: ClocheIcon, area: "menu", group: "contenuti" },
  { key: "ingredienti", href: "/admin/ingredienti", label: "Ingredienti", icon: GroceryBagIcon, area: "ingredienti", group: "contenuti" },
  { key: "vocabolario", href: "/admin/vocabolario", label: "Categorie e tag", icon: Tags, area: "vocabolario", group: "contenuti" },
  { key: "recensioni", href: "/admin/recensioni", label: "Recensioni", icon: Star, area: "recensioni", group: "persone" },
  { key: "utenti", href: "/admin/utenti", label: "Utenti", icon: Users, area: "neutro", group: "persone", superOnly: true },
];

/** Numero accanto a una voce di Gestione */
export function sectionCount(key: AdminSectionKey, o: AdminOverview) {
  switch (key) {
    case "ricette":
      return o.recipes;
    case "menu":
      return o.menus;
    case "ingredienti":
      return o.ingredients;
    case "vocabolario":
      return o.categories + o.tags;
    case "recensioni":
      return o.reviews;
    case "utenti":
      return o.users;
  }
}

