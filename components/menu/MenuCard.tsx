"use client";
import Link from "next/link";
import { clsx } from "clsx";
import { Users } from "lucide-react";
import type { MenuSummary } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { GuestRatingTag, HiddenTag } from "@/components/ds/Tag";

/** «sab 13 dic · 20:00»; anno solo se diverso da quello corrente */
export function formatMenuWhen(date: string | null, servingTime: string | null) {
  if (!date) return null;
  const d = new Date(date);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const s = d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
  return servingTime ? `${s} · ${servingTime}` : s;
}

/**
 * Card menù in lista (tavola 8.5): testata azzurra con il filo del colore di area menù a sinistra
 * (data e nome), sotto persone e ricette e a destra il voto ospiti o «Non pronto» (solo admin).
 */
export function MenuCard({ menu }: { menu: MenuSummary }) {
  const { isAdmin } = useAuth();
  const when = formatMenuWhen(menu.date, menu.servingTime);
  const hasRating = menu._count.reviews > 0 && menu.avgRating !== null;
  const isHidden = isAdmin && !menu.published;
  const n = menu._count.recipes;

  return (
    <Link
      href={`/menu/${menu.id}`}
      className={clsx(
        "group flex min-w-0 flex-col overflow-hidden rounded-card border border-blu-150 bg-white transition-shadow hover:shadow-[0_6px_18px_oklch(25%_0.038_228/.1)]",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35",
        isHidden && "border-dashed"
      )}
    >
      <div className={clsx("border-l-4 border-area-menu bg-blu-100 px-[0.9em] py-[0.7em]", isHidden && "opacity-70")}>
        <small className="block text-xs text-grigio">{when ?? "Senza data"}</small>
        <h3 className="line-clamp-2 text-[1.0625rem] leading-snug font-bold text-blu-950 group-hover:text-blu-700" title={menu.name}>
          {menu.name}
        </h3>
      </div>
      <div className="mt-auto flex min-h-[2.75rem] items-center justify-between gap-2 px-[0.9em] py-[0.5em] text-[0.8125rem] text-grigio">
        <span className="flex min-w-0 items-center gap-[0.35em]">
          <Users className="size-[1.1em] shrink-0" aria-hidden />
          <span className="truncate">
            {menu.people != null && `${menu.people} persone · `}
            {n} {n === 1 ? "ricetta" : "ricette"}
          </span>
        </span>
        {isHidden ? <HiddenTag label="Non pronto" /> : hasRating && <GuestRatingTag value={menu.avgRating!} count={menu._count.reviews} />}
      </div>
    </Link>
  );
}
