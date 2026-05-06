import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowRight,
  Info,
  Minus,
  TrendingDown,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type GoalKey = "lose" | "maintain" | "gain";

interface GoalOption {
  key: GoalKey;
  label: string;
  Icon: LucideIcon;
}

const GOALS: GoalOption[] = [
  { key: "lose", label: "Perdere Peso", Icon: TrendingDown },
  { key: "maintain", label: "Mantenere", Icon: Minus },
  { key: "gain", label: "Aumentare", Icon: TrendingUp },
];

const CURRENT_WEIGHT = 90;

export default function NutritionWizardStep1() {
  const [goal, setGoal] = useState<GoalKey>("lose");
  const [targetWeight, setTargetWeight] = useState<string>("82.0");
  const [rate, setRate] = useState<number>(25); // 0..100
  const trackRef = useRef<HTMLDivElement>(null);

  const feedback = useMemo(() => {
    // Map slider 0..100 to a percentage of body weight per week 0.1% .. 1.2%
    const pct = 0.1 + (rate / 100) * 1.1;
    const direction = goal === "gain" ? 1 : goal === "lose" ? -1 : 0;
    const kgPerWeek = (CURRENT_WEIGHT * pct) / 100;
    const signedPct = (direction * pct).toFixed(1);
    const headline =
      goal === "maintain"
        ? "Mantenimento del peso corporeo"
        : `${direction > 0 ? "+" : "-"}${pct.toFixed(1)}% del peso corporeo / sett.`;
    const body =
      goal === "maintain"
        ? "Stabilità calorica per consolidare composizione e performance."
        : goal === "gain"
          ? `Aumento di circa ${kgPerWeek.toFixed(2)} kg a settimana. Rateo ottimale per minimizzare l'accumulo di massa grassa.`
          : `Perdita di circa ${kgPerWeek.toFixed(2)} kg a settimana. È il rateo ottimale per preservare la massa muscolare.`;
    return { headline, body, signedPct };
  }, [rate, goal]);

  const updateRateFromPointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    setRate(Math.round(clamped * 100));
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    updateRateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    updateRateFromPointer(e.clientX);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-surface-variant/30 shadow-sm flex justify-between items-center px-6 py-4">
        <button
          type="button"
          className="text-primary hover:opacity-80 transition-opacity"
          aria-label="Chiudi wizard"
        >
          <X className="h-6 w-6" strokeWidth={2} />
        </button>
        <div className="flex space-x-2 w-full max-w-[200px] mx-4" aria-label="Avanzamento wizard">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i === 0 ? "bg-primary" : "bg-surface-container",
              )}
              aria-hidden
            />
          ))}
        </div>
        <button
          type="button"
          className="text-[10px] text-primary uppercase tracking-widest font-bold hover:opacity-80 transition-opacity"
        >
          Salta
        </button>
      </header>

      <main className="flex-1 px-6 max-w-lg mx-auto w-full flex flex-col gap-8 pt-20 pb-32">
        {/* Goal Selector */}
        <section>
          <h2 className="font-display text-2xl font-bold text-on-surface mb-4">
            Qual è il tuo obiettivo?
          </h2>
          <div className="flex flex-col gap-3">
            {GOALS.map(({ key, label, Icon }) => {
              const active = goal === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setGoal(key)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl p-4 flex items-center justify-between cursor-pointer shadow-sm transition-colors text-left",
                    active
                      ? "bg-surface-container-low border-2 border-primary"
                      : "bg-white border border-outline-variant hover:bg-surface-container-low",
                  )}
                >
                  <span
                    className={cn(
                      active
                        ? "font-bold text-on-surface"
                        : "text-on-surface-variant font-medium",
                    )}
                  >
                    {label}
                  </span>
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      active ? "text-primary" : "text-outline",
                    )}
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* Target Weight */}
        <section>
          <h2 className="font-display text-2xl font-bold text-on-surface mb-4">
            Peso Obiettivo
          </h2>
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
              Attuale: {CURRENT_WEIGHT} kg
            </span>
            <div className="flex items-baseline gap-1 border-b-2 border-primary pb-1">
              <input
                type="text"
                inputMode="decimal"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className="w-32 text-center bg-transparent border-none focus:ring-0 text-4xl font-black text-primary p-0 m-0 outline-none"
                aria-label="Peso obiettivo"
              />
              <span className="text-primary font-bold">kg</span>
            </div>
          </div>
        </section>

        {/* Rate Slider */}
        <section>
          <h2 className="font-display text-2xl font-bold text-on-surface mb-4">
            Velocità del programma
          </h2>

          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            className="relative w-full h-3 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full touch-none"
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={rate}
            aria-label="Velocità del programma"
            tabIndex={0}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white border-[3px] border-primary rounded-full shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{ left: `${rate}%` }}
            >
              <span className="w-2 h-2 bg-primary rounded-full" aria-hidden />
            </div>
          </div>
          <div className="text-xs text-on-surface-variant mt-3 px-1 flex justify-between">
            <span>Lenta</span>
            <span>Veloce</span>
          </div>

          {/* Dynamic Feedback */}
          <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2 border border-surface-variant shadow-sm mt-6">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary shrink-0" strokeWidth={2} aria-hidden />
              <span className="font-bold text-sm text-on-surface">
                {feedback.headline}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant pl-7">
              {feedback.body}
            </p>
          </div>
        </section>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 w-full z-50 px-6 pb-10 pt-4 bg-gradient-to-t from-white via-white/90 to-transparent">
        <button
          type="button"
          className="w-full bg-primary text-white rounded-full py-5 px-8 shadow-lg shadow-primary/20 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all max-w-lg mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest mr-2">
            Continua
          </span>
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </button>
      </footer>
    </div>
  );
}
