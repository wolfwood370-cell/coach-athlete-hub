import { useState } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type DistributionKey = "lineare" | "polarizzata";
type ProteinKey = "basso" | "moderato" | "alto" | "molto-alto";

interface DayDef {
  id: string; // stable
  label: string;
}

const DAYS: DayDef[] = [
  { id: "mon", label: "L" },
  { id: "tue", label: "M" },
  { id: "wed", label: "M" },
  { id: "thu", label: "G" },
  { id: "fri", label: "V" },
  { id: "sat", label: "S" },
  { id: "sun", label: "D" },
];

interface ProteinOption {
  key: ProteinKey;
  label: string;
  value: string;
  hint?: string;
}

const PROTEINS: ProteinOption[] = [
  { key: "basso", label: "Basso", value: "1.2g/kg" },
  { key: "moderato", label: "Moderato", value: "1.6g/kg" },
  { key: "alto", label: "Alto", value: "2.0g/kg", hint: "~164g/day" },
  { key: "molto-alto", label: "Molto Alto", value: "2.4g/kg" },
];

export default function NutritionWizardStep3() {
  const [distribution, setDistribution] = useState<DistributionKey>("polarizzata");
  const [trainingDays, setTrainingDays] = useState<string[]>([
    "mon",
    "tue",
    "fri",
    "sat",
  ]);
  const [protein, setProtein] = useState<ProteinKey>("alto");

  const toggleDay = (id: string) => {
    setTrainingDays((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 pt-[env(safe-area-inset-top,0px)] bg-white/80 backdrop-blur-xl border-b border-surface-variant/20 shadow-none">
        <button
          type="button"
          className="text-primary hover:bg-surface-container/50 rounded-full p-2 transition-colors"
          aria-label="Torna indietro"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="flex flex-col items-center gap-1">
          <span className="font-display font-semibold text-lg text-on-surface">
            Step 3 of 5
          </span>
          <div className="flex gap-1 w-32" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i < 3 ? "bg-primary-container" : "bg-surface-variant",
                )}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="text-primary font-bold hover:bg-surface-container/50 px-3 py-2 rounded-lg transition-colors"
        >
          Skip
        </button>
      </header>

      <main className="px-6 py-24 space-y-12 max-w-md mx-auto min-h-screen pb-32 w-full">
        {/* Distribuzione Calorica */}
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">
              Distribuzione Calorica
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Vuoi mangiare di più nei giorni in cui ti alleni?
            </p>
          </div>

          {/* Option 1: Lineare */}
          <button
            type="button"
            onClick={() => setDistribution("lineare")}
            aria-pressed={distribution === "lineare"}
            className={cn(
              "w-full text-left p-6 rounded-[24px] transition-colors relative",
              distribution === "lineare"
                ? "border-2 border-primary-container bg-surface-container-low shadow-sm"
                : "border border-outline-variant bg-white hover:bg-surface-container-low",
            )}
          >
            {distribution === "lineare" && (
              <CheckCircle
                className="absolute top-4 right-4 h-5 w-5 text-primary-container"
                strokeWidth={2}
                aria-hidden
              />
            )}
            <h3 className="font-bold text-on-surface">Lineare</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Stesso target calorico tutti i giorni.
            </p>
          </button>

          {/* Option 2: Polarizzata */}
          <button
            type="button"
            onClick={() => setDistribution("polarizzata")}
            aria-pressed={distribution === "polarizzata"}
            className={cn(
              "w-full text-left p-6 rounded-[24px] relative transition-colors",
              distribution === "polarizzata"
                ? "border-2 border-primary-container bg-surface-container-low shadow-sm"
                : "border border-outline-variant bg-white hover:bg-surface-container-low",
            )}
          >
            {distribution === "polarizzata" && (
              <CheckCircle
                className="absolute top-4 right-4 h-5 w-5 text-primary-container"
                strokeWidth={2}
                aria-hidden
              />
            )}
            <h3 className="font-bold text-on-surface">Polarizzata (Cycling)</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              + Calorie nei giorni di allenamento
            </p>

            {distribution === "polarizzata" && (
              <div
                className="mt-5 pt-5 border-t border-outline-variant/40"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Seleziona i giorni di allenamento:
                </p>
                <div className="flex justify-between items-center mt-2">
                  {DAYS.map((day) => {
                    const active = trainingDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDay(day.id);
                        }}
                        aria-pressed={active}
                        aria-label={`Giorno ${day.label}`}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-transform active:scale-90",
                          active
                            ? "bg-primary-container text-white"
                            : "bg-surface-variant text-on-surface-variant hover:bg-surface-container-highest transition-colors",
                        )}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </button>
        </section>

        {/* Apporto Proteico */}
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">
              Apporto Proteico
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Seleziona il target di proteine giornaliero.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PROTEINS.map((opt) => {
              const active = protein === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setProtein(opt.key)}
                  aria-pressed={active}
                  className={cn(
                    "p-5 rounded-[20px] cursor-pointer flex flex-col justify-between aspect-square transition-colors text-left relative",
                    active
                      ? "border-2 border-blue-500 bg-blue-50 shadow-sm"
                      : "border border-outline-variant bg-white hover:bg-surface-container-low",
                  )}
                >
                  {active && (
                    <CheckCircle
                      className="absolute top-3 right-3 h-5 w-5 text-blue-500"
                      strokeWidth={2}
                      aria-hidden
                    />
                  )}
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wider",
                      active ? "text-blue-900" : "text-on-surface-variant",
                    )}
                  >
                    {opt.label}
                  </span>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "font-display text-2xl",
                        active
                          ? "text-blue-500 font-bold"
                          : "text-on-surface font-semibold",
                      )}
                    >
                      {opt.value}
                    </span>
                    {active && opt.hint && (
                      <span className="text-xs text-on-surface-variant mt-0.5">
                        {opt.hint}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-2xl border-t border-surface-variant/30 z-50">
        <button
          type="button"
          className="w-full max-w-md mx-auto bg-primary-container text-white py-4 px-6 rounded-full font-bold text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Genera Programma ✨
        </button>
      </footer>
    </div>
  );
}
