import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Metadata } from "next";
import { Plus, Pencil, Eye, UtensilsCrossed, Star, CalendarDays } from "lucide-react";
import { AdminMenuDeleteButton } from "./AdminMenuDeleteButton";

export const metadata: Metadata = { title: "Gestione Menù — Admin" };
export const dynamic = "force-dynamic";

async function getMenus() {
  const menus = await db.menu.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      photo: true,
      createdAt: true,
      _count: { select: { reviews: true, recipes: true } },
      reviews: { select: { rating: true } },
      recipes: {
        select: { recipe: { select: { photo: true } } },
        orderBy: { order: "asc" },
        take: 1,
      },
    },
  });

  return menus.map((m) => {
    const reviews = m.reviews as { rating: number }[];
    const avgRating =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
          ) / 10
        : null;
    const thumb = m.photo ?? m.recipes[0]?.recipe.photo ?? null;
    return {
      ...m,
      date: m.date ? m.date.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
      avgRating,
      thumb,
    };
  });
}

export default async function AdminMenuPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const menus = await getMenus();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sky-50">Gestione Menù</h1>
          <p className="text-sm text-sky-300/60 mt-0.5">{menus.length} menù totali</p>
        </div>
        <Link
          href="/admin/menu/nuovo"
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition shadow-sm"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Nuovo menù</span>
          <span className="sm:hidden">Nuovo</span>
        </Link>
      </div>

      {menus.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm py-16">
          <UtensilsCrossed size={40} className="text-sky-400/40" />
          <p className="text-sm text-sky-200/50">Nessun menù ancora.</p>
          <Link
            href="/admin/menu/nuovo"
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
          >
            <Plus size={14} /> Crea il primo menù
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {menus.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-4 rounded-2xl border border-white/25 bg-white/35 backdrop-blur-sm p-3.5 hover:bg-white/45 transition"
            >
              {/* Thumb */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sky-100">
                {m.thumb ? (
                  <Image src={m.thumb} alt={m.name} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <UtensilsCrossed size={20} className="text-sky-300/60" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sky-950 truncate">{m.name}</h3>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-sky-700/70">
                  <span className="flex items-center gap-1">
                    <UtensilsCrossed size={9} />
                    {m._count.recipes} ricette
                  </span>
                  {m.avgRating !== null && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star size={9} fill="currentColor" />
                      {m.avgRating.toFixed(1)} ({m._count.reviews})
                    </span>
                  )}
                  {m.date && (
                    <span className="flex items-center gap-1">
                      <CalendarDays size={9} />
                      {new Date(m.date).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/menu/${m.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/40 text-sky-600 hover:bg-sky-50/60 transition"
                  title="Visualizza"
                >
                  <Eye size={14} />
                </Link>
                <Link
                  href={`/admin/menu/${m.id}/modifica`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/40 text-sky-600 hover:bg-sky-50/60 transition"
                  title="Modifica"
                >
                  <Pencil size={14} />
                </Link>
                <AdminMenuDeleteButton menuId={m.id} menuName={m.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


