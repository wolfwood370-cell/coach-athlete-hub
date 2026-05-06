import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAthleteBiometrics } from "@/hooks/useAthleteBiometrics";
import {
  APPROACH_SPLIT,
  PROTEIN_G_PER_KG,
  computeInitialCalories,
  computeTargetEndDate,
  estimateBaselineTDEE,
  rateToPctPerWeek,
  useNutritionWizardStore,
  type DistributionKey,
  type ProteinKey,
} from "@/stores/useNutritionWizardStore";

interface DayDef {
  id: string;
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
}

const PROTEINS: ProteinOption[] = [
  { key: "basso", label: "Basso", value: "1.2g/kg" },
  { key: "moderato", label: "Moderato", value: "1.6g/kg" },
  { key: "alto", label: "Alto", value: "2.0g/kg" },
  { key: "molto-alto", label: "Molto Alto", value: "2.4g/kg" },
];

const FALLBACK_WEIGHT = 80;

export default function NutritionWizardStep3() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: bio } = useAthleteBiometrics();

  const wizard = useNutritionWizardStore();
  const distribution = wizard.caloricDistribution;
  const trainingDays = wizard.trainingDays;
  const protein = wizard.proteinIntake;

  const [isSaving, setIsSaving] = useState(false);

  const setDistribution = (v: DistributionKey) => wizard.setCaloricDistribution(v);

  const proteinHint = useMemo(() => {
    const w = bio?.weightKg ?? FALLBACK_WEIGHT;
    const grams = Math.round(w * PROTEIN_G_PER_KG[protein]);
    return `~${grams}g/day`;
  }, [bio, protein]);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Sessione scaduta. Esegui di nuovo l'accesso.");
      return;
    }
    setIsSaving(true);
    try {
      const currentWeight = bio?.weightKg ?? FALLBACK_WEIGHT;
      const baselineTdee = estimateBaselineTDEE({
        weightKg: currentWeight,
        heightCm: bio?.heightCm ?? null,
        ageYears: bio?.ageYears ?? null,
        gender: bio?.gender ?? null,
      });
      const dailyCalories = computeInitialCalories({
        baselineTdee,
        goal: wizard.goal,
        weightKg: currentWeight,
        rate: wizard.rateOfChange,
      });
      const split = APPROACH_SPLIT[wizard.dietaryApproach];
      const proteinG = Math.round(currentWeight * PROTEIN_G_PER_KG[protein]);
      const fatsG = Math.round((dailyCalories * split.fats) / 9);
      const carbsG = Math.max(
        0,
        Math.round((dailyCalories - proteinG * 4 - fatsG * 9) / 4),
      );
      const endDate = computeTargetEndDate({
        currentWeightKg: currentWeight,
        targetWeightKg: wizard.targetWeight,
        goal: wizard.goal,
        rate: wizard.rateOfChange,
      });

      // Persist on athlete-owned profile.onboarding_data.nutrition_program
      const { data: existing, error: fetchErr } = await supabase
        .from("profiles")
        .select("onboarding_data")
        .eq("id", user.id)
        .maybeSingle();
      if (fetchErr) throw fetchErr;

      const prev =
        (existing?.onboarding_data as Record<string, unknown> | null) ?? {};
      const merged = {
        ...prev,
        nutrition_program: {
          goal: wizard.goal,
          target_weight_kg: wizard.targetWeight,
          rate_of_change: wizard.rateOfChange,
          rate_pct_per_week: rateToPctPerWeek(wizard.rateOfChange),
          dietary_approach: wizard.dietaryApproach,
          caloric_distribution: distribution,
          training_days: distribution === "polarizzata" ? trainingDays : [],
          protein_intake: protein,
          // Computed targets
          baseline_tdee: baselineTdee,
          daily_calories: dailyCalories,
          protein_g: proteinG,
          carbs_g: carbsG,
          fats_g: fatsG,
          target_end_date: endDate ? endDate.toISOString().slice(0, 10) : null,
          generated_at: new Date().toISOString(),
        },
      };

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ onboarding_data: merged })
        .eq("id", user.id);
      if (updErr) throw updErr;

      await queryClient.invalidateQueries({ queryKey: ["nutrition-plan", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["athlete-biometrics", user.id] });

      toast.success("Programma nutrizionale generato!");
      wizard.reset();
      navigate("/athlete/nutrition");
    } catch (err) {
      console.error("[NutritionWizardStep3] save failed", err);
      toast.error("Salvataggio fallito. Riprova.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 pt-[env(safe-area-inset-top,0px)] bg-white/80 backdrop-blur-xl border-b border-surface-variant/20 shadow-none">
        <button
          type="button"
          onClick={() => navigate(-1)}
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
          onClick={() => navigate("/athlete/dashboard")}
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
                          wizard.toggleTrainingDay(day.id);
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
                  onClick={() => wizard.setProteinIntake(opt.key)}
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
                    {active && (
                      <span className="text-xs text-on-surface-variant mt-0.5">
                        {proteinHint}
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
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full max-w-md mx-auto bg-primary-container text-white py-4 px-6 rounded-full font-bold text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Salvataggio…
            </>
          ) : (
            <>Genera Programma ✨</>
          )}
        </button>
      </footer>
    </div>
  );
}
