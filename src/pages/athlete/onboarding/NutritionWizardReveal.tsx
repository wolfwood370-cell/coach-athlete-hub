import { ArrowLeft, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

type DayBar = {
  label: string;
  calories: number;
  protein: number; // %
  fat: number; // %
  carb: number; // %
  active?: boolean;
};

const DAYS: DayBar[] = [
  { label: "L", calories: 2350, protein: 28, fat: 22, carb: 50 },
  { label: "M", calories: 2650, protein: 25, fat: 20, carb: 55 },
  { label: "M", calories: 2350, protein: 28, fat: 22, carb: 50 },
  { label: "G", calories: 2650, protein: 25, fat: 20, carb: 55 },
  { label: "V", calories: 2350, protein: 28, fat: 22, carb: 50 },
  { label: "S", calories: 2650, protein: 25, fat: 20, carb: 55, active: true },
  { label: "D", calories: 2350, protein: 28, fat: 22, carb: 50 },
];

const STEPS: { title: string; titleClass: string; subtitle: string }[] = [
  {
    title: "Dispendio Stimato: 2993 kcal",
    titleClass: "text-on-surface",
    subtitle:
      "Abbiamo calcolato il tuo TDEE basandoci su peso, altezza, età e livello di attività dichiarato.",
  },
  {
    title: "Target Medio: 2493 kcal",
    titleClass: "text-emerald-500",
    subtitle:
      "Per perdere ~0.45 kg a settimana applichiamo un deficit di 500 kcal/giorno sostenibile nel tempo.",
  },
  {
    title: "Proteine (Alto): 164g",
    titleClass: "text-blue-500",
    subtitle:
      "2.0 g/kg di peso corporeo per preservare la massa magra durante il deficit calorico.",
  },
  {
    title: "Distribuzione Polarizzata",
    titleClass: "text-primary-container",
    subtitle:
      "Più carboidrati nei giorni di allenamento, più grassi nei giorni di riposo per ottimizzare la performance.",
  },
];

export default function NutritionWizardReveal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-surface-variant/50 shadow-sm transition-all duration-300">
        <button
          onClick={() => navigate(-1)}
          className="text-primary"
          aria-label="Indietro"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-headline-lg text-lg font-bold text-on-surface tracking-tight">
          Program Reveal
        </h1>
        <button className="text-primary" aria-label="Altre opzioni">
          <MoreVertical className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-grow pt-24 px-6 max-w-md mx-auto min-h-screen pb-32">
        {/* Hero */}
        <section className="text-center mt-6 mb-10">
          <h2 className="font-display text-3xl font-extrabold text-inverse-surface leading-tight mb-2">
            Il tuo programma è pronto.
          </h2>
          <p className="text-secondary text-base max-w-xs mx-auto">
            Ecco la tua strategia nutrizionale ottimizzata.
          </p>
        </section>

        {/* 7-Day Macro Grid */}
        <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 mb-12">
          <div className="grid grid-cols-7 gap-1 h-64 relative">
            {DAYS.map((day, i) => {
              const column = (
                <div className="flex flex-col h-full items-center justify-end">
                  <div className="bg-surface-variant text-primary font-bold text-[9px] py-1 px-1 rounded text-center mb-1 w-full">
                    {day.calories}
                  </div>
                  <div className="w-full flex-grow flex flex-col justify-end gap-[1px] mb-2">
                    <div
                      className="bg-blue-50 text-blue-900 rounded-t-sm flex items-center justify-center text-[9px] font-bold"
                      style={{ height: `${day.protein}%` }}
                    >
                      P
                    </div>
                    <div
                      className="bg-amber-50 text-amber-900 flex items-center justify-center text-[9px] font-bold"
                      style={{ height: `${day.fat}%` }}
                    >
                      F
                    </div>
                    <div
                      className="bg-emerald-50 text-emerald-900 rounded-b-sm flex items-center justify-center text-[9px] font-bold"
                      style={{ height: `${day.carb}%` }}
                    >
                      C
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      day.active ? "text-primary" : "text-outline"
                    }`}
                  >
                    {day.label}
                  </span>
                </div>
              );

              return day.active ? (
                <div
                  key={i}
                  className="bg-surface-container-low/50 rounded-lg pb-1 -mx-1 relative z-10"
                >
                  {column}
                </div>
              ) : (
                <div key={i}>{column}</div>
              );
            })}
          </div>
        </section>

        {/* Algorithmic Breakdown */}
        <section>
          <h3 className="font-display text-xl font-bold text-inverse-surface mb-6">
            Come abbiamo calcolato il piano?
          </h3>

          <div className="relative pl-6">
            <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-surface-variant rounded-full" />

            {STEPS.map((step, i) => (
              <div
                key={i}
                className={`relative ${i < STEPS.length - 1 ? "mb-8" : ""}`}
              >
                <div className="absolute -left-[30px] top-0 w-6 h-6 rounded-full bg-surface-container-high text-inverse-surface font-bold text-[10px] flex items-center justify-center border-2 border-white z-10">
                  {i + 1}
                </div>
                <h4 className={`font-bold text-base mb-1 ${step.titleClass}`}>
                  {step.title}
                </h4>
                <p className="text-sm text-secondary leading-relaxed">
                  {step.subtitle}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Sticky Bottom Action */}
      <footer className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-2xl border-t border-surface-variant/30 p-6 shadow-lg z-50">
        <button
          onClick={() => navigate("/athlete/nutrition")}
          className="w-full max-w-md mx-auto bg-inverse-surface text-white py-4 rounded-full font-bold text-base shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center"
        >
          Inizia Programma
        </button>
      </footer>
    </div>
  );
}
