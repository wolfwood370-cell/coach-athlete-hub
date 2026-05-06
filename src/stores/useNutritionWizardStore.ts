import { create } from "zustand";

export type GoalKey = "lose" | "maintain" | "gain";
export type ApproachKey = "balanced" | "low-carb" | "low-fat" | "keto";
export type DistributionKey = "lineare" | "polarizzata";
export type ProteinKey = "basso" | "moderato" | "alto" | "molto-alto";

export interface NutritionWizardState {
  // Step 1
  goal: GoalKey;
  targetWeight: number; // kg
  rateOfChange: number; // 0..100 slider
  // Step 2
  dietaryApproach: ApproachKey;
  // Step 3
  caloricDistribution: DistributionKey;
  trainingDays: string[]; // ['mon','tue',...]
  proteinIntake: ProteinKey;

  setGoal: (v: GoalKey) => void;
  setTargetWeight: (v: number) => void;
  setRateOfChange: (v: number) => void;
  setDietaryApproach: (v: ApproachKey) => void;
  setCaloricDistribution: (v: DistributionKey) => void;
  setTrainingDays: (v: string[]) => void;
  toggleTrainingDay: (id: string) => void;
  setProteinIntake: (v: ProteinKey) => void;
  reset: () => void;
}

const INITIAL: Omit<
  NutritionWizardState,
  | "setGoal"
  | "setTargetWeight"
  | "setRateOfChange"
  | "setDietaryApproach"
  | "setCaloricDistribution"
  | "setTrainingDays"
  | "toggleTrainingDay"
  | "setProteinIntake"
  | "reset"
> = {
  goal: "lose",
  targetWeight: 82,
  rateOfChange: 25,
  dietaryApproach: "balanced",
  caloricDistribution: "polarizzata",
  trainingDays: ["mon", "tue", "fri", "sat"],
  proteinIntake: "alto",
};

export const useNutritionWizardStore = create<NutritionWizardState>((set) => ({
  ...INITIAL,
  setGoal: (goal) => set({ goal }),
  setTargetWeight: (targetWeight) => set({ targetWeight }),
  setRateOfChange: (rateOfChange) => set({ rateOfChange }),
  setDietaryApproach: (dietaryApproach) => set({ dietaryApproach }),
  setCaloricDistribution: (caloricDistribution) => set({ caloricDistribution }),
  setTrainingDays: (trainingDays) => set({ trainingDays }),
  toggleTrainingDay: (id) =>
    set((s) => ({
      trainingDays: s.trainingDays.includes(id)
        ? s.trainingDays.filter((d) => d !== id)
        : [...s.trainingDays, id],
    })),
  setProteinIntake: (proteinIntake) => set({ proteinIntake }),
  reset: () => set({ ...INITIAL }),
}));

// ── Helpers ────────────────────────────────────────────────────────────

/** Convert slider 0..100 to percent of body weight per week (0.1% .. 1.2%). */
export function rateToPctPerWeek(rate: number): number {
  return 0.1 + (Math.max(0, Math.min(100, rate)) / 100) * 1.1;
}

/** Convert protein key to grams per kg of body weight. */
export const PROTEIN_G_PER_KG: Record<ProteinKey, number> = {
  basso: 1.2,
  moderato: 1.6,
  alto: 2.0,
  "molto-alto": 2.4,
};

/** Macro split (carbs/protein/fats fractions) per dietary approach. */
export const APPROACH_SPLIT: Record<
  ApproachKey,
  { carbs: number; protein: number; fats: number }
> = {
  balanced: { carbs: 0.5, protein: 0.25, fats: 0.25 },
  "low-carb": { carbs: 0.25, protein: 0.35, fats: 0.4 },
  "low-fat": { carbs: 0.55, protein: 0.25, fats: 0.2 },
  keto: { carbs: 0.05, protein: 0.25, fats: 0.7 },
};

/** Mifflin-St Jeor BMR + activity multiplier → baseline TDEE estimate. */
export function estimateBaselineTDEE(params: {
  weightKg: number;
  heightCm?: number | null;
  ageYears?: number | null;
  gender?: "male" | "female" | "other" | null;
  activityFactor?: number;
}): number {
  const {
    weightKg,
    heightCm = 175,
    ageYears = 30,
    gender = "male",
    activityFactor = 1.5,
  } = params;
  const h = heightCm ?? 175;
  const a = ageYears ?? 30;
  const baseBmr =
    gender === "female"
      ? 10 * weightKg + 6.25 * h - 5 * a - 161
      : 10 * weightKg + 6.25 * h - 5 * a + 5;
  return Math.round(baseBmr * activityFactor);
}

/**
 * Compute initial target calories given baseline TDEE, goal and rate.
 * 1 kg of body fat ≈ 7700 kcal, so daily delta = (kg/week × 7700) / 7.
 */
export function computeInitialCalories(args: {
  baselineTdee: number;
  goal: GoalKey;
  weightKg: number;
  rate: number;
}): number {
  const { baselineTdee, goal, weightKg, rate } = args;
  if (goal === "maintain") return baselineTdee;
  const pct = rateToPctPerWeek(rate);
  const kgPerWeek = (weightKg * pct) / 100;
  const dailyDelta = (kgPerWeek * 7700) / 7;
  return Math.round(
    goal === "lose" ? baselineTdee - dailyDelta : baselineTdee + dailyDelta,
  );
}

export function computeTargetEndDate(args: {
  currentWeightKg: number;
  targetWeightKg: number;
  goal: GoalKey;
  rate: number;
}): Date | null {
  const { currentWeightKg, targetWeightKg, goal, rate } = args;
  if (goal === "maintain") return null;
  const diff = Math.abs(targetWeightKg - currentWeightKg);
  if (diff <= 0) return null;
  const pct = rateToPctPerWeek(rate);
  const kgPerWeek = (currentWeightKg * pct) / 100;
  if (kgPerWeek <= 0) return null;
  const weeks = diff / kgPerWeek;
  const end = new Date();
  end.setDate(end.getDate() + Math.round(weeks * 7));
  return end;
}
