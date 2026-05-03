import { ChevronLeft, SlidersHorizontal } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface FactorScore {
  key: string;
  label: string;
  value: number;
}

interface ReadinessDetails {
  overall: number;
  status: string;
  factors: FactorScore[];
  trend: { day: string; score: number }[];
}

const mockReadinessDetails: ReadinessDetails = {
  overall: 82,
  status: "Optimal",
  factors: [
    { key: "sleep", label: "Sleep", value: 8.5 },
    { key: "energy", label: "Energy", value: 7.0 },
    { key: "soreness", label: "Soreness", value: 9.0 },
    { key: "stress", label: "Stress", value: 6.0 },
    { key: "mood", label: "Mood", value: 8.0 },
    { key: "digestion", label: "Digestion", value: 9.5 },
  ],
  trend: [
    { day: "W", score: 65 },
    { day: "T", score: 64 },
    { day: "F", score: 70 },
    { day: "S", score: 74 },
    { day: "S", score: 76 },
    { day: "T", score: 82 },
  ],
};

interface ReadinessAnalysisDetailProps {
  onBack?: () => void;
  data?: ReadinessDetails;
}

function OverallScoreCard({ overall, status }: { overall: number; status: string }) {
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (overall / 100) * circumference;

  return (
    <section className="rounded-3xl bg-card border border-border p-6 shadow-sm flex flex-col items-center">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="hsl(var(--primary) / 0.2)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-extrabold text-foreground"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            {overall}
          </span>
          <span className="text-xs font-semibold tracking-[0.2em] text-foreground/60 mt-1 uppercase">
            {status}
          </span>
        </div>
      </div>

      <button className="mt-6 w-full rounded-full bg-primary text-primary-foreground py-4 font-semibold text-sm tracking-wider uppercase shadow-md shadow-primary/30 hover:bg-primary/90 active:scale-[0.99] transition">
        Log Today's Readiness
      </button>
    </section>
  );
}

function MetricBreakdownList({ factors }: { factors: FactorScore[] }) {
  return (
    <section className="rounded-3xl bg-card border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-xl font-bold text-foreground"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          Today's Factors
        </h2>
        <button
          className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors text-foreground/60"
          aria-label="Filtra"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3.5">
        {factors.map((f) => {
          const pct = (f.value / 10) * 100;
          return (
            <div key={f.key} className="grid grid-cols-[80px_1fr_40px] items-center gap-3">
              <span className="text-sm text-foreground/80">{f.label}</span>
              <div className="h-1.5 w-full rounded-full bg-primary/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className="text-sm font-semibold text-foreground text-right tabular-nums"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {f.value.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TrendCard({ trend }: { trend: { day: string; score: number }[] }) {
  return (
    <section className="rounded-3xl bg-card border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-xl font-bold text-foreground"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          7-Day Trend
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider uppercase text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Score
        </span>
      </div>

      <div className="h-48 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--card))", stroke: "hsl(var(--primary))", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function ReadinessAnalysisDetail({
  onBack,
  data = mockReadinessDetails,
}: ReadinessAnalysisDetailProps) {
  return (
    <div
      className="min-h-screen bg-background pb-24"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Indietro"
          >
            <ChevronLeft className="h-6 w-6 text-primary" />
          </button>
          <h1
            className="flex-1 text-center text-lg font-bold text-foreground pr-8"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Readiness Analysis
          </h1>
        </div>
      </header>

      <main className="px-4 pt-5 space-y-5">
        <OverallScoreCard overall={data.overall} status={data.status} />
        <MetricBreakdownList factors={data.factors} />
        <TrendCard trend={data.trend} />
      </main>
    </div>
  );
}
