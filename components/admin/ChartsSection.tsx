"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartItem {
  name: string;
  value: number;
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
  unit,
  yAxisWidth = 190,
  onExclude,
}: {
  data: ChartItem[];
  color: string;
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
        />
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}

export default function ChartsSection({
  topCooked,
  topIngredients,
}: {
  topCooked: ChartItem[];
  topIngredients: ChartItem[];
}) {
  const router = useRouter();
  const [excluding, setExcluding] = useState<string | null>(null);

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
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">
          Ricette più cucinate
        </h2>
        {topCooked.length === 0 ? (
          <p className="text-sm text-gray-400">Nessuna ricetta cucinata ancora.</p>
        ) : (
          <HorizontalBarChart data={topCooked} color="#f97316" unit="volte" yAxisWidth={140} />
        )}
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Ingredienti più usati
          </h2>
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
          <p className="mt-2 text-xs text-gray-400">Esclusione di "{excluding}"…</p>
        )}
      </section>
    </div>
  );
}
