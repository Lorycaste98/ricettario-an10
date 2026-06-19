"use client";

import { useCallback, useState } from "react";
import { CalendarDays, ChevronDown, Check } from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartItem {
  name: string;
  value: number;
}

interface CategoryItem extends ChartItem {
  color: string;
}

function YAxisTick({
  x,
  y,
  payload,
  maxChars = 26,
  onExclude,
}: {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
  maxChars?: number;
  onExclude?: (name: string) => void;
}) {
  const raw = payload?.value ?? "";
  const label = raw.length > maxChars ? raw.slice(0, maxChars - 1) + "…" : raw;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={onExclude ? -20 : -6}
        y={0}
        dy={4}
        textAnchor="end"
        fill="#374151"
        fontSize={12}
        fontFamily="inherit"
      >
        {label}
      </text>
      {onExclude && (
        <g
          transform="translate(-9, -6)"
          onClick={() => onExclude(raw)}
          style={{ cursor: "pointer" }}
          aria-label={`Escludi ${raw} dalle statistiche`}
        >
          <circle cx={0} cy={6} r={7} fill="#f3f4f6" stroke="#d1d5db" strokeWidth={0.5} />
          <text
            x={0}
            y={6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill="#9ca3af"
            fontFamily="inherit"
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
}

function HorizontalBarChart({
  data,
  color,
  colors,
  unit,
  yAxisWidth = 190,
  onExclude,
}: {
  data: ChartItem[];
  color: string;
  /** Colore per barra (override di `color`) — usato dal grafico categorie. */
  colors?: string[];
  unit?: string;
  yAxisWidth?: number;
  onExclude?: (name: string) => void;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="[&_*:focus]:outline-none [&_svg:focus]:outline-none">
    <ResponsiveContainer width="100%" height={Math.max(data.length * 36 + 16, 80)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
        barSize={18}
      >
        <XAxis
          type="number"
          domain={[0, maxValue]}
          tickCount={Math.min(maxValue + 1, 6)}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={yAxisWidth}
          axisLine={false}
          tickLine={false}
          tick={(props) => (
            <YAxisTick {...props} onExclude={onExclude} maxChars={onExclude ? 22 : 26} />
          )}
        />
        <Tooltip
          cursor={{ fill: "#f9fafb" }}
          formatter={(val) =>
            unit ? [`${val ?? 0} ${unit}`, ""] : [val ?? 0, ""]
          }
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: 12,
          }}
          labelStyle={{ fontWeight: 600, color: "#111827" }}
        />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          fill={color}
          fillOpacity={0.85}
        >
          {colors &&
            data.map((d, i) => <Cell key={d.name} fill={colors[i] ?? color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}

type ChartKey = "categories" | "tags" | "cooked" | "ingredients";

const CHART_OPTIONS: { key: ChartKey; label: string }[] = [
  { key: "categories", label: "Ricette per categoria" },
  { key: "tags", label: "Ricette per tag" },
  { key: "cooked", label: "Ricette più cucinate" },
  { key: "ingredients", label: "Ingredienti più usati" },
];

type PresetKey = "all" | "month" | "3months" | "year" | "custom";

const PRESET_OPTIONS: { key: Exclude<PresetKey, "custom">; label: string }[] = [
  { key: "all", label: "Tutto" },
  { key: "month", label: "Ultimo mese" },
  { key: "3months", label: "Ultimi 3 mesi" },
  { key: "year", label: "Quest'anno" },
];

function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Calcola l'intervallo {from,to} (ISO yyyy-mm-dd) per un preset. */
function presetRange(preset: Exclude<PresetKey, "custom">): { from: string; to: string } {
  const now = new Date();
  const to = fmtDate(now);
  if (preset === "month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return { from: fmtDate(d), to };
  }
  if (preset === "3months") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 3);
    return { from: fmtDate(d), to };
  }
  if (preset === "year") {
    return { from: `${now.getFullYear()}-01-01`, to };
  }
  return { from: "", to: "" }; // all
}

function shortLabel(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y.slice(2)}`;
}

interface PeriodState {
  preset: PresetKey;
  from: string;
  to: string;
}

const INITIAL_PERIOD: PeriodState = { preset: "all", from: "", to: "" };

function periodLabel(p: PeriodState) {
  if (p.preset === "custom") {
    if (p.from && p.to) return `${shortLabel(p.from)} – ${shortLabel(p.to)}`;
    if (p.from) return `da ${shortLabel(p.from)}`;
    if (p.to) return `fino al ${shortLabel(p.to)}`;
    return "Personalizzato";
  }
  return PRESET_OPTIONS.find((o) => o.key === p.preset)?.label ?? "Tutto";
}

export default function ChartsSection({
  topCategories,
  topTags,
  topCooked,
  topIngredients,
}: {
  topCategories: CategoryItem[];
  topTags: ChartItem[];
  topCooked: ChartItem[];
  topIngredients: ChartItem[];
}) {
  const [excluding, setExcluding] = useState<string | null>(null);
  const [active, setActive] = useState<ChartKey>("categories");

  // Dati correnti: partono dai props (SSR, periodo "Tutto"), poi si aggiornano via API
  const [data, setData] = useState<{
    topCategories: CategoryItem[];
    topTags: ChartItem[];
    topCooked: ChartItem[];
    topIngredients: ChartItem[];
  }>({ topCategories, topTags, topCooked, topIngredients });
  const [loading, setLoading] = useState(false);

  const [period, setPeriod] = useState<PeriodState>(INITIAL_PERIOD);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const fetchStats = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/admin/stats?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const applyPreset = (key: Exclude<PresetKey, "custom">) => {
    const { from, to } = presetRange(key);
    setPeriod({ preset: key, from, to });
    setPickerOpen(false);
    fetchStats(from, to);
  };

  const applyCustom = () => {
    if (!customFrom && !customTo) return;
    setPeriod({ preset: "custom", from: customFrom, to: customTo });
    setPickerOpen(false);
    fetchStats(customFrom, customTo);
  };

  const openPicker = () => {
    setCustomFrom(period.preset === "custom" ? period.from : "");
    setCustomTo(period.preset === "custom" ? period.to : "");
    setPickerOpen(true);
  };

  const handleExclude = async (name: string) => {
    if (excluding) return;
    setExcluding(name);
    try {
      await fetch("/api/admin/ingredients/exclude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      // Ricarica i dati del periodo corrente per riflettere l'esclusione
      await fetchStats(period.from, period.to);
    } finally {
      setExcluding(null);
    }
  };

  const periodActive = period.preset !== "all";
  const emptyPeriodSuffix = periodActive ? " in questo periodo" : "";

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      {/* Header: titolo + controlli (periodo + scelta grafico) */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-5 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-orange-400 to-rose-500" />
          <h2 className="truncate text-base font-bold text-gray-800">
            {CHART_OPTIONS.find((o) => o.key === active)?.label}
          </h2>
        </div>

        <div className="relative flex items-center gap-2">
          {/* Period picker */}
          <div>
            <button
              onClick={openPicker}
              aria-label="Scegli il periodo"
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors ${
                periodActive
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <CalendarDays size={13} className="shrink-0" />
              <span className="max-w-[7.5rem] truncate">{periodLabel(period)}</span>
              <ChevronDown size={12} className="shrink-0" />
            </button>

            {pickerOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setPickerOpen(false)} />
                <div className="absolute right-0 top-full z-30 mt-2 w-[min(17rem,calc(100vw-2.5rem))] space-y-3 rounded-xl border border-gray-100 bg-white p-3 shadow-xl">
                  {/* Range personalizzato */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Intervallo
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 space-y-1">
                        <span className="block text-[10px] text-gray-400">Da</span>
                        <input
                          type="date"
                          value={customFrom}
                          max={customTo || undefined}
                          onChange={(e) => setCustomFrom(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300/30"
                        />
                      </label>
                      <label className="flex-1 space-y-1">
                        <span className="block text-[10px] text-gray-400">A</span>
                        <input
                          type="date"
                          value={customTo}
                          min={customFrom || undefined}
                          onChange={(e) => setCustomTo(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300/30"
                        />
                      </label>
                    </div>
                    <button
                      onClick={applyCustom}
                      disabled={!customFrom && !customTo}
                      className="w-full rounded-lg bg-gray-900 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Applica intervallo
                    </button>
                  </div>

                  {/* Preset rapidi */}
                  <div className="space-y-1.5 border-t border-gray-100 pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Periodi rapidi
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRESET_OPTIONS.map((o) => {
                        const isActive = period.preset === o.key;
                        return (
                          <button
                            key={o.key}
                            onClick={() => applyPreset(o.key)}
                            className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              isActive
                                ? "border-orange-300 bg-orange-50 text-orange-700"
                                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {o.label}
                            {isActive && <Check size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Scelta grafico */}
          <select
            value={active}
            onChange={(e) => setActive(e.target.value as ChartKey)}
            aria-label="Scegli quale grafico mostrare"
            className="shrink-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300/30"
          >
            {CHART_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={loading ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
        {active === "categories" &&
          (data.topCategories.length === 0 ? (
            <p className="text-sm text-gray-400">Nessuna categoria con ricette associate{emptyPeriodSuffix}.</p>
          ) : (
            <HorizontalBarChart
              data={data.topCategories}
              color="#f97316"
              colors={data.topCategories.map((c) => c.color)}
              unit="ricette"
              yAxisWidth={170}
            />
          ))}

        {active === "tags" &&
          (data.topTags.length === 0 ? (
            <p className="text-sm text-gray-400">Nessun tag con ricette associate{emptyPeriodSuffix}.</p>
          ) : (
            <HorizontalBarChart data={data.topTags} color="#8b5cf6" unit="ricette" yAxisWidth={170} />
          ))}

        {active === "cooked" &&
          (data.topCooked.length === 0 ? (
            <p className="text-sm text-gray-400">Nessuna cottura registrata{emptyPeriodSuffix}.</p>
          ) : (
            <HorizontalBarChart data={data.topCooked} color="#f97316" unit="volte" yAxisWidth={140} />
          ))}

        {active === "ingredients" && (
          <>
            <div className="-mt-1 mb-3 text-right">
              <span className="text-xs text-gray-400">× per escludere</span>
            </div>
            {data.topIngredients.length === 0 ? (
              <p className="text-sm text-gray-400">Nessun ingrediente trovato{emptyPeriodSuffix}.</p>
            ) : (
              <HorizontalBarChart
                data={data.topIngredients}
                color="#6366f1"
                unit="ricette"
                yAxisWidth={190}
                onExclude={handleExclude}
              />
            )}
            {excluding && (
              <p className="mt-2 text-xs text-gray-400">Esclusione di «{excluding}»…</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
