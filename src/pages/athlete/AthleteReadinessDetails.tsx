import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, Info, SlidersHorizontal } from "lucide-react";
import { useReadiness } from "@/hooks/useReadiness";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type Tone = "emerald" | "amber" | "rose";

interface FactorView {
  title: string;
  score: number;
  subtext: string;
  tone: Tone;
  highlight?: boolean;
}

function toneClass(tone: Tone): string {
  if (tone === "emerald") return "text-emerald-500";
  if (tone === "amber") return "text-amber-500";
  return "text-rose-500";
}

function statusFromScore(score: number): { label: string; tone: Tone; description: string } {
  if (score >= 75)
    return {
      label: "Ottima",
      tone: "emerald",
      description: "Sistema nervoso e muscolare pienamente recuperati.",
    };
  if (score >= 50)
    return {
      label: "Moderata",
      tone: "amber",
      description: "Recupero parziale. Modula intensità e volume con criterio.",
    };
  return {
    label: "Bassa",
    tone: "rose",
    description: "Recupero insufficiente. Considera una sessione tecnica o riposo.",
  };
}

export default function AthleteReadinessDetails() {
  const navigate = useNavigate();
  const { readiness, isLoading, calculateReadiness } = useReadiness();

  const result = useMemo(() => calculateReadiness(readiness), [calculateReadiness, readiness]);
  const score = Math.round(result?.score ?? 0);
  const status = statusFromScore(score);

  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  // Factor mapping derived from real readiness data
  const factors: FactorView[] = useMemo(() => {
    const sleepHours = Number(readiness.sleepHours ?? 0);
    const sleepScore = Math.max(
      0,
      Math.min(100, Math.round((sleepHours / 8) * 100)),
    );
    const sleepTone: Tone = sleepScore >= 75 ? "emerald" : sleepScore >= 50 ? "amber" : "rose";

    const hrv = readiness.hrvRmssd;
    const hrvComp = result?.breakdown?.hrvComponent ?? 0;
    const hrvScore = Math.round((hrvComp / 60) * 100);
    const hrvTone: Tone = hrvScore >= 75 ? "emerald" : hrvScore >= 50 ? "amber" : "rose";

    // DOMS / soreness aggregation: 0 (none) → 3 (severe) per zone
    const sorenessValues = Object.values(readiness.sorenessMap ?? {});
    const maxSoreness = sorenessValues.length ? Math.max(...sorenessValues) : 0;
    const avgSoreness = sorenessValues.length
      ? sorenessValues.reduce((a, b) => a + b, 0) / sorenessValues.length
      : 0;
    const domsScore = Math.round(100 - (avgSoreness / 3) * 100);
    const domsTone: Tone = domsScore >= 75 ? "emerald" : domsScore >= 50 ? "amber" : "rose";
    const domsHighlight = maxSoreness >= 2;

    const stressLevel = Number(readiness.stress ?? 5);
    const stressScore = Math.max(0, Math.min(100, Math.round((10 - stressLevel) * 10)));
    const stressTone: Tone = stressScore >= 75 ? "emerald" : stressScore >= 50 ? "amber" : "rose";

    return [
      {
        title: "Qualità del Sonno",
        score: sleepScore,
        subtext: sleepHours
          ? `${sleepHours.toFixed(1)}h dormite • Qualità ${readiness.sleepQuality}/10`
          : "Nessun dato di sonno registrato.",
        tone: sleepTone,
      },
      {
        title: "Recupero Neurale (HRV)",
        score: hrvScore,
        subtext:
          hrv !== null && hrv !== undefined
            ? `HRV ${hrv} ms — ${result?.hrvStatus === "optimal" ? "in baseline" : "sotto baseline"}`
            : "Nessuna lettura HRV oggi. Aggiungi un wearable per dati oggettivi.",
        tone: hrvTone,
      },
      {
        title: "DOMS & Affaticamento",
        score: domsScore,
        subtext: sorenessValues.length
          ? `Indolenzimento medio ${avgSoreness.toFixed(1)}/3 su ${sorenessValues.length} zone.`
          : "Nessuna zona dolente segnalata.",
        tone: domsTone,
        highlight: domsHighlight,
      },
      {
        title: "Stress Percepito",
        score: stressScore,
        subtext: `Livello soggettivo ${stressLevel}/10 — ${result?.reason ?? "stato stabile"}.`,
        tone: stressTone,
      },
    ];
  }, [readiness, result]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-surface-variant/30 shadow-sm">
        <div className="flex justify-between items-center w-full px-6 py-4 h-16">
          <button onClick={() => navigate(-1)} className="text-primary" aria-label="Indietro">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display font-semibold tracking-tight text-lg text-primary">
            Analisi Prontezza
          </h1>
          <button className="text-primary" aria-label="Storico">
            <History className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-grow px-6 pt-8 pb-32 max-w-lg mx-auto w-full space-y-10">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <section className="flex flex-col items-center text-center">
              <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 192 192">
                  <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    fill="none"
                    strokeWidth="12"
                    className="stroke-surface-container"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    fill="none"
                    strokeWidth="12"
                    strokeLinecap="round"
                    stroke={
                      status.tone === "emerald"
                        ? "#10B981"
                        : status.tone === "amber"
                        ? "#F59E0B"
                        : "#F43F5E"
                    }
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="font-display text-6xl text-primary font-bold leading-none">
                    {score}
                  </span>
                  <span className="font-label-sm text-[10px] uppercase tracking-widest text-secondary mt-1">
                    SCORE
                  </span>
                </div>
              </div>
              <h2 className={`font-display text-2xl font-bold mb-2 ${toneClass(status.tone)}`}>
                {status.label}
              </h2>
              <p className="text-secondary text-sm max-w-[280px]">{status.description}</p>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl font-bold text-primary">
                  Fattori di Prontezza
                </h3>
                <Info className="size-4 text-secondary" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {factors.map((f) => {
                  const highlight = f.highlight ? "border-l-4 border-l-amber-500" : "";
                  return (
                    <div
                      key={f.title}
                      className={`bg-white/70 backdrop-blur-xl border border-surface-variant/50 rounded-xl p-6 flex flex-col transition-all hover:-translate-y-0.5 shadow-sm ${highlight}`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-primary text-sm">{f.title}</h4>
                        <span className={`font-bold ${toneClass(f.tone)}`}>{f.score}/100</span>
                      </div>
                      <p className="text-sm text-secondary mt-2">{f.subtext}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl font-bold text-primary">
                  Contesto del Coach
                </h3>
                <SlidersHorizontal className="size-4 text-secondary" />
              </div>
              <div className="bg-white/70 backdrop-blur-xl border border-surface-variant/50 rounded-xl p-6 shadow-sm">
                <p className="text-sm text-secondary leading-relaxed">
                  {result?.reason ??
                    "Stato di prontezza valutato sulla base dei dati soggettivi e oggettivi disponibili."}
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
