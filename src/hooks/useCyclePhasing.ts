import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, addDays, format } from "date-fns";

// ── Types ──────────────────────────────────────────────

export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface TrainingModifiers {
  volume_suggestion: string;
  strength_potential: number; // 0-100
  injury_risk: string;
  nutrition_focus: string;
}

export interface CycleStatus {
  currentPhase: CyclePhase;
  daysIntoCycle: number;
  predictedNextPeriod: Date;
  trainingModifiers: TrainingModifiers;
  phaseLabel: string;
  powerTip: string;
}

export interface CycleSettings {
  athlete_id: string;
  cycle_length_days: number;
  auto_regulation_enabled: boolean;
  last_period_start_date: string | null;
  contraceptive_type: string | null;
}

// ── Phase Algorithm ────────────────────────────────────

function calculatePhase(dayInCycle: number, cycleLength: number): CyclePhase {
  if (dayInCycle <= 5) return "menstrual";
  if (dayInCycle <= 12) return "follicular";
  if (dayInCycle <= 15) return "ovulatory";
  return "luteal";
}

function getTrainingModifiers(phase: CyclePhase, dayInCycle: number): TrainingModifiers {
  switch (phase) {
    case "menstrual":
      return {
        volume_suggestion: "Scarico",
        strength_potential: 35,
        injury_risk: "Basso",
        nutrition_focus: "Ferro & Idratazione",
      };
    case "follicular":
      return {
        volume_suggestion: "Massima Intensità",
        strength_potential: 80,
        injury_risk: "Basso",
        nutrition_focus: "Carboidrati per l'intensità",
      };
    case "ovulatory":
      return {
        volume_suggestion: "Picco Prestazione",
        strength_potential: 95,
        injury_risk: "Alto — Protezione Articolare",
        nutrition_focus: "Proteine & Antiossidanti",
      };
    case "luteal":
      return {
        volume_suggestion: "Mantenimento",
        strength_potential: 55,
        injury_risk: "Moderato",
        nutrition_focus: "Idratazione & Magnesio",
      };
  }
}

function getPowerTip(phase: CyclePhase): string {
  switch (phase) {
    case "menstrual":
      return "Il riposo è produttivo. Concentrati su mobilità e lavoro a bassa intensità.";
    case "follicular":
      return "L'estrogeno sta salendo. Punta al massimale oggi! 💪";
    case "ovulatory":
      return "Finestra di forza massima — riscaldamento approfondito per proteggere le articolazioni.";
    case "luteal":
      return "Temperatura corporea più alta. Focus su lavoro aerobico a regime costante.";
  }
}

function getPhaseLabel(phase: CyclePhase): string {
  switch (phase) {
    case "menstrual": return "Fase Mestruale";
    case "follicular": return "Fase Follicolare";
    case "ovulatory": return "Fase Ovulatoria";
    case "luteal": return "Fase Luteale";
  }
}

// ── Hook ───────────────────────────────────────────────

export function useCyclePhasing(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["cycle-settings", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("athlete_cycle_settings")
        .select("*")
        .eq("athlete_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as CycleSettings | null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const isConfigured = !!settings?.last_period_start_date;

  const cycleStatus: CycleStatus | null = (() => {
    if (!settings?.last_period_start_date) return null;

    const lastPeriod = new Date(settings.last_period_start_date);
    const today = new Date();
    const cycleLength = settings.cycle_length_days || 28;

    const totalDays = differenceInDays(today, lastPeriod);
    const daysIntoCycle = ((totalDays % cycleLength) + cycleLength) % cycleLength || cycleLength;
    
    const currentPhase = calculatePhase(daysIntoCycle, cycleLength);
    const daysRemaining = cycleLength - daysIntoCycle;
    const predictedNextPeriod = addDays(today, daysRemaining);

    return {
      currentPhase,
      daysIntoCycle,
      predictedNextPeriod,
      trainingModifiers: getTrainingModifiers(currentPhase, daysIntoCycle),
      phaseLabel: getPhaseLabel(currentPhase),
      powerTip: getPowerTip(currentPhase),
    };
  })();

  // Save / update settings
  const saveMutation = useMutation({
    mutationFn: async (input: {
      lastPeriodStart: string;
      cycleLength: number;
      contraceptiveType?: string;
    }) => {
      if (!userId) throw new Error("No user");

      const payload = {
        athlete_id: userId,
        last_period_start_date: input.lastPeriodStart,
        cycle_length_days: input.cycleLength,
        contraceptive_type: input.contraceptiveType || "none",
        auto_regulation_enabled: true,
      };

      const { error } = await supabase
        .from("athlete_cycle_settings")
        .upsert(payload, { onConflict: "athlete_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycle-settings", userId] });
    },
  });

  // Log daily symptoms
  const logSymptomsMutation = useMutation({
    mutationFn: async (symptoms: string[]) => {
      if (!userId) throw new Error("No user");
      const today = format(new Date(), "yyyy-MM-dd");
      const phase = cycleStatus?.currentPhase || "follicular";

      const { error } = await supabase
        .from("daily_cycle_logs")
        .upsert(
          {
            athlete_id: userId,
            date: today,
            current_phase: phase,
            symptom_tags: symptoms,
          },
          { onConflict: "athlete_id,date" }
        );

      if (error) throw error;
    },
  });

  return {
    settings,
    isLoading,
    isConfigured,
    cycleStatus,
    saveSettings: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    logSymptoms: logSymptomsMutation.mutateAsync,
    isLoggingSymptoms: logSymptomsMutation.isPending,
  };
}
