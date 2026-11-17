"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, CalendarDays } from "lucide-react";
import { Panel } from "@/components/ds/Panel";
import { Field, Select, TextInput } from "@/components/ds/Field";
import { Segmented } from "@/components/ds/Controls";
import { Button, IconButton } from "@/components/ds/Button";
import { Modal } from "@/components/ui/Modal";
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

/** Colori dei grafici (token del restyle; Recharts vuole valori, non classi) */
const CHART_COLOR = {
  recipes: "oklch(52% 0.091 228)", // blu-700
  tags: "oklch(58% 0.12 70)", // area vocabolario
  ingredients: "oklch(55% 0.11 135)", // area ingredienti
  text: "oklch(25% 0.038 228)", // blu-950
  muted: "oklch(51% 0.038 226)", // grigio
  line: "oklch(91% 0.021 224)", // blu-150
  hover: "oklch(98% 0.006 224)", // blu-50
};

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
        fill={CHART_COLOR.text}
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
          <circle cx={0} cy={6} r={8} fill="oklch(95% 0.03 6)" stroke="oklch(85% 0.08 6)" strokeWidth={1} />
          <text
            x={0}
            y={6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={700}
            fill="oklch(53.9% 0.193 6.5)"
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
  // Su telefono la colonna dei nomi non deve mangiarsi le barre: al massimo ~40% della larghezza
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState(0);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBoxWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const yWidth = boxWidth ? Math.min(yAxisWidth, Math.round(boxWidth * 0.4)) : yAxisWidth;
  const maxChars = Math.max(10, Math.floor((yWidth - (onExclude ? 24 : 8)) / 6.6));

  return (
    <div ref={boxRef} className="[&_*:focus]:outline-none [&_svg:focus]:outline-none">
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
          tick={{ fontSize: 11, fill: CHART_COLOR.muted }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={yWidth}
          axisLine={false}
          tickLine={false}
          tick={(props) => (
            <YAxisTick {...props} onExclude={onExclude} maxChars={maxChars} />
          )}
        />
        <Tooltip
          cursor={{ fill: CHART_COLOR.hover }}
          formatter={(val) =>
            unit ? [`${val ?? 0} ${unit}`, ""] : [val ?? 0, ""]
          }
          contentStyle={{
            borderRadius: "10px",
            border: `1px solid ${CHART_COLOR.line}`,
            fontSize: 12,
          }}
          labelStyle={{ fontWeight: 700, color: CHART_COLOR.text }}
        />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          fill={color}
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
  { key: "month", label: "Mese" },
  { key: "3months", label: "3 mesi" },
  { key: "year", label: "Anno" },
  { key: "all", label: "Tutto" },
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

export interface ChartsData {
  topCategories: CategoryItem[];
  topTags: ChartItem[];
  topCooked: ChartItem[];
  topIngredients: ChartItem[];
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
  const empty = (text: string) => <p className="py-6 text-center text-grigio">{text}{emptyPeriodSuffix}.</p>;

  return (
    <Panel
      title="Statistiche"
      icon={<BarChart3 />}
      meta={period.preset === "custom" ? periodLabel(period) : undefined}
    >
      {/* 13.3 · scelta del grafico e del periodo */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={active}
          onChange={(e) => setActive(e.target.value as ChartKey)}
          aria-label="Scegli quale grafico mostrare"
          className="min-w-[12rem] flex-1"
        >
          {CHART_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </Select>
        <div className="flex flex-1 items-center gap-2">
          <Segmented
            label="Periodo"
            value={period.preset === "custom" ? ("custom" as PresetKey) : period.preset}
            onChange={(k) => k !== "custom" && applyPreset(k)}
            options={PRESET_OPTIONS.map((o) => ({ value: o.key as PresetKey, label: o.label }))}
            className="min-w-0 flex-1"
          />
          <IconButton label="Intervallo di date" size="md" shape="square" active={period.preset === "custom"} onClick={openPicker}>
            <CalendarDays />
          </IconButton>
        </div>
      </div>

      <div className={loading ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
        {active === "categories" &&
          (data.topCategories.length === 0 ? (
            empty("Nessuna categoria con ricette associate")
          ) : (
            <HorizontalBarChart
              data={data.topCategories}
              color={CHART_COLOR.recipes}
              colors={data.topCategories.map((c) => c.color)}
              unit="ricette"
              yAxisWidth={170}
            />
          ))}

        {active === "tags" &&
          (data.topTags.length === 0 ? empty("Nessun tag con ricette associate") : <HorizontalBarChart data={data.topTags} color={CHART_COLOR.tags} unit="ricette" yAxisWidth={170} />)}

        {active === "cooked" &&
          (data.topCooked.length === 0 ? empty("Nessuna cottura registrata") : <HorizontalBarChart data={data.topCooked} color={CHART_COLOR.recipes} unit="volte" yAxisWidth={140} />)}

        {active === "ingredients" && (
          <>
            <p className="mb-2 text-right text-(length:--fs-meta) text-grigio">Tocca × per togliere un ingrediente dalle statistiche</p>
            {data.topIngredients.length === 0 ? (
              empty("Nessun ingrediente trovato")
            ) : (
              <HorizontalBarChart data={data.topIngredients} color={CHART_COLOR.ingredients} unit="ricette" yAxisWidth={190} onExclude={handleExclude} />
            )}
            {excluding && <p className="mt-2 text-(length:--fs-meta) text-grigio">Esclusione di «{excluding}»…</p>}
          </>
        )}
      </div>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Intervallo di date" size="sm">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Dal">
              {(p) => <TextInput {...p} type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} />}
            </Field>
            <Field label="Al">
              {(p) => <TextInput {...p} type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} />}
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPickerOpen(false)}>
              Annulla
            </Button>
            <Button onClick={applyCustom} disabled={!customFrom && !customTo}>
              Applica
            </Button>
          </div>
        </div>
      </Modal>
    </Panel>
  );
}
