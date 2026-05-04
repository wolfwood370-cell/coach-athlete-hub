import { useNavigate } from "react-router-dom";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";

interface Factor {
  label: string;
  value: number; // 0-10
}

const FACTORS: Factor[] = [
  { label: "Sonno", value: 8.5 },
  { label: "Energia", value: 7.0 },
  { label: "Dolori", value: 9.0 },
  { label: "Stress", value: 6.0 },
  { label: "Umore", value: 8.0 },
  { label: "Digestione", value: 9.5 },
];

const TREND: { day: string; score: number }[] = [
  { day: "L", score: 68 },
  { day: "M", score: 72 },
  { day: "M", score: 65 },
  { day: "G", score: 78 },
  { day: "V", score: 74 },
  { day: "S", score: 80 },
  { day: "D", score: 82 },
];

const SCORE = 82;

export default function AthleteReadinessDetails() {
  const navigate = useNavigate();

  // Score ring math
  const ringSize = 200;
  const ringStroke = 14;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - SCORE / 100);

  // Trend chart math
  const chartWidth = 320;
  const chartHeight = 140;
  const padX = 16;
  const padY = 20;
  const innerW = chartWidth - padX * 2;
  const innerH = chartHeight - padY * 2;
  const maxScore = 100;
  const points = TREND.map((d, i) => {
    const x = padX + (i * innerW) / (TREND.length - 1);
    const y = padY + innerH - (d.score / maxScore) * innerH;
    return { x, y };
  });

  // Smooth spline path (Catmull-Rom -> Bezier)
  const splinePath = (() => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  })();

  const areaPath = `${splinePath} L ${points[points.length - 1].x} ${chartHeight - padY} L ${points[0].x} ${chartHeight - padY} Z`;

  return (
    <div className="min-h-screen bg-background text-on-background font-sans">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-4 h-16 bg-white/80 backdrop-blur-xl border-b border-surface-variant">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Indietro"
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-variant/40 transition-colors text-on-surface"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center font-display text-lg font-bold text-on-surface pr-8">
          Analisi Prontezza
        </h1>
      </header>

      <main className="pt-24 pb-12 px-6 space-y-6 max-w-2xl mx-auto">
        {/* Hero Section */}
        <section className="bg-white/[0.6] backdrop-blur-md border border-outline-variant/30 rounded-3xl p-8 flex flex-col items-center relative overflow-hidden">
          <div className="relative" style={{ width: ringSize, height: ringSize }}>
            <svg
              width={ringSize}
              height={ringSize}
              viewBox={`0 0 ${ringSize} ${ringSize}`}
              className="-rotate-90"
            >
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="transparent"
                strokeWidth={ringStroke}
                className="stroke-surface-variant"
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="transparent"
                strokeWidth={ringStroke}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                className="stroke-primary-container transition-[stroke-dashoffset] duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-5xl font-bold text-on-surface leading-none">
                {SCORE}
              </span>
              <span className="mt-2 text-[10px] tracking-widest uppercase text-outline font-semibold">
                Ottimale
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-full bg-primary-container text-white rounded-full py-4 font-semibold text-sm uppercase tracking-wide mt-6 hover:opacity-90 transition-opacity"
          >
            Registra Prontezza
          </button>
        </section>

        {/* Factors */}
        <section className="bg-white/[0.6] backdrop-blur-md border border-outline-variant/30 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold text-on-surface">
              Fattori di Oggi
            </h2>
            <SlidersHorizontal className="w-5 h-5 text-on-surface-variant" />
          </div>

          <ul className="space-y-4">
            {FACTORS.map((f) => {
              const pct = Math.max(0, Math.min(100, (f.value / 10) * 100));
              return (
                <li key={f.label} className="flex items-center">
                  <span className="w-24 text-xs font-semibold text-on-surface-variant">
                    {f.label}
                  </span>
                  <div className="flex-1 h-1.5 bg-surface-variant rounded-full mx-4 overflow-hidden">
                    <div
                      className="bg-primary-container h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-on-surface">
                    {f.value.toFixed(1)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Trend */}
        <section className="bg-white/[0.6] backdrop-blur-md border border-outline-variant/30 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold text-on-surface">
              Trend 7 Giorni
            </h2>
            <span className="bg-surface-variant/50 rounded-full px-3 py-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant">
                Punteggio
              </span>
            </span>
          </div>

          <div className="w-full">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    className="[stop-color:hsl(var(--primary-container))]"
                    stopOpacity="0.35"
                  />
                  <stop
                    offset="100%"
                    className="[stop-color:hsl(var(--primary-container))]"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              <path d={areaPath} fill="url(#trendArea)" />
              <path
                d={splinePath}
                fill="none"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-primary-container"
              />

              {points.map((p, i) => {
                const isLast = i === points.length - 1;
                return (
                  <g key={i}>
                    {isLast && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={7}
                        className="fill-primary-container"
                        opacity={0.2}
                      />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isLast ? 4.5 : 3}
                      className="fill-white stroke-primary-container"
                      strokeWidth={2}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="flex justify-between mt-3 px-1">
              {TREND.map((d, i) => {
                const isCurrent = i === TREND.length - 1;
                return (
                  <span
                    key={i}
                    className={
                      isCurrent
                        ? "text-[10px] uppercase font-bold text-primary-container"
                        : "text-[10px] uppercase font-semibold text-outline"
                    }
                  >
                    {d.day}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
