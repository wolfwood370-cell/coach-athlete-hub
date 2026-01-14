import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteAthleteDialog } from "@/components/coach/InviteAthleteDialog";
import { useAthleteRiskAnalysis, RiskLevel, AthleteRiskData } from "@/hooks/useAthleteRiskAnalysis";
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
  HeartPulse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Risk level configuration
const getRiskConfig = (level: RiskLevel) => {
  switch (level) {
    case "high":
      return { 
        dotClass: "bg-destructive", 
        borderClass: "border-destructive/50",
        bgClass: "bg-destructive/10",
        textClass: "text-destructive"
      };
    case "moderate":
      return { 
        dotClass: "bg-warning", 
        borderClass: "border-warning/50",
        bgClass: "bg-warning/10",
        textClass: "text-warning"
      };
    case "optimal":
      return { 
        dotClass: "bg-success", 
        borderClass: "border-success/50",
        bgClass: "bg-success/10",
        textClass: "text-success"
      };
    default:
      return { 
        dotClass: "bg-muted-foreground", 
        borderClass: "border-muted",
        bgClass: "bg-muted",
        textClass: "text-muted-foreground"
      };
  }
};

// Risk flag icon mapping
const getRiskFlagIcon = (type: string) => {
  switch (type) {
    case "high_injury_risk":
      return ShieldAlert;
    case "overload_warning":
      return Zap;
    case "detraining_risk":
      return TrendingDown;
    case "low_recovery":
      return Battery;
    default:
      return AlertTriangle;
  }
};

interface ScheduledWorkout {
  id: string;
  title: string;
  athlete_id: string;
  athlete_name: string;
  avatar_initials: string;
  scheduled_date: string;
}

export default function CoachHome() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  
  const { 
    allAthletes,
    needsAttention, 
    healthyAthletes,
    isLoading: riskLoading 
  } = useAthleteRiskAnalysis();

  // Fetch today's scheduled workouts
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: todaysWorkouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ["todays-workouts", user?.id, today],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          id,
          title,
          athlete_id,
          scheduled_date,
          profiles!workouts_athlete_id_fkey(full_name)
        `)
        .eq("scheduled_date", today)
        .eq("coach_id", user.id)
        .eq("status", "pending");
      
      if (error) throw error;
      
      return (data ?? []).map((w: any) => ({
        id: w.id,
        title: w.title,
        athlete_id: w.athlete_id,
        athlete_name: w.profiles?.full_name ?? "Atleta",
        avatar_initials: (w.profiles?.full_name ?? "A")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        scheduled_date: w.scheduled_date,
      })) as ScheduledWorkout[];
    },
    enabled: !!user && profile?.role === "coach",
  });

  const isLoading = riskLoading || workoutsLoading;

  // Categorize athletes by risk
  const highRiskAthletes = useMemo(() => 
    allAthletes.filter(a => a.riskLevel === "high"), 
    [allAthletes]
  );
  
  const moderateRiskAthletes = useMemo(() => 
    allAthletes.filter(a => a.riskLevel === "moderate"), 
    [allAthletes]
  );

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
    <CoachLayout title="Command Center" subtitle="Triage & Actionable Items">
      <div className="space-y-6 animate-fade-in">
        {/* Empty State for New Coaches */}
        {!isLoading && allAthletes.length === 0 && (
          <Card className="p-12 text-center border-0 shadow-sm">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6 ring-4 ring-primary/10">
              <UserPlus className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Welcome, Coach! 🎯
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Invite your first athlete to start tracking their training load, recovery, and performance metrics in real-time.
            </p>
            <InviteAthleteDialog 
              trigger={
                <Button className="gradient-primary h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Invite Your First Athlete
                </Button>
              }
            />
          </Card>
        )}

        {/* Main Triage Grid */}
        {allAthletes.length > 0 && (
          <div className="grid grid-cols-12 gap-4 lg:gap-5">
            
            {/* ===== SECTION 1: RED FLAGS (High Priority) ===== */}
            <Card className="col-span-12 lg:col-span-8 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4 lg:px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Red Flags</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        ACWR &gt; 1.3 | Readiness &lt; 40% | Pain Reported
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="tabular-nums">
                    {highRiskAthletes.length + moderateRiskAthletes.length}
                  </Badge>
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
                ) : needsAttention.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-success/10 mb-3">
                      <CheckCircle2 className="h-7 w-7 text-success" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">All Clear!</h3>
                    <p className="text-sm text-muted-foreground">
                      Tutti gli atleti sono in zone ottimali. Ottimo lavoro!
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[320px]">
                    <div className="divide-y divide-border/50">
                      {needsAttention.map((athlete) => (
                        <AthleteRiskRow 
                          key={athlete.athleteId} 
                          athlete={athlete} 
                          onClick={() => navigate(`/coach/athlete/${athlete.athleteId}`)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* ===== TODAY'S SCHEDULE ===== */}
            <Card className="col-span-12 lg:col-span-4 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Oggi</CardTitle>
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
                {workoutsLoading ? (
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
                          onClick={() => navigate(`/coach/athlete/${workout.athlete_id}`)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {workout.avatar_initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{workout.athlete_name}</p>
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

            {/* ===== HEALTHY ATHLETES ===== */}
            {healthyAthletes.length > 0 && (
              <Card className="col-span-12 lg:col-span-6 border-0 shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <CardTitle className="text-sm font-semibold">Optimal Zone</CardTitle>
                    <Badge variant="secondary" className="ml-auto text-xs tabular-nums">
                      {healthyAthletes.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex flex-wrap gap-2">
                    {healthyAthletes.slice(0, 12).map(athlete => (
                      <Avatar 
                        key={athlete.athleteId} 
                        className="h-9 w-9 border-2 border-success/30 cursor-pointer hover:scale-110 transition-transform"
                        title={`${athlete.athleteName} - ACWR: ${athlete.acwr?.toFixed(2) ?? "N/A"}`}
                        onClick={() => navigate(`/coach/athlete/${athlete.athleteId}`)}
                      >
                        <AvatarImage src={athlete.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px] bg-success/10 text-success font-medium">
                          {athlete.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {healthyAthletes.length > 12 && (
                      <div 
                        className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => navigate("/coach/athletes")}
                      >
                        +{healthyAthletes.length - 12}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ===== QUICK STATS ===== */}
            <Card className="col-span-12 lg:col-span-6 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-2xl font-bold tabular-nums">{allAthletes.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Atleti Totali</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-destructive/5">
                    <p className="text-2xl font-bold tabular-nums text-destructive">
                      {highRiskAthletes.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Alto Rischio</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-success/5">
                    <p className="text-2xl font-bold tabular-nums text-success">
                      {healthyAthletes.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Zona Ottimale</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ===== PENDING CHECK-INS ===== */}
            <Card className="col-span-12 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4 lg:px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
                      <MessageSquare className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Pending Feedback</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Atleti che attendono il tuo feedback
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 lg:p-5 pt-2">
                <div className="text-center py-6 text-muted-foreground">
                  <HeartPulse className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessun feedback in attesa</p>
                  <p className="text-xs mt-1">I workout completati appariranno qui</p>
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </CoachLayout>
  );
}

// Athlete Risk Row Component
function AthleteRiskRow({ 
  athlete, 
  onClick 
}: { 
  athlete: AthleteRiskData; 
  onClick: () => void;
}) {
  const riskConfig = getRiskConfig(athlete.riskLevel);
  const PrimaryIcon = athlete.primaryFlag 
    ? getRiskFlagIcon(athlete.primaryFlag.type) 
    : AlertTriangle;

  return (
    <div 
      className="flex items-center gap-4 px-4 lg:px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      {/* Avatar with status dot */}
      <div className="relative flex-shrink-0">
        <Avatar className={cn("h-10 w-10 border-2", riskConfig.borderClass)}>
          <AvatarImage src={athlete.avatarUrl || undefined} />
          <AvatarFallback className={cn(
            "text-xs font-semibold",
            riskConfig.bgClass,
            riskConfig.textClass
          )}>
            {athlete.avatarInitials}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
          riskConfig.dotClass
        )} />
      </div>
      
      {/* Name & Primary Flag */}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{athlete.athleteName}</p>
        {athlete.primaryFlag && (
          <Badge 
            variant="secondary"
            className={cn(
              "text-[10px] font-medium px-2 py-0.5 gap-1 border-0 mt-1",
              riskConfig.bgClass,
              riskConfig.textClass
            )}
          >
            <PrimaryIcon className="h-3 w-3" />
            {athlete.primaryFlag.value}
          </Badge>
        )}
      </div>
      
      {/* ACWR Badge */}
      <div className="hidden md:flex flex-col items-center flex-shrink-0 w-16">
        <span className={cn(
          "text-lg font-bold tabular-nums",
          riskConfig.textClass
        )}>
          {athlete.acwr?.toFixed(2) ?? "—"}
        </span>
        <span className="text-[9px] text-muted-foreground">ACWR</span>
      </div>
      
      {/* Actions */}
      <Button 
        size="icon" 
        variant="ghost"
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
