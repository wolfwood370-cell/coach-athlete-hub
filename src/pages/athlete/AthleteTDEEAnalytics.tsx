import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { format, subDays } from "date-fns";
import { it } from "date-fns/locale";
import { useAdaptiveTDEE } from "@/hooks/useAdaptiveTDEE";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type RangeKey = "1S" | "1M" | "3M" | "6M" | "1A" | "Tutto";
const RANGES: { key: RangeKey; days: number }[] = [
  { key: "1S", days: 7 },
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "6M", days: 180 },
  { key: "1A", days: 365 },
  { key: "Tutto", days: 9999 },
];

const INSIGHT_WINDOWS: { label: string; days: number }[] = [
  { label: "3 Giorni", days: 3 },
  { label: "1 Settimana", days: 7 },
  { label: "2 Settimane", days: 14 },
  { label: "1 Mese", days: 30 },
  { label: "3 Mesi", days: 90 },
  { label: "6 Mesi", days: 180 },
];

function Sparkline({ points, positive }: { points: number[]; positive: boolean }) {
  const w = 64;
  const h = 24;
  if (points.length < 2) {
    return <svg width={w} height={h} className="w-16 h-6" />;
  }
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
  const { user } = useAuth();
  const [range, setRange] = useState<RangeKey>("6M");

  const tdee = useAdaptiveTDEE(user?.id, "maintain");

  const currentTDEE = tdee.estimatedTDEE ?? 0;
  const days = RANGES.find((r) => r.key === range)?.days ?? 180;

  // Build series from weightData (proxy for TDEE trend over time)
  const chartData = useMemo(() => {
    const series = (tdee.weightData ?? []).filter(
      (d) => d.trendWeight && d.trendWeight > 0,
    );
    if (series.length === 0) return [];
    // estimate TDEE-equivalent line by scaling smoothed weight trend onto current TDEE
    const lastTrend = series[series.length - 1].trendWeight;
    const scale = currentTDEE && lastTrend ? currentTDEE / lastTrend : 1;
    const filtered = series.slice(-days);
    return filtered.map((d) => ({
      date: d.date,
      label: format(new Date(d.date), "MMM", { locale: it }),
      value: Math.round(d.trendWeight * scale),
    }));
  }, [tdee.weightData, currentTDEE, days]);

  // Trend delta = current vs first point in selected range
  const trendDelta = useMemo(() => {
    if (chartData.length < 2) return 0;
    return chartData[chartData.length - 1].value - chartData[0].value;
  }, [chartData]);

  // Date range label
  const dateLabel = useMemo(() => {
    if (chartData.length === 0) return "—";
    const start = chartData[0].date;
    const end = chartData[chartData.length - 1].date;
    return `${format(new Date(start), "d MMM yyyy", { locale: it })} - ${format(
      new Date(end),
      "d MMM yyyy",
      { locale: it },
    )}`;
  }, [chartData]);

  // Insights: derive from chartData by computing change over each window
  const insights = useMemo(() => {
    return INSIGHT_WINDOWS.map((w) => {
      const slice = chartData.slice(-w.days);
      const points = slice.map((s) => s.value);
      const delta =
        points.length >= 2 ? points[points.length - 1] - points[0] : 0;
      return { label: w.label, delta, points };
    });
  }, [chartData]);

  const isLoading = tdee.estimatedTDEE === null && tdee.daysWithWeight === 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-surface-variant/50 shadow-sm bg-white/80 backdrop-blur-xl">
        <div className="flex justify-between items-center w-full px-6 h-16">
          <button onClick={() => navigate(-1)} className="text-primary" aria-label="Indietro">
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
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <section className="flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                MEDIA ATTUALE
              </span>
              <div className="font-display text-5xl font-extrabold text-primary">
                {currentTDEE > 0 ? currentTDEE : "—"}{" "}
                <span className="text-2xl font-bold">kcal</span>
              </div>
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                  trendDelta >= 0
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-rose-600 bg-rose-50"
                }`}
              >
                {trendDelta >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span className="font-semibold text-xs">
                  {trendDelta >= 0 ? "+" : ""}
                  {trendDelta} kcal
                </span>
              </div>
              <p className="text-xs text-outline mt-2">{dateLabel}</p>
            </section>

            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-6 px-6">
              {RANGES.map((r) => {
                const active = r.key === range;
                return (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    className={
                      active
                        ? "px-5 py-2 rounded-full font-semibold text-sm bg-primary text-white shadow-sm transition-all whitespace-nowrap"
                        : "px-5 py-2 rounded-full font-semibold text-sm bg-surface-container text-on-surface-variant transition-all hover:bg-surface-variant whitespace-nowrap"
                    }
                  >
                    {r.key}
                  </button>
                );
              })}
            </div>

            <div className="w-full h-64 bg-white rounded-2xl relative overflow-hidden border border-surface-variant/50 shadow-sm">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-outline px-6 text-center">
                  Servono almeno due settimane di dati di peso e calorie per calcolare il tuo TDEE.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
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
              )}
            </div>

            <section>
              <h2 className="font-display text-xl font-bold text-primary mb-4">
                Cambiamenti Dispendio
              </h2>
              <div className="space-y-3">
                {insights.map((row) => {
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
          </>
        )}
      </main>
    </div>
  );
}
