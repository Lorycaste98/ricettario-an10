"use client";
import Link from "next/link";
import { clsx } from "clsx";
import { ChevronRight, Users } from "lucide-react";
import type { MenuSummary } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { GuestRatingTag, HiddenTag } from "@/components/ds/Tag";

/**
 * Riga menù della vista a **lista** (gemella della `MenuCard` 8.5): a sinistra la data come
 * piccolo calendario (giorno della settimana, giorno, mese), poi nome, ora del servizio, persone
 * e ricette; a destra il voto ospiti o «Non pronto». Va dentro il contenitore a righe di `CollectionBody`.
 */
export function MenuRow({ menu }: { menu: MenuSummary }) {
  const { isAdmin } = useAuth();
  const hasRating = menu._count.reviews > 0 && menu.avgRating !== null;
  const isHidden = isAdmin && !menu.published;
  const n = menu._count.recipes;
  const d = menu.date ? new Date(menu.date) : null;
  const otherYear = d && d.getFullYear() !== new Date().getFullYear();

  return (
    <Link
      href={`/menu/${menu.id}`}
      className={clsx(
        "group flex min-w-0 items-center gap-3 px-[clamp(0.625rem,2cqi,1rem)] py-2.5 transition-colors hover:bg-blu-50",
        "focus-visible:relative focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35 focus-visible:ring-inset"
      )}
    >
      <span
        className={clsx(
          "flex w-14 shrink-0 flex-col items-center rounded-ctl bg-blu-100 py-1 leading-none text-blu-800",
          isHidden && "opacity-60"
        )}
        aria-hidden
      >
        {d ? (
          <>
            <span className="text-[0.6875rem] font-semibold text-grigio uppercase">
              {d.toLocaleDateString("it-IT", { weekday: "short" })}
            </span>
            <span className="tabular text-[1.375rem] font-bold">{d.getDate()}</span>
            <span className="text-[0.6875rem] font-semibold uppercase">
              {d.toLocaleDateString("it-IT", { month: "short" })}
              {otherYear && ` ${String(d.getFullYear()).slice(2)}`}
            </span>
          </>
        ) : (
          <span className="py-2 text-[0.6875rem] font-semibold text-grigio">—</span>
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 leading-tight font-bold text-blu-950 group-hover:text-blu-700" title={menu.name}>
          {menu.name}
        </span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-grigio">
          {menu.servingTime && <span className="tabular">ore {menu.servingTime}</span>}
          <span className="flex min-w-0 items-center gap-1">
            <Users className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {menu.people != null && `${menu.people} persone · `}
              {n} {n === 1 ? "ricetta" : "ricette"}
            </span>
          </span>
          {isHidden && <HiddenTag label="Non pronto" />}
        </span>
      </span>

      {hasRating && <GuestRatingTag value={menu.avgRating!} count={menu._count.reviews} />}
      <ChevronRight className="size-4 shrink-0 text-blu-300" aria-hidden />
    </Link>
  );
}
