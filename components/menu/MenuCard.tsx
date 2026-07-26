"use client";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import type { MenuSummary } from "@/lib/types";
import { UtensilsCrossed, Star, BookOpen, CalendarDays, EyeOff, Users } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Pill voto (oro) — identica alla RecipeCard per omogeneità. */
function RatingPill({ avg, count }: { avg: number; count: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-400/20 px-1.5 py-0.5 text-amber-300 shadow-sm">
      <Star size={11} className="fill-current" />
      <span className="text-xs font-bold leading-none">{avg.toFixed(1)}</span>
      <span className="text-[10px] leading-none text-amber-200/70">({count})</span>
    </span>
  );
}

export function MenuCard({ menu }: { menu: MenuSummary }) {
  const { isAdmin } = useAuth();
  const photos = menu.previewPhotos.slice(0, 4);
  const date = formatDate(menu.date);
  const hasRating = menu._count.reviews > 0 && menu.avgRating !== null;
  // Menù "non pronto": visibile solo all'admin, offuscato + badge (come RecipeCard)
  const isHidden = isAdmin && !menu.published;

  return (
    <Link
      href={`/menu/${menu.id}`}
      className={clsx(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-zinc-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300",
        isHidden && "opacity-55 hover:opacity-100 ring-1 ring-dashed ring-white/30"
      )}
    >
      {/* Image area — l'aspect ratio fisso rende tutte le card della stessa altezza */}
      <div className="relative aspect-4/3 overflow-hidden">
        {photos.length === 0 ? (
          <div className="flex h-full items-center justify-center bg-zinc-800">
            <UtensilsCrossed size={48} className="text-sky-400/40" />
          </div>
        ) : photos.length === 1 ? (
          <Image
            src={photos[0]}
            alt={menu.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          /* 2x2 photo grid */
          <div className="grid grid-cols-2 grid-rows-2 h-full">
            {[0, 1, 2, 3].map((i) =>
              photos[i] ? (
                <div key={i} className="relative overflow-hidden">
                  <Image
                    src={photos[i]}
                    alt=""
                    fill
                    sizes="25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div key={i} className="bg-zinc-800" />
              )
            )}
          </div>
        )}

        {/* Sottile sfumatura in alto per la leggibilità dei badge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/45 to-transparent" />

        {/* Badge "non pronto" (solo admin) */}
        {isHidden && (
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow backdrop-blur-sm">
              <EyeOff size={10} /> Non pronto
            </span>
          </div>
        )}

        {/* Pannello info frosted: sopra la foto, ma la foto resta visibile (blur) */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 border-t border-white/10 bg-black/30 px-2.5 py-2 backdrop-blur-md sm:px-3">
          <div className="flex items-start justify-between gap-2">
            <h3
              title={menu.name}
              className="min-h-[2.75em] text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow group-hover:text-orange-300 transition-colors"
            >
              {menu.name}
            </h3>
            {hasRating && <RatingPill avg={menu.avgRating!} count={menu._count.reviews} />}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] sm:text-[11px] text-white/85">
            <span className="flex items-center gap-1">
              <BookOpen size={12} className="shrink-0" /> {menu._count.recipes} ricette
            </span>
            {date && (
              <span className="flex items-center gap-1">
                <CalendarDays size={12} className="shrink-0" /> {date}
              </span>
            )}
            {menu.people != null && (
              <span className="flex items-center gap-1">
                <Users size={12} className="shrink-0" /> {menu.people} pers.
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
