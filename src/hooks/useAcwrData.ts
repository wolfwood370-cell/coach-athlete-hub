import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WorkoutLog {
  id: string;
  rpe_global: number | null;
  duration_seconds: number | null;
  completed_at: string | null;
}

interface AcwrResult {
  ratio: number | null;
  acuteLoad: number;
  chronicLoad: number;
  status: "optimal" | "warning" | "high-risk" | "insufficient-data";
  label: string;
}

export function useAcwrData(): { data: AcwrResult | null; isLoading: boolean; error: Error | null } {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["acwr-data", user?.id],
    queryFn: async (): Promise<AcwrResult> => {
      if (!user?.id) {
        return {
          ratio: null,
          acuteLoad: 0,
          chronicLoad: 0,
          status: "insufficient-data",
          label: "No data",
        };
      }

      // Get last 28 days of workout logs
      const twentyEightDaysAgo = new Date();
      twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

      const { data: logs, error: logsError } = await supabase
        .from("workout_logs")
        .select("id, rpe_global, duration_seconds, completed_at")
        .eq("athlete_id", user.id)
        .not("completed_at", "is", null)
        .gte("completed_at", twentyEightDaysAgo.toISOString())
        .order("completed_at", { ascending: false });

      if (logsError) throw logsError;

      if (!logs || logs.length === 0) {
        return {
          ratio: null,
          acuteLoad: 0,
          chronicLoad: 0,
          status: "insufficient-data",
          label: "Dati insufficienti",
        };
      }

      // Calculate load for each workout: RPE * Minutes
      const loadsWithDates = logs
        .filter((log): log is WorkoutLog & { rpe_global: number; duration_seconds: number; completed_at: string } => 
          log.rpe_global !== null && log.duration_seconds !== null && log.completed_at !== null
        )
        .map((log) => ({
          date: new Date(log.completed_at),
          load: log.rpe_global * (log.duration_seconds / 60), // RPE * minutes
        }));

      if (loadsWithDates.length === 0) {
        return {
          ratio: null,
          acuteLoad: 0,
          chronicLoad: 0,
          status: "insufficient-data",
          label: "Dati insufficienti",
        };
      }

      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      // Acute load: AVERAGE load over last 7 days
      const acuteLoads = loadsWithDates.filter((l) => l.date >= sevenDaysAgo);
      const acuteLoad = acuteLoads.length > 0 
        ? acuteLoads.reduce((sum, l) => sum + l.load, 0) / 7
        : 0;

      // Chronic load: AVERAGE load over last 28 days
      const chronicLoad = loadsWithDates.reduce((sum, l) => sum + l.load, 0) / 28;

      // Calculate ACWR
      if (chronicLoad === 0) {
        return {
          ratio: null,
          acuteLoad,
          chronicLoad,
          status: "insufficient-data",
          label: "Dati insufficienti",
        };
      }

      const ratio = acuteLoad / chronicLoad;

      // Determine status based on ACWR
      let status: AcwrResult["status"];
      let label: string;

      if (ratio >= 0.8 && ratio <= 1.3) {
        status = "optimal";
        label = "Optimal";
      } else if (ratio > 1.5) {
        status = "high-risk";
        label = "High Risk";
      } else {
        status = "warning";
        label = "Warning";
      }

      return {
        ratio: Math.round(ratio * 100) / 100,
        acuteLoad: Math.round(acuteLoad),
        chronicLoad: Math.round(chronicLoad),
        status,
        label,
      };
    },
    enabled: !!user?.id,
    staleTime: Infinity, // Offline-first: rely on cache, invalidate explicitly
  });

  return {
    data: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}
