import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { subDays, format } from "date-fns";

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
  bodyWeight: number | null;
  // New fields for wearable/manual metrics
  hrvRmssd: number | null;
  restingHr: number | null;
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
  bodyWeight: null,
  hrvRmssd: null,
  restingHr: null,
};

interface DailyMetric {
  date: string;
  hrv_rmssd: number | null;
  resting_hr: number | null;
  sleep_hours: number | null;
  subjective_readiness: number | null;
}

interface BaselineData {
  hrvBaseline: number | null;
  restingHrBaseline: number | null;
  sleepBaseline: number | null;
  dataPoints: number;
  isNewUser: boolean;
}

interface ScorePenalty {
  label: string;
  points: number;
  type: "sleep" | "hrv" | "subjective";
}

export interface ReadinessResult {
  score: number;
  level: "high" | "moderate" | "low";
  color: string;
  bgColor: string;
  label: string;
  reason: string;
  penalties: ScorePenalty[];
  isNewUser: boolean;
  dataPoints: number;
}

export function useReadiness() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tempReadiness, setTempReadiness] = useState<ReadinessData>(initialReadiness);

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

  // Fetch last 30 days of daily_metrics for baseline calculation
  const { data: metricsHistory } = useQuery({
    queryKey: ["daily-metrics-history", user?.id],
    queryFn: async (): Promise<DailyMetric[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("daily_metrics")
        .select("date, hrv_rmssd, resting_hr, sleep_hours, subjective_readiness")
        .eq("user_id", user.id)
        .gte("date", thirtyDaysAgo)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate rolling baseline from historical data
  const baseline = useMemo((): BaselineData => {
    if (!metricsHistory || metricsHistory.length === 0) {
      return {
        hrvBaseline: null,
        restingHrBaseline: null,
        sleepBaseline: null,
        dataPoints: 0,
        isNewUser: true,
      };
    }

    const hrvValues = metricsHistory
      .filter(m => m.hrv_rmssd !== null)
      .map(m => m.hrv_rmssd as number);
    
    const hrValues = metricsHistory
      .filter(m => m.resting_hr !== null)
      .map(m => m.resting_hr as number);
    
    const sleepValues = metricsHistory
      .filter(m => m.sleep_hours !== null)
      .map(m => m.sleep_hours as number);

    const hrvBaseline = hrvValues.length >= 3 
      ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length 
      : null;
    
    const restingHrBaseline = hrValues.length >= 3
      ? hrValues.reduce((a, b) => a + b, 0) / hrValues.length
      : null;
    
    const sleepBaseline = sleepValues.length >= 3
      ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length
      : null;

    const dataPoints = Math.max(hrvValues.length, hrValues.length, sleepValues.length);

    return {
      hrvBaseline,
      restingHrBaseline,
      sleepBaseline,
      dataPoints,
      isNewUser: dataPoints < 3,
    };
  }, [metricsHistory]);

  // Fetch today's readiness
  const { data: readiness, isLoading } = useQuery({
    queryKey: ["daily-readiness", user?.id, today],
    queryFn: async (): Promise<ReadinessData> => {
      if (!user?.id) return initialReadiness;

      // Fetch from both tables in parallel
      const [readinessResult, metricsResult] = await Promise.all([
        supabase
          .from("daily_readiness")
          .select("*")
          .eq("athlete_id", user.id)
          .eq("date", today)
          .maybeSingle(),
        supabase
          .from("daily_metrics")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle(),
      ]);

      if (readinessResult.error) throw readinessResult.error;

      const readinessData = readinessResult.data;
      const metricsData = metricsResult.data;

      if (!readinessData && !metricsData) {
        return initialReadiness;
      }

      return {
        isCompleted: !!readinessData,
        score: readinessData?.score ?? 0,
        sleepHours: Number(readinessData?.sleep_hours ?? metricsData?.sleep_hours ?? 7),
        sleepQuality: readinessData?.sleep_quality ?? 7,
        energy: (readinessData as any)?.energy ?? 7,
        stress: readinessData?.stress_level ?? 3,
        mood: (readinessData as any)?.mood ?? 7,
        digestion: (readinessData as any)?.digestion ?? 7,
        sorenessMap: (readinessData?.soreness_map as SorenessMap) ?? {},
        bodyWeight: readinessData?.body_weight !== null 
          ? Number(readinessData.body_weight) 
          : metricsData?.weight_kg !== null 
            ? Number(metricsData.weight_kg) 
            : null,
        hrvRmssd: metricsData?.hrv_rmssd ?? null,
        restingHr: metricsData?.resting_hr ?? null,
      };
    },
    enabled: !!user?.id,
  });

  // Calculate objective score (60% of total)
  const calculateObjectiveScore = useCallback((
    data: ReadinessData,
    baselineData: BaselineData
  ): { score: number; penalties: ScorePenalty[] } => {
    let score = 60; // Start with max objective points
    const penalties: ScorePenalty[] = [];

    // Sleep Penalty: -10 points for every hour below 7h
    const sleepDeficit = Math.max(0, 7 - data.sleepHours);
    if (sleepDeficit > 0) {
      const sleepPenalty = Math.min(30, sleepDeficit * 10); // Cap at 30
      score -= sleepPenalty;
      penalties.push({
        label: `Sonno insufficiente (-${Math.round(sleepPenalty)}pts)`,
        points: -Math.round(sleepPenalty),
        type: "sleep",
      });
    }

    // HRV Penalty (only if we have baseline and today's HRV)
    if (data.hrvRmssd !== null && baselineData.hrvBaseline !== null) {
      const hrvDeviation = ((data.hrvRmssd - baselineData.hrvBaseline) / baselineData.hrvBaseline) * 100;
      
      if (hrvDeviation < -20) {
        // HRV drops > 20% below baseline: -40 points
        score -= 40;
        penalties.push({
          label: `HRV critico ${Math.round(hrvDeviation)}% (-40pts)`,
          points: -40,
          type: "hrv",
        });
      } else if (hrvDeviation < -10) {
        // HRV drops 10-20% below baseline: -20 points
        score -= 20;
        penalties.push({
          label: `HRV basso ${Math.round(hrvDeviation)}% (-20pts)`,
          points: -20,
          type: "hrv",
        });
      }
    }

    return { score: Math.max(0, score), penalties };
  }, []);

  // Calculate subjective score (40% of total)
  const calculateSubjectiveScore = useCallback((data: ReadinessData): number => {
    // Average of energy, mood, and inverted stress, mapped from 1-10 to 0-40
    const energyNorm = (data.energy - 1) / 9; // 0-1
    const moodNorm = (data.mood - 1) / 9; // 0-1
    const stressNorm = (10 - data.stress) / 9; // Inverted: low stress = high score
    const sleepQualityNorm = (data.sleepQuality - 1) / 9; // 0-1

    // Weighted average
    const subjectiveAvg = (energyNorm * 0.3 + moodNorm * 0.25 + stressNorm * 0.25 + sleepQualityNorm * 0.2);
    return Math.round(subjectiveAvg * 40); // Map to 0-40 points
  }, []);

  // Main readiness calculation
  const calculateReadiness = useCallback((data: ReadinessData): ReadinessResult => {
    // Handle new user state (< 3 days of data)
    if (baseline.isNewUser) {
      // For new users, use only subjective data and show neutral score
      const subjectiveScore = calculateSubjectiveScore(data);
      const neutralObjective = 30; // Neutral starting point for objective
      const totalScore = Math.round(neutralObjective + subjectiveScore);

      return {
        score: totalScore,
        level: totalScore >= 75 ? "high" : totalScore >= 50 ? "moderate" : "low",
        color: totalScore >= 75 ? "text-success" : totalScore >= 50 ? "text-warning" : "text-destructive",
        bgColor: totalScore >= 75 ? "bg-success" : totalScore >= 50 ? "bg-warning" : "bg-destructive",
        label: totalScore >= 75 ? "Alta Prontezza" : totalScore >= 50 ? "Prontezza Moderata" : "Bassa Prontezza",
        reason: `Accumula ${3 - baseline.dataPoints} giorni di dati per baseline personalizzata`,
        penalties: [],
        isNewUser: true,
        dataPoints: baseline.dataPoints,
      };
    }

    // Calculate 60% objective + 40% subjective
    const { score: objectiveScore, penalties } = calculateObjectiveScore(data, baseline);
    const subjectiveScore = calculateSubjectiveScore(data);
    const totalScore = Math.min(100, Math.max(0, objectiveScore + subjectiveScore));

    // Determine primary reason
    let reason = "Tutti i parametri ottimali";
    if (penalties.length > 0) {
      // Sort by severity and take the worst one
      const worstPenalty = penalties.reduce((a, b) => Math.abs(a.points) > Math.abs(b.points) ? a : b);
      reason = worstPenalty.label;
    } else if (data.sleepHours < 7) {
      reason = `Solo ${data.sleepHours}h di sonno`;
    } else if (data.stress > 6) {
      reason = "Livello di stress elevato";
    }

    return {
      score: totalScore,
      level: totalScore >= 75 ? "high" : totalScore >= 50 ? "moderate" : "low",
      color: totalScore >= 75 ? "text-success" : totalScore >= 50 ? "text-warning" : "text-destructive",
      bgColor: totalScore >= 75 ? "bg-success" : totalScore >= 50 ? "bg-warning" : "bg-destructive",
      label: totalScore >= 75 ? "Alta Prontezza" : totalScore >= 50 ? "Prontezza Moderata" : "Bassa Prontezza",
      reason,
      penalties,
      isNewUser: false,
      dataPoints: baseline.dataPoints,
    };
  }, [baseline, calculateObjectiveScore, calculateSubjectiveScore]);

  // Legacy score function for backwards compatibility
  const calculateScore = useCallback((data: ReadinessData): number => {
    return calculateReadiness(data).score;
  }, [calculateReadiness]);

  // Save/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ReadinessData) => {
      if (!user?.id) throw new Error("User not authenticated");

      const score = calculateScore(data);
      const hasPain = Object.values(data.sorenessMap).some((level) => level >= 2);

      // Save to daily_readiness
      const { data: existingReadiness } = await supabase
        .from("daily_readiness")
        .select("id")
        .eq("athlete_id", user.id)
        .eq("date", today)
        .maybeSingle();

      const readinessPayload = {
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
        body_weight: data.bodyWeight,
      };

      if (existingReadiness?.id) {
        const { error } = await supabase
          .from("daily_readiness")
          .update(readinessPayload)
          .eq("id", existingReadiness.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("daily_readiness").insert(readinessPayload);
        if (error) throw error;
      }

      // Save to daily_metrics (for HRV, HR, weight tracking)
      if (data.hrvRmssd !== null || data.restingHr !== null || data.bodyWeight !== null) {
        const { data: existingMetrics } = await supabase
          .from("daily_metrics")
          .select("id")
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle();

        const metricsPayload = {
          user_id: user.id,
          date: today,
          hrv_rmssd: data.hrvRmssd,
          resting_hr: data.restingHr,
          weight_kg: data.bodyWeight,
          sleep_hours: data.sleepHours,
          subjective_readiness: Math.round((data.energy + data.mood + (10 - data.stress)) / 3),
        };

        if (existingMetrics?.id) {
          const { error } = await supabase
            .from("daily_metrics")
            .update(metricsPayload)
            .eq("id", existingMetrics.id);
          if (error) {
            console.error("Error updating daily_metrics:", error);
          }
        } else {
          const { error } = await supabase.from("daily_metrics").insert(metricsPayload);
          if (error) {
            console.error("Error inserting daily_metrics:", error);
          }
        }
      }

      return { ...data, isCompleted: true, score };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-readiness"] });
      queryClient.invalidateQueries({ queryKey: ["daily-metrics-history"] });
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
    calculateReadiness,
    saveReadiness: saveMutation.mutateAsync,
    baseline,
  };
}
