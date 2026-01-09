import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Athlete {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  coach_id: string | null;
}

interface DailyReadiness {
  id: string;
  athlete_id: string;
  date: string;
  score: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  has_pain: boolean | null;
  created_at: string;
}

interface Workout {
  id: string;
  athlete_id: string;
  title: string;
  scheduled_date: string | null;
  status: "pending" | "in_progress" | "completed" | "skipped";
  estimated_duration: number | null;
  structure: any;
}

interface WorkoutLog {
  id: string;
  workout_id: string;
  athlete_id: string;
  completed_at: string | null;
  duration_seconds: number | null;
  rpe_global: number | null;
  exercises_data: any;
}

export function useCoachAthletes() {
  const { user, profile } = useAuth();
  
  return useQuery({
    queryKey: ["coach-athletes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("coach_id", user.id)
        .eq("role", "athlete");
      
      if (error) throw error;
      return data as Athlete[];
    },
    enabled: !!user && profile?.role === "coach",
  });
}

export function useCoachDashboardData() {
  const { user, profile } = useAuth();
  
  // Fetch athletes
  const athletesQuery = useQuery({
    queryKey: ["coach-athletes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("coach_id", user.id)
        .eq("role", "athlete");
      
      if (error) throw error;
      return data as Athlete[];
    },
    enabled: !!user && profile?.role === "coach",
  });

  // Fetch recent readiness data for all athletes
  const readinessQuery = useQuery({
    queryKey: ["coach-readiness", user?.id],
    queryFn: async () => {
      if (!user || !athletesQuery.data?.length) return [];
      
      const athleteIds = athletesQuery.data.map(a => a.id);
      
      const { data, error } = await supabase
        .from("daily_readiness")
        .select("*")
        .in("athlete_id", athleteIds)
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data as DailyReadiness[];
    },
    enabled: !!user && profile?.role === "coach" && !!athletesQuery.data?.length,
  });

  // Fetch recent workouts
  const workoutsQuery = useQuery({
    queryKey: ["coach-workouts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("coach_id", user.id)
        .order("scheduled_date", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Workout[];
    },
    enabled: !!user && profile?.role === "coach",
  });

  // Fetch recent workout logs
  const logsQuery = useQuery({
    queryKey: ["coach-workout-logs", user?.id],
    queryFn: async () => {
      if (!user || !athletesQuery.data?.length) return [];
      
      const athleteIds = athletesQuery.data.map(a => a.id);
      
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .in("athlete_id", athleteIds)
        .order("completed_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as WorkoutLog[];
    },
    enabled: !!user && profile?.role === "coach" && !!athletesQuery.data?.length,
  });

  // Compute needs attention athletes
  const needsAttentionAthletes = athletesQuery.data?.map(athlete => {
    const athleteReadiness = readinessQuery.data?.filter(r => r.athlete_id === athlete.id) || [];
    const latestReadiness = athleteReadiness[0];
    
    // Calculate days since last check-in
    const today = new Date();
    const lastCheckinDate = latestReadiness ? new Date(latestReadiness.date) : null;
    const daysSinceCheckin = lastCheckinDate 
      ? Math.floor((today.getTime() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    let issue: string | null = null;
    let issueType: "critical" | "warning" | null = null;
    let details: string | null = null;
    
    // Check for issues
    if (!lastCheckinDate || daysSinceCheckin! >= 3) {
      issue = "Check-in Missed";
      issueType = "critical";
      details = lastCheckinDate 
        ? `Nessun check-in da ${daysSinceCheckin} giorni`
        : "Mai effettuato check-in";
    } else if (latestReadiness && latestReadiness.score !== null && latestReadiness.score < 40) {
      issue = "Low Readiness";
      issueType = "critical";
      details = `Score ${latestReadiness.score}/100${latestReadiness.has_pain ? " - dolore segnalato" : ""}`;
    } else if (latestReadiness && latestReadiness.stress_level && latestReadiness.stress_level >= 8) {
      issue = "High Stress";
      issueType = "warning";
      details = `Stress ${latestReadiness.stress_level}/10`;
    }
    
    if (!issue) return null;
    
    return {
      id: athlete.id,
      name: athlete.full_name || "Atleta",
      avatar: athlete.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "??",
      issue,
      issueType,
      lastCheckin: daysSinceCheckin === 0 
        ? "Oggi" 
        : daysSinceCheckin === 1 
          ? "Ieri" 
          : `${daysSinceCheckin} giorni fa`,
      details,
    };
  }).filter(Boolean) || [];

  // Compute business metrics
  const activeClients = athletesQuery.data?.length || 0;
  
  const completedWorkouts = logsQuery.data?.length || 0;
  const totalWorkouts = workoutsQuery.data?.length || 0;
  const complianceRate = totalWorkouts > 0 
    ? Math.round((completedWorkouts / totalWorkouts) * 100) 
    : 0;
  
  const churnRisk = needsAttentionAthletes.filter(a => a?.issueType === "critical").length;

  // Build activity feed from recent data
  const activityFeed: Array<{
    id: string;
    athlete: string;
    action: string;
    highlight: string;
    time: string;
    type: "success" | "default" | "message";
    icon: "Dumbbell" | "HeartPulse" | "Camera" | "Scale" | "MessageSquare";
  }> = [
    ...(logsQuery.data?.slice(0, 5).map(log => {
      const athlete = athletesQuery.data?.find(a => a.id === log.athlete_id);
      const workout = workoutsQuery.data?.find(w => w.id === log.workout_id);
      return {
        id: log.id,
        athlete: athlete?.full_name || "Atleta",
        action: "ha completato",
        highlight: workout?.title || "Workout",
        time: log.completed_at ? getRelativeTime(new Date(log.completed_at)) : "Recente",
        type: "success" as const,
        icon: "Dumbbell" as const,
      };
    }) || []),
    ...(readinessQuery.data?.slice(0, 5).map(readiness => {
      const athlete = athletesQuery.data?.find(a => a.id === readiness.athlete_id);
      return {
        id: readiness.id,
        athlete: athlete?.full_name || "Atleta",
        action: "check-in inviato",
        highlight: `Readiness ${readiness.score}/100`,
        time: getRelativeTime(new Date(readiness.created_at)),
        type: "default" as const,
        icon: "HeartPulse" as const,
      };
    }) || []),
  ].sort((a, b) => 0).slice(0, 10);

  return {
    athletes: athletesQuery.data || [],
    needsAttentionAthletes,
    businessMetrics: {
      activeClients,
      complianceRate,
      churnRisk,
    },
    activityFeed,
    isLoading: athletesQuery.isLoading || readinessQuery.isLoading,
    error: athletesQuery.error || readinessQuery.error,
  };
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "Adesso";
  if (minutes < 60) return `${minutes} min`;
  if (hours < 24) return `${hours}h`;
  return `${days}g`;
}
