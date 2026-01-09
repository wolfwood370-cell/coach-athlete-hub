import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ReadinessData {
  id?: string;
  isCompleted: boolean;
  score: number;
  sleepHours: number;
  sleepQuality: number; // 1 = Poor, 2 = Average, 3 = Good
  stress: number;
  hasPain: boolean;
  sorenessLocations: string[];
  notes?: string;
}

const initialReadiness: ReadinessData = {
  isCompleted: false,
  score: 0,
  sleepHours: 7,
  sleepQuality: 2, // Average
  stress: 5,
  hasPain: false,
  sorenessLocations: [],
};

export function useAthleteReadiness() {
  const { user } = useAuth();
  const [readiness, setReadiness] = useState<ReadinessData>(initialReadiness);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Calculate score using the MVP formula
  // (SleepQuality_Score * 0.5) + ((10 - Stress) * 10 * 0.5)
  const calculateScore = useCallback((data: ReadinessData): number => {
    // Sleep quality score: Poor=33, Average=66, Good=100
    const sleepQualityScore = data.sleepQuality === 1 ? 33 : data.sleepQuality === 2 ? 66 : 100;
    
    // Apply MVP formula
    const score = (sleepQualityScore * 0.5) + ((10 - data.stress) * 10 * 0.5);
    
    return Math.round(Math.min(100, Math.max(0, score)));
  }, []);

  // Fetch today's readiness on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchTodayReadiness = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("daily_readiness")
        .select("*")
        .eq("athlete_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (error) {
        console.error("Error fetching readiness:", error);
        setLoading(false);
        return;
      }

      if (data) {
        const sorenessMap = data.soreness_map as Record<string, boolean> | null;
        setReadiness({
          id: data.id,
          isCompleted: true,
          score: data.score ?? 0,
          sleepHours: Number(data.sleep_hours) ?? 7,
          sleepQuality: data.sleep_quality ?? 2,
          stress: data.stress_level ?? 5,
          hasPain: data.has_pain ?? false,
          sorenessLocations: sorenessMap ? Object.keys(sorenessMap).filter(k => sorenessMap[k]) : [],
          notes: data.notes ?? undefined,
        });
      }

      setLoading(false);
    };

    fetchTodayReadiness();
  }, [user]);

  // Save readiness to Supabase
  const saveReadiness = useCallback(async (data: ReadinessData): Promise<boolean> => {
    if (!user) return false;
    
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const score = calculateScore(data);
    
    // Build soreness_map object
    const sorenessMap: Record<string, boolean> = {};
    data.sorenessLocations.forEach(loc => {
      sorenessMap[loc] = true;
    });

    const payload = {
      athlete_id: user.id,
      date: today,
      score,
      sleep_hours: data.sleepHours,
      sleep_quality: data.sleepQuality,
      stress_level: data.stress,
      has_pain: data.hasPain,
      soreness_map: sorenessMap,
      notes: data.notes || null,
    };

    let result;
    
    if (data.id) {
      // Update existing
      result = await supabase
        .from("daily_readiness")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
    } else {
      // Insert new
      result = await supabase
        .from("daily_readiness")
        .insert(payload)
        .select()
        .single();
    }

    setSaving(false);

    if (result.error) {
      console.error("Error saving readiness:", result.error);
      return false;
    }

    setReadiness({
      ...data,
      id: result.data.id,
      isCompleted: true,
      score,
    });

    return true;
  }, [user, calculateScore]);

  return {
    readiness,
    loading,
    saving,
    calculateScore,
    saveReadiness,
    initialReadiness,
  };
}
