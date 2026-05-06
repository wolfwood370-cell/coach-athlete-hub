import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Croissant,
  Egg,
  Fish,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ApproachKey = "balanced" | "low-carb" | "low-fat" | "keto";

interface ApproachOption {
  key: ApproachKey;
  label: string;
  macros: string;
  Icon: LucideIcon;
}

const APPROACHES: ApproachOption[] = [
  {
    key: "balanced",
    label: "Bilanciato",
    macros: "Carb 50% / Pro 25% / Fat 25%",
    Icon: UtensilsCrossed,
  },
  {
    key: "low-carb",
    label: "Low Carb",
    macros: "Carb 25% / Pro 35% / Fat 40%",
    Icon: Egg,
  },
  {
    key: "low-fat",
    label: "Low Fat",
    macros: "Carb 55% / Pro 25% / Fat 20%",
    Icon: Croissant,
  },
  {
    key: "keto",
    label: "Keto",
    macros: "Carb 5% / Pro 25% / Fat 70%",
    Icon: Fish,
  },
];

export default function NutritionWizardStep2() {
  const [approach, setApproach] = useState<ApproachKey>("balanced");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 pt-[env(safe-area-inset-top,0px)] bg-white/80 backdrop-blur-xl border-b border-surface-variant/30 shadow-sm">
        <button
          type="button"
          className="text-primary hover:bg-surface-container-highest/30 rounded-full p-2 transition-colors"
          aria-label="Torna indietro"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="flex gap-1 items-center w-32" aria-label="Avanzamento wizard">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                i < 2 ? "bg-primary" : "bg-surface-container-highest",
              )}
              aria-hidden
            />
          ))}
        </div>
        <button
          type="button"
          className="font-label-sm text-primary uppercase tracking-wider px-3 py-2 hover:opacity-80 transition-opacity"
        >
          Salta
        </button>
      </header>

      <main className="pt-24 px-6 flex flex-col gap-8 max-w-md mx-auto pb-32">
        {/* Algorithmic Summary */}
        <section>
          <h2 className="font-display text-2xl font-bold text-on-surface mb-4">
            La tua Proiezione
          </h2>
          <div className="bg-white border border-surface-variant/50 rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">
                Calorie Iniziali
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-4xl text-primary-container font-black tabular-nums">
                  2,150
                </span>
                <span className="text-on-surface-variant">kcal</span>
              </div>
            </div>

            <div className="border-t border-dashed border-outline-variant/50" />

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">
                  Obiettivo
                </span>
                <span className="font-semibold text-on-surface tabular-nums">
                  82.0 kg
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">
                  A settimana
                </span>
                <span className="font-semibold text-on-surface tabular-nums">
                  -0.45 kg
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">
                  Traguardo
                </span>
                <span className="font-semibold text-emerald-500">Nov 2026</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dietary Approach */}
        <section>
          <h2 className="font-display text-2xl font-bold text-on-surface">
            Che approccio preferisci?
          </h2>
          <p className="text-sm text-on-surface-variant mb-6 mt-1">
            Adatteremo i macronutrienti in base al tuo stile alimentare.
          </p>

          <div className="flex flex-col gap-3">
            {APPROACHES.map(({ key, label, macros, Icon }) => {
              const active = approach === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setApproach(key)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl p-4 flex items-center justify-between text-left transition-colors",
                    active
                      ? "w-full bg-white border-2 border-primary-container shadow-sm"
                      : "w-full bg-white/50 border border-outline-variant/30 hover:bg-white",
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        active
                          ? "bg-surface-container text-primary"
                          : "bg-surface-container-low text-on-surface-variant",
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span
                        className={cn(
                          "font-semibold",
                          active ? "text-on-surface" : "text-on-surface-variant",
                        )}
                      >
                        {label}
                      </span>
                      <span className="text-xs text-on-surface-variant truncate">
                        {macros}
                      </span>
                    </div>
                  </div>

                  {active && (
                    <span className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-white shrink-0">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 w-full z-50 px-6 pb-[env(safe-area-inset-bottom,24px)] pt-4 bg-gradient-to-t from-background via-background/90 to-transparent">
        <button
          type="button"
          className="w-full flex items-center justify-center bg-primary-container text-white rounded-full py-4 px-8 font-bold text-xs uppercase tracking-wider shadow-lg max-w-md mx-auto mb-4 hover:brightness-110 active:scale-95 transition-all"
        >
          Continua
        </button>
      </footer>
    </div>
  );
}
