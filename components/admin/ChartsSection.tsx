"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

type ChartKey = "categories" | "cooked" | "ingredients";

const CHART_OPTIONS: { key: ChartKey; label: string }[] = [
  { key: "categories", label: "Ricette per categoria" },
  { key: "cooked", label: "Ricette più cucinate" },
  { key: "ingredients", label: "Ingredienti più usati" },
];

export default function ChartsSection({
  topCategories,
  topCooked,
  topIngredients,
}: {
  topCategories: CategoryItem[];
  topCooked: ChartItem[];
  topIngredients: ChartItem[];
}) {
  const router = useRouter();
  const [excluding, setExcluding] = useState<string | null>(null);
  const [active, setActive] = useState<ChartKey>("categories");

  const handleExclude = async (name: string) => {
    if (excluding) return;
    setExcluding(name);
    try {
      await fetch("/api/admin/ingredients/exclude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      router.refresh();
    } finally {
      setExcluding(null);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      {/* Header: titolo dinamico + select in alto a destra */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-5 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-orange-400 to-rose-500" />
          <h2 className="truncate text-base font-bold text-gray-800">
            {CHART_OPTIONS.find((o) => o.key === active)?.label}
          </h2>
        </div>
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

      {active === "categories" &&
        (topCategories.length === 0 ? (
          <p className="text-sm text-gray-400">Nessuna categoria con ricette associate.</p>
        ) : (
          <HorizontalBarChart
            data={topCategories}
            color="#f97316"
            colors={topCategories.map((c) => c.color)}
            unit="ricette"
            yAxisWidth={170}
          />
        ))}

      {active === "cooked" &&
        (topCooked.length === 0 ? (
          <p className="text-sm text-gray-400">Nessuna ricetta cucinata ancora.</p>
        ) : (
          <HorizontalBarChart data={topCooked} color="#f97316" unit="volte" yAxisWidth={140} />
        ))}

      {active === "ingredients" && (
        <>
          <div className="-mt-1 mb-3 text-right">
            <span className="text-xs text-gray-400">× per escludere</span>
          </div>
          {topIngredients.length === 0 ? (
            <p className="text-sm text-gray-400">Nessun ingrediente trovato.</p>
          ) : (
            <HorizontalBarChart
              data={topIngredients}
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
    </section>
  );
}
