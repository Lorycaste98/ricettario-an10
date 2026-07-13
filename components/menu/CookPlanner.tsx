"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { MenuCookMode } from "@/components/menu/MenuCookMode";
import { CookTimeline } from "@/components/menu/CookTimeline";
import { resolveServeAt } from "@/lib/cook-schedule";
import {
  buildSchedule,
  defaultStart,
  stepStartTimes,
  type RecipeSchedule,
  type TimelineRecipe,
} from "@/lib/cook-timeline";

// Wrapper della modalità cucina: possiede gli orari di inizio pianificati
// (MenuRecipe.cookStartAt, aggiornati via PATCH /api/menus/[id]/schedule) e li
// condivide tra la timeline e lo stepper (orario di ogni step).

interface CookRecipe extends TimelineRecipe {
  cookCount: number;
}

const noopSubscribe = () => () => {};

export function CookPlanner({
  menuId,
  date,
  servingTime,
  recipes,
}: {
  menuId: number;
  date: string | null;
  servingTime: string | null;
  recipes: CookRecipe[];
}) {
  // Gli orari vanno formattati SOLO client-side (il server Vercel è in UTC):
  // finché non siamo idratati si rende solo lo stepper senza orari.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const serve = useMemo(() => resolveServeAt(date, servingTime), [date, servingTime]);
  const hasTimeline = hydrated && !!serve?.hasTime;

  // Override espliciti (dal DB o dopo un drag); null = "torna all'automatico"
  const [custom, setCustom] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(recipes.map((r) => [r.id, r.cookStartAt]))
  );

  const schedules = useMemo(() => {
    const map = new Map<number, RecipeSchedule>();
    if (!serve) return map;
    for (const r of recipes) {
      const iso = custom[r.id];
      const start = iso ? new Date(iso) : defaultStart({ ...r, cookStartAt: null }, serve.serveAt);
      map.set(r.id, buildSchedule(r, start, serve.serveAt, !!iso));
    }
    return map;
  }, [recipes, custom, serve]);

  const patchSchedule = async (recipeId: number, cookStartAt: string | null) => {
    const prev = custom[recipeId] ?? null;
    setCustom((c) => ({ ...c, [recipeId]: cookStartAt }));
    try {
      const res = await fetch(`/api/menus/${menuId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, cookStartAt }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert dell'update ottimistico
      setCustom((c) => ({ ...c, [recipeId]: prev }));
    }
  };

  // Orario di ogni step, passato allo stepper (solo se la timeline è attiva)
  const stepTimes = useMemo(() => {
    if (!hasTimeline) return undefined;
    const out: Record<number, Date[]> = {};
    for (const r of recipes) {
      const s = schedules.get(r.id);
      if (s) out[r.id] = stepStartTimes(r, s.start);
    }
    return out;
  }, [hasTimeline, recipes, schedules]);

  return (
    <div className="space-y-6">
      {hasTimeline && serve ? (
        <CookTimeline
          recipes={recipes}
          schedules={schedules}
          serveAt={serve.serveAt}
          onStartChange={(recipeId, start) => patchSchedule(recipeId, start.toISOString())}
          onReset={(recipeId) => patchSchedule(recipeId, null)}
        />
      ) : (
        hydrated &&
        recipes.length > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/30 backdrop-blur-sm p-4 text-sm text-sky-900">
            <CalendarClock size={18} className="shrink-0 text-orange-600" />
            <p>
              Imposta <strong>data e ora di servizio</strong> del menù per pianificare le ricette sulla timeline.{" "}
              <Link href={`/admin/menu/${menuId}/modifica`} className="font-semibold text-orange-600 hover:underline">
                Modifica menù
              </Link>
            </p>
          </div>
        )
      )}

      <MenuCookMode menuId={menuId} recipes={recipes} stepTimes={stepTimes} />
    </div>
  );
}
