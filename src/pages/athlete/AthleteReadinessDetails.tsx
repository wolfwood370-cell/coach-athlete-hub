import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, Info, SlidersHorizontal } from "lucide-react";

type Factor = {
  title: string;
  score: number;
  subtext: string;
  tone: "emerald" | "amber";
  highlight?: boolean;
};

const FACTORS: Factor[] = [
  {
    title: "Qualità del Sonno",
    score: 90,
    subtext: "7h 45m dormite • Alta % di sonno profondo",
    tone: "emerald",
  },
  {
    title: "Recupero Neurale (HRV)",
    score: 82,
    subtext: "Variabilità cardiaca nella tua baseline superiore.",
    tone: "emerald",
  },
  {
    title: "DOMS & Affaticamento",
    score: 75,
    subtext: "Leggero indolenzimento riportato ai femorali.",
    tone: "amber",
    highlight: true,
  },
  {
    title: "Stress Percepito",
    score: 95,
    subtext: "Livelli di cortisolo stimati ottimali per la performance.",
    tone: "emerald",
  },
];

export default function AthleteReadinessDetails() {
  const navigate = useNavigate();
  const score = 85;
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-surface-variant/30 shadow-sm">
        <div className="flex justify-between items-center w-full px-6 py-4 h-16">
          <button
            onClick={() => navigate(-1)}
            className="text-primary"
            aria-label="Indietro"
          >
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
        {/* Hero Metric */}
        <section className="flex flex-col items-center text-center">
          <div className="relative w-48 h-48 flex items-center justify-center mb-6">
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 192 192"
            >
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
                stroke="#10B981"
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
          <h2 className="font-display text-2xl font-bold text-emerald-500 mb-2">
            Ottima
          </h2>
          <p className="text-secondary text-sm max-w-[280px]">
            Sistema nervoso e muscolare pienamente recuperati.
          </p>
        </section>

        {/* Factors */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-bold text-primary">
              Fattori di Prontezza
            </h3>
            <Info className="size-4 text-secondary" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {FACTORS.map((f) => {
              const toneClass =
                f.tone === "emerald" ? "text-emerald-500" : "text-amber-500";
              const highlight = f.highlight ? "border-l-4 border-l-amber-500" : "";
              return (
                <div
                  key={f.title}
                  className={`bg-white/70 backdrop-blur-xl border border-surface-variant/50 rounded-xl p-6 flex flex-col transition-all hover:-translate-y-0.5 shadow-sm ${highlight}`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-primary text-sm">{f.title}</h4>
                    <span className={`font-bold ${toneClass}`}>
                      {f.score}/100
                    </span>
                  </div>
                  <p className="text-sm text-secondary mt-2">{f.subtext}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Coaching Context */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-bold text-primary">
              Contesto del Coach
            </h3>
            <SlidersHorizontal className="size-4 text-secondary" />
          </div>
          <div className="bg-white/70 backdrop-blur-xl border border-surface-variant/50 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-secondary leading-relaxed">
              Sei in una fase ottimale per affrontare un workout ad alta intensità.
              Mantieni il focus su tecnica e progressione del carico — il tuo
              sistema nervoso è pronto a esprimere il massimo potenziale.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
