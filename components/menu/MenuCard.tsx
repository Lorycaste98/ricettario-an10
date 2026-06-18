import Link from "next/link";
import Image from "next/image";
import type { MenuSummary } from "@/lib/types";
import { UtensilsCrossed, Star, BookOpen, CalendarDays } from "lucide-react";

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MenuCard({ menu }: { menu: MenuSummary }) {
  const photos = menu.previewPhotos.slice(0, 4);
  const date = formatDate(menu.date);

  return (
    <Link
      href={`/menu/${menu.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-zinc-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Image collage or single photo */}
      <div className="relative aspect-4/3 overflow-hidden">
        {photos.length === 0 ? (
          <div className="flex h-full items-center justify-center bg-sky-950/80">
            <UtensilsCrossed size={48} className="text-sky-400/50" />
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
                <div key={i} className="bg-sky-950/60" />
              )
            )}
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" />

        {/* Recipes count badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <BookOpen size={9} />
            {menu._count.recipes} ricette
          </span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
          <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow group-hover:text-orange-300 transition-colors">
            {menu.name}
          </h3>
          {menu.description && (
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-white/70 line-clamp-1">{menu.description}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {menu.avgRating !== null && (
              <span className="flex items-center gap-0.5 text-amber-300 text-[10px] sm:text-xs">
                <Star size={9} fill="currentColor" />
                <span className="font-semibold">{menu.avgRating.toFixed(1)}</span>
                <span className="text-white/60">({menu._count.reviews})</span>
              </span>
            )}
            {date && (
              <span className="flex items-center gap-0.5 text-[10px] sm:text-[11px] text-white/70">
                <CalendarDays size={9} />
                {date}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

