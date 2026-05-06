import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAthleteBiometrics } from "@/hooks/useAthleteBiometrics";
import {
  APPROACH_SPLIT,
  PROTEIN_G_PER_KG,
  computeInitialCalories,
  estimateBaselineTDEE,
  useNutritionWizardStore,
} from "@/stores/useNutritionWizardStore";

const DAY_LABELS: { id: string; label: string }[] = [
  { id: "mon", label: "L" },
  { id: "tue", label: "M" },
  { id: "wed", label: "M" },
  { id: "thu", label: "G" },
  { id: "fri", label: "V" },
  { id: "sat", label: "S" },
  { id: "sun", label: "D" },
];

const FALLBACK_WEIGHT = 80;

export default function NutritionWizardReveal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: bio } = useAthleteBiometrics();
  const wizard = useNutritionWizardStore();

  const { dailyCalories, baselineTdee, proteinG, carbsG, fatsG, polarizedHigh, polarizedLow } =
    useMemo(() => {
      const weight = bio?.weightKg ?? FALLBACK_WEIGHT;
      const tdee = estimateBaselineTDEE({
        weightKg: weight,
        heightCm: bio?.heightCm ?? null,
        ageYears: bio?.ageYears ?? null,
        gender: bio?.gender ?? null,
      });
      const cals = computeInitialCalories({
        baselineTdee: tdee,
        goal: wizard.goal,
        weightKg: weight,
        rate: wizard.rateOfChange,
      });
      const split = APPROACH_SPLIT[wizard.dietaryApproach];
      const protG = Math.round(weight * PROTEIN_G_PER_KG[wizard.proteinIntake]);
      const fG = Math.round((cals * split.fats) / 9);
      const cG = Math.max(0, Math.round((cals - protG * 4 - fG * 9) / 4));
      // Polarized: training day +12%, rest day -12% to keep weekly average ~ cals
      const high = Math.round(cals * 1.12);
      const low = Math.round(cals * 0.88);
      return {
        dailyCalories: cals,
        baselineTdee: tdee,
        proteinG: protG,
        carbsG: cG,
        fatsG: fG,
        polarizedHigh: high,
        polarizedLow: low,
      };
    }, [bio, wizard.goal, wizard.rateOfChange, wizard.dietaryApproach, wizard.proteinIntake]);

  const split = APPROACH_SPLIT[wizard.dietaryApproach];
  // % heights for stacked bars (sum to 100)
  const proteinPct = Math.round(split.protein * 100);
  const fatsPct = Math.round(split.fats * 100);
  const carbsPct = Math.max(0, 100 - proteinPct - fatsPct);

  const isPolarized = wizard.caloricDistribution === "polarizzata";
  const trainingSet = new Set(wizard.trainingDays);

  const days = DAY_LABELS.map((d, i) => {
    const isTraining = isPolarized ? trainingSet.has(d.id) : true;
    const cals = isPolarized
      ? isTraining
        ? polarizedHigh
        : polarizedLow
      : dailyCalories;
    return {
      label: d.label,
      calories: cals,
      protein: proteinPct,
      fat: fatsPct,
      carb: carbsPct,
      active: i === ((new Date().getDay() + 6) % 7),
    };
  });

  const steps = [
    {
      title: `Dispendio Stimato: ${baselineTdee} kcal`,
      titleClass: "text-on-surface",
      subtitle:
        "TDEE calcolato da peso, altezza, età e livello di attività dichiarato.",
    },
    {
      title: `Target Medio: ${dailyCalories} kcal`,
      titleClass: "text-emerald-500",
      subtitle:
        wizard.goal === "lose"
          ? "Deficit calorico sostenibile per favorire la ricomposizione."
          : wizard.goal === "gain"
          ? "Surplus controllato per costruire massa magra."
          : "Mantenimento calorico per consolidare i risultati.",
    },
    {
      title: `Proteine: ${proteinG}g`,
      titleClass: "text-blue-500",
      subtitle: `${PROTEIN_G_PER_KG[wizard.proteinIntake]} g/kg di peso corporeo per preservare massa magra.`,
    },
    {
      title: isPolarized ? "Distribuzione Polarizzata" : "Distribuzione Lineare",
      titleClass: "text-primary-container",
      subtitle: isPolarized
        ? "Più calorie nei giorni di allenamento, meno nei giorni di riposo."
        : "Stesso target calorico tutti i giorni della settimana.",
    },
  ];

  const handleStart = () => {
    // Data already persisted in Step 3; just reset wizard and route to nutrition.
    wizard.reset();
    navigate("/athlete/nutrition");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-surface-variant/50 shadow-sm transition-all duration-300">
        <button onClick={() => navigate(-1)} className="text-primary" aria-label="Indietro">
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
        <section className="text-center mt-6 mb-10">
          <h2 className="font-display text-3xl font-extrabold text-inverse-surface leading-tight mb-2">
            Il tuo programma è pronto.
          </h2>
          <p className="text-secondary text-base max-w-xs mx-auto">
            Ecco la tua strategia nutrizionale ottimizzata.
          </p>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 mb-12">
          <div className="grid grid-cols-7 gap-1 h-64 relative">
            {days.map((day, i) => {
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

        <section>
          <h3 className="font-display text-xl font-bold text-inverse-surface mb-6">
            Come abbiamo calcolato il piano?
          </h3>

          <div className="relative pl-6">
            <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-surface-variant rounded-full" />

            {steps.map((step, i) => (
              <div
                key={i}
                className={`relative ${i < steps.length - 1 ? "mb-8" : ""}`}
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

            {/* Macro summary */}
            <div className="mt-8 grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50 rounded-lg py-3">
                <div className="text-xs text-blue-900 font-semibold">Proteine</div>
                <div className="text-base font-bold text-blue-600">{proteinG}g</div>
              </div>
              <div className="bg-emerald-50 rounded-lg py-3">
                <div className="text-xs text-emerald-900 font-semibold">Carboidrati</div>
                <div className="text-base font-bold text-emerald-600">{carbsG}g</div>
              </div>
              <div className="bg-amber-50 rounded-lg py-3">
                <div className="text-xs text-amber-900 font-semibold">Grassi</div>
                <div className="text-base font-bold text-amber-600">{fatsG}g</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-2xl border-t border-surface-variant/30 p-6 shadow-lg z-50">
        <button
          onClick={handleStart}
          className="w-full max-w-md mx-auto bg-inverse-surface text-white py-4 rounded-full font-bold text-base shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center"
        >
          Inizia Programma
        </button>
      </footer>
    </div>
  );
}
