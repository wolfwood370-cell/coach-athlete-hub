import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ONE_HOUR = 60 * 60 * 1000;

export function useActiveProgram() {
  const { user } = useAuth();
  const athleteId = user?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["athlete-active-program", athleteId],
    queryFn: async () => {
      if (!athleteId) return null;

      // Find active program assignment via workout_logs with a program_id
      const { data: logs } = await supabase
        .from("workout_logs")
        .select("program_id")
        .eq("athlete_id", athleteId)
        .not("program_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!logs?.program_id) return null;

      const { data: plan } = await supabase
        .from("program_plans")
        .select("id, name, description")
        .eq("id", logs.program_id)
        .single();

      return plan ?? null;
    },
    enabled: !!athleteId,
    staleTime: ONE_HOUR,
    gcTime: ONE_HOUR * 2,
  });

  return {
    activeProgram: data ?? null,
    isLoading,
  };
}
