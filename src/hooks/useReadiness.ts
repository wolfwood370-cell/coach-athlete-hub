import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type SorenessLevel = 0 | 1 | 2 | 3;

interface SorenessMap {
  [key: string]: SorenessLevel;
}

export interface ReadinessData {
  isCompleted: boolean;
  score: number;
  sleepHours: number;
  sleepQuality: number;
  energy: number;
  stress: number;
  mood: number;
  digestion: number;
  sorenessMap: SorenessMap;
}

export const initialReadiness: ReadinessData = {
  isCompleted: false,
  score: 0,
  sleepHours: 7,
  sleepQuality: 7,
  energy: 7,
  stress: 3,
  mood: 7,
  digestion: 7,
  sorenessMap: {},
};

export function useReadiness() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tempReadiness, setTempReadiness] = useState<ReadinessData>(initialReadiness);

  const today = new Date().toISOString().split("T")[0];

  // Fetch today's readiness
  const { data: readiness, isLoading } = useQuery({
    queryKey: ["daily-readiness", user?.id, today],
    queryFn: async (): Promise<ReadinessData> => {
      if (!user?.id) return initialReadiness;

      const { data, error } = await supabase
        .from("daily_readiness")
        .select("*")
        .eq("athlete_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return initialReadiness;
      }

      return {
        isCompleted: true,
        score: data.score ?? 0,
        sleepHours: Number(data.sleep_hours) ?? 7,
        sleepQuality: data.sleep_quality ?? 7,
        energy: (data as any).energy ?? 7,
        stress: data.stress_level ?? 3,
        mood: (data as any).mood ?? 7,
        digestion: (data as any).digestion ?? 7,
        sorenessMap: (data.soreness_map as SorenessMap) ?? {},
      };
    },
    enabled: !!user?.id,
  });

  // Calculate score function
  const calculateScore = useCallback((data: ReadinessData): number => {
    let sleepHoursScore = 0;
    if (data.sleepHours >= 7 && data.sleepHours <= 9) {
      sleepHoursScore = 20;
    } else if (data.sleepHours >= 6) {
      sleepHoursScore = 15;
    } else if (data.sleepHours >= 5) {
      sleepHoursScore = 10;
    } else {
      sleepHoursScore = 5;
    }

    const sleepQualityScore = (data.sleepQuality / 10) * 15;
    const energyScore = (data.energy / 10) * 15;
    const stressScore = ((10 - data.stress) / 10) * 15;
    const moodScore = (data.mood / 10) * 15;
    const digestionScore = (data.digestion / 10) * 10;

    const sorenessMap = data.sorenessMap || {};
    const sorenessValues = Object.values(sorenessMap) as number[];
    const maxSoreness = sorenessValues.length > 0 ? Math.max(...sorenessValues) : 0;
    const sorenessCount = sorenessValues.filter((v) => v > 0).length;
    const sorenessPenalty = Math.min(10, maxSoreness * 2 + sorenessCount * 0.5);

    const total =
      sleepHoursScore +
      sleepQualityScore +
      energyScore +
      stressScore +
      moodScore +
      digestionScore -
      sorenessPenalty;

    return Math.max(0, Math.min(100, Math.round(total)));
  }, []);

  // Save/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ReadinessData) => {
      if (!user?.id) throw new Error("User not authenticated");

      const score = calculateScore(data);
      const hasPain = Object.values(data.sorenessMap).some((level) => level >= 2);

      // Check if entry exists for today
      const { data: existing } = await supabase
        .from("daily_readiness")
        .select("id")
        .eq("athlete_id", user.id)
        .eq("date", today)
        .maybeSingle();

      const payload = {
        athlete_id: user.id,
        date: today,
        score,
        sleep_hours: data.sleepHours,
        sleep_quality: data.sleepQuality,
        energy: data.energy,
        stress_level: data.stress,
        mood: data.mood,
        digestion: data.digestion,
        has_pain: hasPain,
        soreness_map: data.sorenessMap,
      };

      if (existing?.id) {
        // Update existing
        const { error } = await supabase
          .from("daily_readiness")
          .update(payload)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("daily_readiness").insert(payload);

        if (error) throw error;
      }

      return { ...data, isCompleted: true, score };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-readiness"] });
      toast.success("Check-in salvato!");
    },
    onError: (error) => {
      console.error("Error saving readiness:", error);
      toast.error("Errore nel salvataggio del check-in");
    },
  });

  return {
    readiness: readiness ?? initialReadiness,
    tempReadiness,
    setTempReadiness,
    isLoading,
    isSaving: saveMutation.isPending,
    calculateScore,
    saveReadiness: saveMutation.mutateAsync,
  };
}
