import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteAthleteDialog } from "@/components/coach/InviteAthleteDialog";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertTriangle,
  ShieldAlert,
  Zap,
  TrendingDown,
  Battery,
  CheckCircle2,
  UserPlus,
  ChevronRight,
  Calendar,
  MessageSquare,
  Activity,
  Flame,
  AlertCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

// Types for high priority alerts
interface HighPriorityAlert {
  id: string;
  athleteId: string;
  athleteName: string;
  avatarUrl: string | null;
  avatarInitials: string;
  alertType: "low_readiness" | "active_injury" | "high_acwr";
  alertLevel: "critical" | "warning";
  value: string;
  details: string;
}

interface PendingFeedback {
  id: string;
  workoutTitle: string;
  athleteId: string;
  athleteName: string;
  avatarInitials: string;
  completedAt: string;
}

interface TodayWorkout {
  id: string;
  title: string;
  athleteId: string;
  athleteName: string;
  avatarInitials: string;
  scheduledDate: string;
  status: string;
}

// Alert type configuration
const getAlertConfig = (type: HighPriorityAlert["alertType"]) => {
  switch (type) {
    case "low_readiness":
      return { 
        icon: Battery, 
        label: "Low Readiness",
        bgClass: "bg-destructive/10",
        textClass: "text-destructive"
      };
    case "active_injury":
      return { 
        icon: AlertCircle, 
        label: "Active Injury",
        bgClass: "bg-destructive/10",
        textClass: "text-destructive"
      };
    case "high_acwr":
      return { 
        icon: Flame, 
        label: "High ACWR",
        bgClass: "bg-warning/10",
        textClass: "text-warning"
      };
    default:
      return { 
        icon: AlertTriangle, 
        label: "Alert",
        bgClass: "bg-muted",
        textClass: "text-muted-foreground"
      };
  }
};

export default function CoachHome() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // ===== QUERY 1: Athletes with coach_id = current user =====
  const { data: athletes = [], isLoading: athletesLoading } = useQuery({
    queryKey: ["triage-athletes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("coach_id", user.id)
        .eq("role", "athlete");
      
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && profile?.role === "coach",
  });
  
  const athleteIds = useMemo(() => athletes.map(a => a.id), [athletes]);
  
  // ===== QUERY 2: Daily Readiness (last entry per athlete) =====
  const { data: readinessData = [], isLoading: readinessLoading } = useQuery({
    queryKey: ["triage-readiness", user?.id, athleteIds.join(",")],
    queryFn: async () => {
      if (!user || athleteIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("daily_readiness")
        .select("athlete_id, date, score")
        .in("athlete_id", athleteIds)
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && profile?.role === "coach" && athleteIds.length > 0,
  });
  
  // ===== QUERY 3: Active Injuries =====
  const { data: activeInjuries = [], isLoading: injuriesLoading } = useQuery({
    queryKey: ["triage-injuries", user?.id, athleteIds.join(",")],
    queryFn: async () => {
      if (!user || athleteIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("injuries")
        .select("id, athlete_id, body_zone, description, status")
        .in("athlete_id", athleteIds)
        .in("status", ["active", "in_rehab"]);
      
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && profile?.role === "coach" && athleteIds.length > 0,
  });
  
  // ===== QUERY 4: Workout Logs for ACWR calculation (last 28 days) =====
  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
  
  const { data: workoutLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["triage-workout-logs", user?.id, athleteIds.join(",")],
    queryFn: async () => {
      if (!user || athleteIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("workout_logs")
        .select("id, athlete_id, completed_at, duration_seconds, rpe_global, srpe")
        .in("athlete_id", athleteIds)
        .not("completed_at", "is", null)
        .gte("completed_at", twentyEightDaysAgo.toISOString());
      
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && profile?.role === "coach" && athleteIds.length > 0,
  });
  
  // ===== QUERY 5: Pending Feedback (completed workouts without coach feedback) =====
  const { data: pendingFeedbackRaw = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ["triage-pending-feedback", user?.id, athleteIds.join(",")],
    queryFn: async () => {
      if (!user || athleteIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("workout_logs")
        .select(`
          id,
          athlete_id,
          completed_at,
          coach_feedback,
          workouts!workout_logs_workout_id_fkey(title)
        `)
        .in("athlete_id", athleteIds)
        .not("completed_at", "is", null)
        .is("coach_feedback", null)
        .order("completed_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && profile?.role === "coach" && athleteIds.length > 0,
  });
  
  // ===== QUERY 6: Today's Scheduled Workouts (pending) =====
  const { data: todaysWorkoutsRaw = [], isLoading: todayLoading } = useQuery({
    queryKey: ["triage-todays-schedule", user?.id, today],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          id,
          title,
          athlete_id,
          scheduled_date,
          status,
          profiles!workouts_athlete_id_fkey(full_name)
        `)
        .eq("scheduled_date", today)
        .eq("coach_id", user.id)
        .eq("status", "pending");
      
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && profile?.role === "coach",
  });
  
  // ===== PROCESS HIGH PRIORITY ALERTS =====
  const highPriorityAlerts = useMemo<HighPriorityAlert[]>(() => {
    const alerts: HighPriorityAlert[] = [];
    
    athletes.forEach(athlete => {
      const initials = athlete.full_name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ?? "??";
      
      // Check 1: Low Readiness (< 45)
      const latestReadiness = readinessData.find(r => r.athlete_id === athlete.id);
      if (latestReadiness && latestReadiness.score !== null && latestReadiness.score < 45) {
        alerts.push({
          id: `readiness-${athlete.id}`,
          athleteId: athlete.id,
          athleteName: athlete.full_name ?? "Atleta",
          avatarUrl: athlete.avatar_url,
          avatarInitials: initials,
          alertType: "low_readiness",
          alertLevel: latestReadiness.score < 30 ? "critical" : "warning",
          value: `${latestReadiness.score}%`,
          details: `Readiness score is critically low (${latestReadiness.date})`,
        });
      }
      
      // Check 2: Active Injuries
      const athleteInjuries = activeInjuries.filter(i => i.athlete_id === athlete.id);
      if (athleteInjuries.length > 0) {
        athleteInjuries.forEach(injury => {
          alerts.push({
            id: `injury-${injury.id}`,
            athleteId: athlete.id,
            athleteName: athlete.full_name ?? "Atleta",
            avatarUrl: athlete.avatar_url,
            avatarInitials: initials,
            alertType: "active_injury",
            alertLevel: injury.status === "active" ? "critical" : "warning",
            value: injury.body_zone,
            details: injury.description ?? `${injury.status} injury`,
          });
        });
      }
      
      // Check 3: High ACWR (> 1.5)
      const athleteLogs = workoutLogs.filter(l => l.athlete_id === athlete.id);
      if (athleteLogs.length >= 7) {
        // Calculate ACWR
        const now = new Date();
        let acuteSum = 0;
        let chronicSum = 0;
        
        for (let i = 0; i < 28; i++) {
          const targetDate = new Date(now);
          targetDate.setDate(now.getDate() - i);
          const dateStr = targetDate.toISOString().split("T")[0];
          
          const dayLoad = athleteLogs
            .filter(log => log.completed_at?.split("T")[0] === dateStr)
            .reduce((sum, log) => {
              const rpe = log.srpe ?? log.rpe_global ?? 5;
              const duration = (log.duration_seconds ?? 1800) / 60;
              return sum + (rpe * duration);
            }, 0);
          
          if (i < 7) acuteSum += dayLoad;
          chronicSum += dayLoad;
        }
        
        const acuteAvg = acuteSum / 7;
        const chronicAvg = chronicSum / 28;
        const acwr = chronicAvg > 0 ? acuteAvg / chronicAvg : 0;
        
        if (acwr > 1.5) {
          alerts.push({
            id: `acwr-${athlete.id}`,
            athleteId: athlete.id,
            athleteName: athlete.full_name ?? "Atleta",
            avatarUrl: athlete.avatar_url,
            avatarInitials: initials,
            alertType: "high_acwr",
            alertLevel: acwr > 1.8 ? "critical" : "warning",
            value: `ACWR ${acwr.toFixed(2)}`,
            details: "High injury risk - acute load exceeds chronic capacity",
          });
        }
      }
    });
    
    // Sort: critical first, then warning
    return alerts.sort((a, b) => {
      if (a.alertLevel === "critical" && b.alertLevel !== "critical") return -1;
      if (b.alertLevel === "critical" && a.alertLevel !== "critical") return 1;
      return 0;
    });
  }, [athletes, readinessData, activeInjuries, workoutLogs]);
  
  // ===== PROCESS PENDING FEEDBACK =====
  const pendingFeedback = useMemo<PendingFeedback[]>(() => {
    return pendingFeedbackRaw.map((log: any) => {
      const athlete = athletes.find(a => a.id === log.athlete_id);
      const initials = athlete?.full_name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ?? "??";
      
      return {
        id: log.id,
        workoutTitle: log.workouts?.title ?? "Workout",
        athleteId: log.athlete_id,
        athleteName: athlete?.full_name ?? "Atleta",
        avatarInitials: initials,
        completedAt: log.completed_at,
      };
    });
  }, [pendingFeedbackRaw, athletes]);
  
  // ===== PROCESS TODAY'S SCHEDULE =====
  const todaysWorkouts = useMemo<TodayWorkout[]>(() => {
    return todaysWorkoutsRaw.map((w: any) => ({
      id: w.id,
      title: w.title,
      athleteId: w.athlete_id,
      athleteName: w.profiles?.full_name ?? "Atleta",
      avatarInitials: (w.profiles?.full_name ?? "A")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      scheduledDate: w.scheduled_date,
      status: w.status,
    }));
  }, [todaysWorkoutsRaw]);
  
  const isLoading = athletesLoading || readinessLoading || injuriesLoading || logsLoading || feedbackLoading || todayLoading;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <CoachLayout title="Command Center" subtitle="Caricamento...">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout title="Command Center" subtitle="Chi ha bisogno della tua attenzione oggi?">
      <div className="space-y-6 animate-fade-in">
        {/* Empty State for New Coaches */}
        {!isLoading && athletes.length === 0 && (
          <Card className="p-12 text-center border-0 shadow-sm">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6 ring-4 ring-primary/10">
              <UserPlus className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Benvenuto, Coach! 🎯
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Invita il tuo primo atleta per iniziare a monitorare il carico di allenamento, il recupero e le performance in tempo reale.
            </p>
            <InviteAthleteDialog 
              trigger={
                <Button className="gradient-primary h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Invita il Tuo Primo Atleta
                </Button>
              }
            />
          </Card>
        )}

        {/* Main Triage Grid */}
        {athletes.length > 0 && (
          <div className="grid grid-cols-12 gap-4 lg:gap-5">
            
            {/* ===== SECTION 1: HIGH PRIORITY (Health & Risk) ===== */}
            <Card className="col-span-12 lg:col-span-8 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4 lg:px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        🚨 High Priority
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Readiness &lt; 45% | Active Injuries | ACWR &gt; 1.5
                      </p>
                    </div>
                  </div>
                  {highPriorityAlerts.length > 0 && (
                    <Badge variant="destructive" className="tabular-nums">
                      {highPriorityAlerts.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : highPriorityAlerts.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-success/10 mb-3">
                      <CheckCircle2 className="h-7 w-7 text-success" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">All Clear!</h3>
                    <p className="text-sm text-muted-foreground">
                      Nessun atleta in zona di rischio. Ottimo lavoro!
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[320px]">
                    <div className="divide-y divide-border/50">
                      {highPriorityAlerts.map((alert) => (
                        <AlertRow 
                          key={alert.id} 
                          alert={alert} 
                          onClick={() => navigate(`/coach/athlete/${alert.athleteId}`)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* ===== SECTION 3: TODAY'S SCHEDULE ===== */}
            <Card className="col-span-12 lg:col-span-4 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">📅 Oggi</CardTitle>
                  </div>
                  <Badge variant="secondary" className="tabular-nums">
                    {todaysWorkouts.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(), "EEEE d MMMM", { locale: it })}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {todayLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : todaysWorkouts.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Nessun allenamento programmato per oggi
                    </p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="mt-2 text-xs"
                      onClick={() => navigate("/coach/programs")}
                    >
                      Crea un programma
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[240px]">
                    <div className="p-2 space-y-1">
                      {todaysWorkouts.map((workout) => (
                        <div
                          key={workout.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => navigate(`/coach/athlete/${workout.athleteId}`)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {workout.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{workout.athleteName}</p>
                            <p className="text-xs text-muted-foreground truncate">{workout.title}</p>
                          </div>
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* ===== SECTION 2: PENDING FEEDBACK ===== */}
            <Card className="col-span-12 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4 lg:px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
                      <MessageSquare className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        📝 Feedback Needed
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Workout completati in attesa di revisione
                      </p>
                    </div>
                  </div>
                  {pendingFeedback.length > 0 && (
                    <Badge variant="secondary" className="tabular-nums bg-warning/10 text-warning border-warning/20">
                      {pendingFeedback.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {feedbackLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-14" />
                    ))}
                  </div>
                ) : pendingFeedback.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted/50 mb-2">
                      <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Nessun feedback in attesa</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">I workout completati appariranno qui</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[200px]">
                    <div className="divide-y divide-border/50">
                      {pendingFeedback.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 px-4 lg:px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/coach/athlete/${item.athleteId}`)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-warning/10 text-warning text-sm font-medium">
                              {item.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              <span className="font-semibold">{item.athleteName}</span>
                              <span className="text-muted-foreground"> ha completato </span>
                              <span className="font-medium text-foreground">'{item.workoutTitle}'</span>
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(item.completedAt), { addSuffix: true, locale: it })}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Review
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* ===== QUICK STATS ===== */}
            <Card className="col-span-12 lg:col-span-6 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-2xl font-bold tabular-nums">{athletes.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Atleti Totali</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-destructive/5">
                    <p className="text-2xl font-bold tabular-nums text-destructive">
                      {highPriorityAlerts.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Alert Attivi</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-warning/5">
                    <p className="text-2xl font-bold tabular-nums text-warning">
                      {pendingFeedback.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Feedback</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ===== HEALTHY ATHLETES ===== */}
            <Card className="col-span-12 lg:col-span-6 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <CardTitle className="text-sm font-semibold">Optimal Zone</CardTitle>
                  <Badge variant="secondary" className="ml-auto text-xs tabular-nums">
                    {athletes.length - new Set(highPriorityAlerts.map(a => a.athleteId)).size}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex flex-wrap gap-2">
                  {athletes
                    .filter(a => !highPriorityAlerts.some(alert => alert.athleteId === a.id))
                    .slice(0, 12)
                    .map(athlete => {
                      const initials = athlete.full_name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) ?? "??";
                      
                      return (
                        <Avatar 
                          key={athlete.id} 
                          className="h-9 w-9 border-2 border-success/30 cursor-pointer hover:scale-110 transition-transform"
                          title={athlete.full_name ?? "Atleta"}
                          onClick={() => navigate(`/coach/athlete/${athlete.id}`)}
                        >
                          <AvatarImage src={athlete.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-success/10 text-success font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                  {athletes.filter(a => !highPriorityAlerts.some(alert => alert.athleteId === a.id)).length > 12 && (
                    <div 
                      className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/80"
                      onClick={() => navigate("/coach/athletes")}
                    >
                      +{athletes.filter(a => !highPriorityAlerts.some(alert => alert.athleteId === a.id)).length - 12}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </CoachLayout>
  );
}

// Alert Row Component
function AlertRow({ 
  alert, 
  onClick 
}: { 
  alert: HighPriorityAlert; 
  onClick: () => void;
}) {
  const config = getAlertConfig(alert.alertType);
  const Icon = config.icon;

  return (
    <div 
      className="flex items-center gap-4 px-4 lg:px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      {/* Avatar with status indicator */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={alert.avatarUrl || undefined} />
          <AvatarFallback className={cn("text-sm font-medium", config.bgClass, config.textClass)}>
            {alert.avatarInitials}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card flex items-center justify-center",
          alert.alertLevel === "critical" ? "bg-destructive" : "bg-warning"
        )}>
          <Icon className="h-2 w-2 text-white" />
        </div>
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{alert.athleteName}</p>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] px-1.5 py-0 h-5",
              alert.alertLevel === "critical" 
                ? "bg-destructive/10 text-destructive border-destructive/30" 
                : "bg-warning/10 text-warning border-warning/30"
            )}
          >
            {alert.value}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {alert.details}
        </p>
      </div>
      
      {/* Action hint */}
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
