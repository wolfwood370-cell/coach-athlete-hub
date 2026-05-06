import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type RangeKey = "1S" | "1M" | "3M" | "6M" | "1A" | "Tutto";
const RANGES: RangeKey[] = ["1S", "1M", "3M", "6M", "1A", "Tutto"];

const HERO_DATA = [
  { label: "Nov", value: 2805 },
  { label: "Dic", value: 2840 },
  { label: "Gen", value: 2870 },
  { label: "Feb", value: 2910 },
  { label: "Mar", value: 2945 },
  { label: "Apr", value: 2978 },
  { label: "Mag", value: 2993 },
];

type Insight = {
  label: string;
  delta: number;
  points: number[];
};

const INSIGHTS: Insight[] = [
  { label: "3 Giorni", delta: -1, points: [10, 12, 11, 13, 9, 12, 10] },
  { label: "1 Settimana", delta: 17, points: [8, 9, 10, 11, 12, 14, 15] },
  { label: "2 Settimane", delta: 42, points: [6, 8, 9, 11, 13, 14, 16] },
  { label: "1 Mese", delta: 88, points: [4, 7, 9, 10, 12, 14, 17] },
  { label: "3 Mesi", delta: 153, points: [3, 5, 8, 10, 12, 15, 18] },
  { label: "6 Mesi", delta: 188, points: [2, 4, 6, 9, 12, 15, 19] },
];

function Sparkline({ points, positive }: { points: number[]; positive: boolean }) {
  const w = 64;
  const h = 24;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const stepX = w / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * stepX;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="w-16 h-6" viewBox={`0 0 ${w} ${h}`}>
      <path
        d={path}
        fill="none"
        stroke={positive ? "#10B981" : "#EF4444"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AthleteTDEEAnalytics() {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("6M");

  const data = useMemo(() => HERO_DATA, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 border-b border-surface-variant/50 shadow-sm bg-white/80 backdrop-blur-xl">
        <div className="flex justify-between items-center w-full px-6 h-16">
          <button
            onClick={() => navigate(-1)}
            className="text-primary"
            aria-label="Indietro"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display font-semibold text-lg text-primary tracking-tight">
            Dispendio Calorico
          </h1>
          <button className="text-primary" aria-label="Academy">
            <GraduationCap className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6 max-w-3xl mx-auto pb-32">
        {/* Hero Metrics */}
        <section className="flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
            MEDIA ATTUALE
          </span>
          <div className="font-display text-5xl font-extrabold text-primary">
            2993 <span className="text-2xl font-bold">kcal</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs">+188 kcal</span>
          </div>
          <p className="text-xs text-outline mt-2">2 Nov 2025 - 1 Mag 2026</p>
        </section>

        {/* Time Filters */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-6 px-6">
          {RANGES.map((r) => {
            const active = r === range;
            return (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={
                  active
                    ? "px-5 py-2 rounded-full font-semibold text-sm bg-primary text-white shadow-sm transition-all whitespace-nowrap"
                    : "px-5 py-2 rounded-full font-semibold text-sm bg-surface-container text-on-surface-variant transition-all hover:bg-surface-variant whitespace-nowrap"
                }
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* Hero Chart */}
        <div className="w-full h-64 bg-white rounded-2xl relative overflow-hidden border border-surface-variant/50 shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="tdeeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={40}
                domain={["dataMin - 50", "dataMax + 50"]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v} kcal`, "TDEE"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#tdeeFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Insights List */}
        <section>
          <h2 className="font-display text-xl font-bold text-primary mb-4">
            Cambiamenti Dispendio
          </h2>
          <div className="space-y-3">
            {INSIGHTS.map((row) => {
              const positive = row.delta >= 0;
              return (
                <div
                  key={row.label}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-surface-variant/50 shadow-sm"
                >
                  <span className="font-semibold text-sm text-on-surface-variant">
                    {row.label}
                  </span>
                  <div className="flex items-center gap-4">
                    <Sparkline points={row.points} positive={positive} />
                    <span
                      className={`font-bold text-sm w-16 text-right ${
                        positive ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {row.delta} kcal
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
