import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  MoreHorizontal,
  Activity,
  Dumbbell,
  BarChart3,
  TrendingUp,
  Scale,
  Camera,
  Settings,
  Pencil,
  Archive,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Brain,
  Calendar,
  Clock,
  Zap,
  Flame,
  Target,
  AlertTriangle,
  Heart,
  ChevronRight,
  Coffee,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, startOfWeek, endOfWeek, addDays, isAfter, isBefore, isSameDay, differenceInDays, differenceInWeeks } from "date-fns";
import { it } from "date-fns/locale";
import { useAthleteAcwrData } from "@/hooks/useAthleteAcwrData";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis } from "recharts";

export default function AthleteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch athlete profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["athlete-profile", id],
    queryFn: async () => {
      if (!id) throw new Error("No athlete ID");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch active injuries
  const { data: injuries } = useQuery({
    queryKey: ["athlete-injuries", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("injuries")
        .select("*")
        .eq("athlete_id", id)
        .neq("status", "healed")
        .order("injury_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch current training phase
  const { data: currentPhase } = useQuery({
    queryKey: ["athlete-current-phase", id],
    queryFn: async () => {
      if (!id) return null;
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("training_phases")
        .select("*")
        .eq("athlete_id", id)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch latest workout for "Last Active"
  const { data: latestWorkout } = useQuery({
    queryKey: ["athlete-latest-workout", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("workout_logs")
        .select("completed_at")
        .eq("athlete_id", id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch today's readiness (daily_metrics)
  const { data: todayMetrics } = useQuery({
    queryKey: ["athlete-today-metrics", id],
    queryFn: async () => {
      if (!id) return null;
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("*")
        .eq("user_id", id)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch weight trend (30 days)
  const { data: weightTrend } = useQuery({
    queryKey: ["athlete-weight-trend", id],
    queryFn: async () => {
      if (!id) return [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("date, weight_kg")
        .eq("user_id", id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });
      
      if (error) throw error;
      return data?.filter(d => d.weight_kg !== null) || [];
    },
    enabled: !!id,
  });

  // Fetch this week's workouts for compliance
  const { data: weeklyWorkouts } = useQuery({
    queryKey: ["athlete-weekly-workouts", id],
    queryFn: async () => {
      if (!id) return [];
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
      const weekEnd = addDays(weekStart, 6);
      
      const { data, error } = await supabase
        .from("workout_logs")
        .select("completed_at, workout_id")
        .eq("athlete_id", id)
        .not("completed_at", "is", null)
        .gte("completed_at", weekStart.toISOString())
        .lte("completed_at", addDays(weekEnd, 1).toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch scheduled workouts for this week (for Program tab)
  const { data: scheduledWorkouts } = useQuery({
    queryKey: ["athlete-scheduled-workouts", id],
    queryFn: async () => {
      if (!id) return [];
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("athlete_id", id)
        .gte("scheduled_date", format(weekStart, "yyyy-MM-dd"))
        .lte("scheduled_date", format(weekEnd, "yyyy-MM-dd"))
        .order("scheduled_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch workout logs for scheduled workouts (to check completion status)
  const { data: workoutLogs } = useQuery({
    queryKey: ["athlete-workout-logs-week", id],
    queryFn: async () => {
      if (!id) return [];
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*, workout_id")
        .eq("athlete_id", id)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", addDays(weekEnd, 1).toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // ACWR Data
  const { data: acwrData, isLoading: acwrLoading } = useAthleteAcwrData(id);

  // Determine status
  const hasActiveInjuries = injuries && injuries.length > 0;
  const athleteStatus = hasActiveInjuries ? "injured" : "active";

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get neurotype label
  const getNeurotypeLabel = (neurotype: string | null) => {
    const types: Record<string, string> = {
      "1A": "1A - Dominant",
      "1B": "1B - Seeker",
      "2A": "2A - Balanced",
      "2B": "2B - Perfectionist",
      "3": "3 - Serotonin",
    };
    return neurotype ? types[neurotype] || neurotype : null;
  };

  // Calculate readiness score (based on available data)
  const calculateReadinessScore = () => {
    if (!todayMetrics) return null;
    
    // Use subjective_readiness if available, otherwise calculate from metrics
    if (todayMetrics.subjective_readiness) {
      return Math.round(todayMetrics.subjective_readiness * 10); // Scale 1-10 to 10-100
    }
    
    // Simple formula based on available metrics
    let score = 70; // Base score
    
    if (todayMetrics.sleep_hours) {
      if (todayMetrics.sleep_hours >= 7) score += 10;
      else if (todayMetrics.sleep_hours < 5) score -= 20;
    }
    
    if (todayMetrics.hrv_rmssd) {
      // Higher HRV is generally better
      if (todayMetrics.hrv_rmssd > 50) score += 10;
      else if (todayMetrics.hrv_rmssd < 30) score -= 10;
    }
    
    if (todayMetrics.resting_hr) {
      // Lower resting HR is generally better for athletes
      if (todayMetrics.resting_hr < 55) score += 5;
      else if (todayMetrics.resting_hr > 70) score -= 10;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  // Calculate TDEE (simplified estimation)
  const calculateTDEE = () => {
    const onboarding = profile?.onboarding_data as Record<string, unknown> | null;
    const weight = weightTrend?.length ? weightTrend[weightTrend.length - 1].weight_kg : (onboarding?.weight as number);
    const height = onboarding?.height as number;
    
    if (!weight) return null;
    
    // Simplified Harris-Benedict for male (we'd need gender for accuracy)
    // BMR = 88.362 + (13.397 × weight) + (4.799 × height) - (5.677 × age)
    const baseBMR = 88 + (13.4 * weight) + (height ? 4.8 * height : 800) - (5.7 * 30); // assuming 30 years
    const activityMultiplier = 1.55; // Moderately active
    
    return Math.round(baseBMR * activityMultiplier);
  };

  // Weekly compliance calculation
  const getWeeklyCompliance = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const today = new Date();
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayName = format(day, "EEE", { locale: it });
      const isFuture = isAfter(day, today);
      const isToday = isSameDay(day, today);
      
      // Check if workout was logged on this day
      const hasWorkout = weeklyWorkouts?.some(w => {
        if (!w.completed_at) return false;
        return isSameDay(new Date(w.completed_at), day);
      });
      
      let status: "completed" | "rest" | "missed" | "future" = "future";
      if (!isFuture) {
        status = hasWorkout ? "completed" : (isToday ? "rest" : "missed");
      }
      
      days.push({ day: dayName, date: day, status, isToday });
    }
    
    const completedDays = days.filter(d => d.status === "completed").length;
    const pastDays = days.filter(d => d.status !== "future").length;
    const adherence = pastDays > 0 ? Math.round((completedDays / Math.max(pastDays, 1)) * 100) : 0;
    
    return { days, adherence, completedDays };
  };

  // Get pain status
  const getPainStatus = () => {
    if (injuries && injuries.length > 0) {
      const primaryInjury = injuries[0];
      // Map status to severity display
      const severityMap: Record<string, string> = {
        "active": "moderate",
        "recovering": "mild",
        "healed": "none"
      };
      return {
        hasPain: true,
        location: primaryInjury.body_zone || "Unknown",
        severity: severityMap[primaryInjury.status] || "moderate",
        description: primaryInjury.description,
        count: injuries.length
      };
    }
    
    return { hasPain: false };
  };

  const readinessScore = calculateReadinessScore();
  const tdeeValue = calculateTDEE();
  const weeklyCompliance = getWeeklyCompliance();
  const painStatus = getPainStatus();

  // Readiness color based on score
  const getReadinessColor = (score: number | null) => {
    if (score === null) return { text: "text-muted-foreground", bg: "bg-muted", stroke: "stroke-muted-foreground" };
    if (score < 40) return { text: "text-destructive", bg: "bg-destructive/10", stroke: "stroke-destructive" };
    if (score < 70) return { text: "text-warning", bg: "bg-warning/10", stroke: "stroke-warning" };
    return { text: "text-success", bg: "bg-success/10", stroke: "stroke-success" };
  };

  const readinessColors = getReadinessColor(readinessScore);

  // Get weekly schedule for Program tab
  const getWeeklySchedule = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const today = new Date();
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dateStr = format(day, "yyyy-MM-dd");
      const isFuture = isAfter(day, today);
      const isToday = isSameDay(day, today);
      const isPast = isBefore(day, today) && !isToday;

      // Find scheduled workout for this day
      const scheduledWorkout = scheduledWorkouts?.find(
        w => w.scheduled_date === dateStr
      );

      // Check if workout was completed
      const completedLog = scheduledWorkout 
        ? workoutLogs?.find(log => log.workout_id === scheduledWorkout.id && log.completed_at)
        : null;

      let status: "completed" | "scheduled" | "missed" | "rest" = "rest";
      if (scheduledWorkout) {
        if (completedLog) {
          status = "completed";
        } else if (isPast) {
          status = "missed";
        } else {
          status = "scheduled";
        }
      }

      days.push({
        date: day,
        dateStr,
        dayName: format(day, "EEE", { locale: it }),
        dayNumber: format(day, "d"),
        isToday,
        isFuture,
        isPast,
        workout: scheduledWorkout,
        completedLog,
        status
      });
    }

    return days;
  };

  // Calculate phase progress
  const getPhaseProgress = () => {
    if (!currentPhase) return null;
    
    const start = new Date(currentPhase.start_date);
    const end = new Date(currentPhase.end_date);
    const today = new Date();
    
    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(today, start);
    const percentage = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));
    
    const totalWeeks = Math.ceil(differenceInWeeks(end, start)) || 1;
    const currentWeek = Math.min(Math.ceil(differenceInWeeks(today, start)) + 1, totalWeeks);
    
    return {
      percentage: Math.round(percentage),
      currentWeek,
      totalWeeks,
      daysRemaining: Math.max(0, differenceInDays(end, today))
    };
  };

  // Calculate weekly totals for stats footer
  const getWeeklyStats = () => {
    const schedule = getWeeklySchedule();
    let totalSets = 0;
    let focusTypes = new Set<string>();

    schedule.forEach(day => {
      if (day.workout) {
        const structure = day.workout.structure as Array<{ sets?: number }>;
        if (Array.isArray(structure)) {
          structure.forEach(exercise => {
            totalSets += exercise.sets || 0;
          });
        }
        // Add focus type from phase if available
        if (currentPhase?.focus_type) {
          focusTypes.add(currentPhase.focus_type);
        }
      }
    });

    const workoutsPlanned = schedule.filter(d => d.workout).length;
    const workoutsCompleted = schedule.filter(d => d.status === "completed").length;

    return {
      totalSets,
      focusTypes: Array.from(focusTypes),
      workoutsPlanned,
      workoutsCompleted
    };
  };

  const weeklySchedule = getWeeklySchedule();
  const phaseProgress = getPhaseProgress();
  const weeklyStats = getWeeklyStats();
  if (profileLoading) {
    return (
      <CoachLayout title="Caricamento..." subtitle="">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </CoachLayout>
    );
  }

  // Not found state
  if (!profile) {
    return (
      <CoachLayout title="Atleta non trovato" subtitle="">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Questo atleta non esiste o non hai accesso.</p>
          <Button onClick={() => navigate("/coach/athletes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna agli Atleti
          </Button>
        </Card>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout title="" subtitle="">
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/coach/athletes")}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna al Roster
        </Button>

        {/* Header Section */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Large Avatar */}
              <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl md:text-3xl font-bold">
                  {getInitials(profile.full_name || "A")}
                </AvatarFallback>
              </Avatar>

              {/* Info Section */}
              <div className="flex-1 space-y-4">
                {/* Name and Status */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {profile.full_name || "Nome non disponibile"}
                  </h1>
                  <Badge 
                    variant={athleteStatus === "injured" ? "destructive" : "secondary"}
                    className={cn(
                      "text-xs font-semibold px-3 py-1 w-fit",
                      athleteStatus === "active" && "bg-success/15 text-success border-success/30 hover:bg-success/20"
                    )}
                  >
                    {athleteStatus === "injured" ? (
                      <>
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        Infortunato
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Attivo
                      </>
                    )}
                  </Badge>
                </div>

                {/* Metadata Tags */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {profile.neurotype && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                      <span className="text-muted-foreground">Neurotype:</span>
                      <span className="font-medium text-foreground">{getNeurotypeLabel(profile.neurotype)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">Program:</span>
                    <span className="font-medium text-foreground">
                      {currentPhase?.name || "Nessun programma"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">Last Active:</span>
                    <span className="font-medium text-foreground">
                      {latestWorkout?.completed_at 
                        ? formatDistanceToNow(new Date(latestWorkout.completed_at), { addSuffix: true, locale: it })
                        : "Mai"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover">
                  <DropdownMenuItem className="cursor-pointer">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="bg-muted/50 p-1 h-auto flex-wrap md:flex-nowrap w-max md:w-full">
              <TabsTrigger value="overview" className="gap-2 text-xs md:text-sm px-3 py-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="program" className="gap-2 text-xs md:text-sm px-3 py-2">
                <Dumbbell className="h-4 w-4" />
                <span className="hidden sm:inline">Workout Program</span>
                <span className="sm:hidden">Program</span>
              </TabsTrigger>
              <TabsTrigger value="exercise-stats" className="gap-2 text-xs md:text-sm px-3 py-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Exercise Stats</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="advanced-stats" className="gap-2 text-xs md:text-sm px-3 py-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Advanced Stats</span>
                <span className="sm:hidden">Advanced</span>
              </TabsTrigger>
              <TabsTrigger value="body-metrics" className="gap-2 text-xs md:text-sm px-3 py-2">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">Body Metrics</span>
                <span className="sm:hidden">Metrics</span>
              </TabsTrigger>
              <TabsTrigger value="progress-pics" className="gap-2 text-xs md:text-sm px-3 py-2">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Progress Pics</span>
                <span className="sm:hidden">Photos</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 text-xs md:text-sm px-3 py-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab - Bento Grid */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Readiness & Load */}
              <Card className="md:col-span-1 lg:col-span-2 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Readiness & Load
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    {/* Circular Gauge for Readiness */}
                    <div className="relative flex-shrink-0">
                      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-muted/30"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(readinessScore || 0) * 2.64} 264`}
                          className={readinessColors.stroke}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cn("text-2xl font-bold tabular-nums", readinessColors.text)}>
                          {readinessScore ?? "—"}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Readiness
                        </span>
                      </div>
                    </div>

                    {/* ACWR Display */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">ACWR (Acute:Chronic)</p>
                        {acwrLoading ? (
                          <Skeleton className="h-10 w-20" />
                        ) : acwrData?.status === "insufficient-data" ? (
                          <p className="text-2xl font-bold text-muted-foreground">—</p>
                        ) : (
                          <div className="flex items-baseline gap-2">
                            <span className={cn(
                              "text-3xl font-bold tabular-nums",
                              acwrData?.status === "optimal" && "text-success",
                              acwrData?.status === "warning" && "text-warning",
                              acwrData?.status === "high-risk" && "text-destructive"
                            )}>
                              {acwrData?.ratio?.toFixed(2) || "—"}
                            </span>
                            <Badge variant="secondary" className={cn(
                              "text-[10px]",
                              acwrData?.status === "optimal" && "bg-success/10 text-success",
                              acwrData?.status === "warning" && "bg-warning/10 text-warning",
                              acwrData?.status === "high-risk" && "bg-destructive/10 text-destructive"
                            )}>
                              {acwrData?.label || "N/A"}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {acwrData && acwrData.status !== "insufficient-data" && (
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Acuto: <strong className="text-foreground">{acwrData.acuteLoad}</strong></span>
                          <span>Cronico: <strong className="text-foreground">{acwrData.chronicLoad}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Metabolism / TDEE */}
              <Card className="md:col-span-1 lg:col-span-2 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Metabolism (TDEE Tracker)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {/* TDEE Big Metric */}
                    <div className="flex-shrink-0 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Est. TDEE</p>
                      <p className="text-3xl font-bold text-foreground tabular-nums">
                        {tdeeValue ? tdeeValue.toLocaleString() : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">kcal/day</p>
                    </div>

                    {/* Weight Chart */}
                    <div className="flex-1 h-20">
                      {!weightTrend || weightTrend.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                          Nessun dato peso
                        </div>
                      ) : (
                        <ChartContainer
                          config={{
                            weight: { label: "Peso", color: "hsl(var(--primary))" },
                          }}
                          className="h-full w-full"
                        >
                          <AreaChart data={weightTrend}>
                            <defs>
                              <linearGradient id="weightGradientOverview" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" hide />
                            <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                              type="monotone"
                              dataKey="weight_kg"
                              stroke="hsl(var(--primary))"
                              fill="url(#weightGradientOverview)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ChartContainer>
                      )}
                    </div>
                  </div>
                  
                  {weightTrend && weightTrend.length > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                      <span>30d Min: <strong className="text-foreground">{Math.min(...weightTrend.map(w => w.weight_kg!))} kg</strong></span>
                      <span>Current: <strong className="text-foreground">{weightTrend[weightTrend.length - 1].weight_kg} kg</strong></span>
                      <span>30d Max: <strong className="text-foreground">{Math.max(...weightTrend.map(w => w.weight_kg!))} kg</strong></span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 3: Weekly Compliance */}
              <Card className="md:col-span-1 lg:col-span-2 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Weekly Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Week dots */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    {weeklyCompliance.days.map((day, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">
                          {day.day.slice(0, 2)}
                        </span>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                          day.status === "completed" && "bg-success text-success-foreground",
                          day.status === "rest" && "bg-muted text-muted-foreground",
                          day.status === "missed" && "bg-destructive/20 text-destructive border-2 border-destructive/50",
                          day.status === "future" && "bg-muted/30 text-muted-foreground/50 border border-dashed border-muted-foreground/30",
                          day.isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        )}>
                          {day.status === "completed" && <CheckCircle2 className="h-4 w-4" />}
                          {day.status === "missed" && <XCircle className="h-4 w-4" />}
                          {day.status === "rest" && <span className="text-xs">—</span>}
                          {day.status === "future" && <span className="text-xs">•</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Adherence percentage */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">Weekly Adherence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            weeklyCompliance.adherence >= 80 && "bg-success",
                            weeklyCompliance.adherence >= 50 && weeklyCompliance.adherence < 80 && "bg-warning",
                            weeklyCompliance.adherence < 50 && "bg-destructive"
                          )}
                          style={{ width: `${weeklyCompliance.adherence}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-lg font-bold tabular-nums",
                        weeklyCompliance.adherence >= 80 && "text-success",
                        weeklyCompliance.adherence >= 50 && weeklyCompliance.adherence < 80 && "text-warning",
                        weeklyCompliance.adherence < 50 && "text-destructive"
                      )}>
                        {weeklyCompliance.adherence}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Pain Status */}
              <Card className={cn(
                "md:col-span-1 lg:col-span-2 overflow-hidden transition-colors",
                painStatus.hasPain && "border-destructive/50 bg-destructive/5"
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Heart className={cn("h-4 w-4", painStatus.hasPain ? "text-destructive" : "text-success")} />
                    Pain Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {painStatus.hasPain ? (
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-7 w-7 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-destructive text-lg">Active Issue Detected</p>
                        <p className="text-sm text-muted-foreground">
                          {'location' in painStatus && String(painStatus.location)}:{' '}
                          <span className="capitalize font-medium text-foreground">
                            {'severity' in painStatus && String(painStatus.severity)}
                          </span>
                        </p>
                        {'count' in painStatus && typeof painStatus.count === 'number' && painStatus.count > 1 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{painStatus.count - 1} altri infortuni attivi
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle2 className="h-7 w-7 text-success" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-success text-lg">All Clear ✅</p>
                        <p className="text-sm text-muted-foreground">
                          Nessun infortunio o dolore segnalato
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Program Tab - Weekly Microcycle */}
          <TabsContent value="program" className="space-y-6">
            {/* 1. Active Phase Header */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {currentPhase?.name || "Nessun Programma Attivo"}
                      </CardTitle>
                      {currentPhase && (
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(currentPhase.start_date), "d MMM", { locale: it })} - {format(new Date(currentPhase.end_date), "d MMM yyyy", { locale: it })}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate(`/coach/programs?athlete=${id}`)}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Open Program Builder
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {phaseProgress && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Week {phaseProgress.currentWeek} of {phaseProgress.totalWeeks}
                      </span>
                      <span className="font-medium text-foreground">
                        {phaseProgress.daysRemaining} days remaining
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${phaseProgress.percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
              {!currentPhase && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    Nessuna fase di allenamento attiva. Crea un programma per questo atleta.
                  </p>
                </CardContent>
              )}
            </Card>

            {/* 2. Weekly Microcycle Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Settimana Corrente
              </h3>
              
              {/* Desktop Grid */}
              <div className="hidden md:grid md:grid-cols-7 gap-3">
                {weeklySchedule.map((day, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "rounded-xl border transition-all",
                      day.isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      day.isFuture && "opacity-60"
                    )}
                  >
                    {/* Day Header */}
                    <div className={cn(
                      "px-3 py-2 border-b text-center",
                      day.isToday ? "bg-primary/10" : "bg-muted/30"
                    )}>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        {day.dayName}
                      </p>
                      <p className={cn(
                        "text-lg font-bold",
                        day.isToday ? "text-primary" : "text-foreground"
                      )}>
                        {day.dayNumber}
                      </p>
                    </div>

                    {/* Day Content */}
                    <div className="p-3 min-h-[140px]">
                      {day.workout ? (
                        <div className="space-y-2">
                          {/* Status Indicator */}
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center mx-auto",
                            day.status === "completed" && "bg-success text-success-foreground",
                            day.status === "missed" && "bg-destructive text-destructive-foreground",
                            day.status === "scheduled" && "bg-primary/20 text-primary"
                          )}>
                            {day.status === "completed" && <CheckCircle2 className="h-4 w-4" />}
                            {day.status === "missed" && <XCircle className="h-4 w-4" />}
                            {day.status === "scheduled" && <Dumbbell className="h-3 w-3" />}
                          </div>

                          {/* Workout Info */}
                          <div className="text-center">
                            <p className="text-sm font-medium line-clamp-2">
                              {day.workout.title}
                            </p>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap justify-center gap-1">
                            {day.workout.estimated_duration && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                <Clock className="h-2.5 w-2.5 mr-0.5" />
                                {day.workout.estimated_duration}m
                              </Badge>
                            )}
                            {currentPhase?.focus_type && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                                {currentPhase.focus_type.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                          <Coffee className="h-6 w-6 mb-1" />
                          <span className="text-xs">Rest Day</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Stack */}
              <div className="md:hidden space-y-2">
                {weeklySchedule.map((day, idx) => (
                  <Card 
                    key={idx}
                    className={cn(
                      "overflow-hidden transition-all",
                      day.isToday && "ring-2 ring-primary",
                      day.isFuture && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Date Column */}
                      <div className={cn(
                        "w-14 h-14 rounded-lg flex flex-col items-center justify-center flex-shrink-0",
                        day.isToday ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <span className="text-[10px] uppercase font-medium">
                          {day.dayName}
                        </span>
                        <span className="text-xl font-bold">{day.dayNumber}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {day.workout ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{day.workout.title}</p>
                              {day.status === "completed" && (
                                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                              )}
                              {day.status === "missed" && (
                                <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {day.workout.estimated_duration && (
                                <span className="text-xs text-muted-foreground">
                                  {day.workout.estimated_duration} min
                                </span>
                              )}
                              {currentPhase?.focus_type && (
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {currentPhase.focus_type.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Coffee className="h-4 w-4" />
                            <span className="text-sm">Rest Day</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* 3. Quick Stats Footer */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{weeklyStats.totalSets}</p>
                      <p className="text-xs text-muted-foreground">Total Sets</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {weeklyStats.workoutsCompleted}/{weeklyStats.workoutsPlanned}
                      </p>
                      <p className="text-xs text-muted-foreground">Workouts</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Focus:</span>
                    {weeklyStats.focusTypes.length > 0 ? (
                      weeklyStats.focusTypes.map((focus, idx) => (
                        <Badge key={idx} variant="secondary" className="capitalize">
                          {focus.replace('_', ' ')}
                        </Badge>
                      ))
                    ) : currentPhase?.focus_type ? (
                      <Badge variant="secondary" className="capitalize">
                        {currentPhase.focus_type.replace('_', ' ')}
                      </Badge>
                    ) : (
                      <Badge variant="outline">None</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exercise-stats" className="space-y-6">
            <Card className="p-8 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Exercise Stats</h3>
              <p className="text-muted-foreground">
                Statistiche dettagliate per ogni esercizio: PR, volume, progressione.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="advanced-stats" className="space-y-6">
            <Card className="p-8 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Advanced Stats</h3>
              <p className="text-muted-foreground">
                Analisi avanzate: frequenza, volume settimanale, distribuzione muscolare.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="body-metrics" className="space-y-6">
            <Card className="p-8 text-center">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Body Metrics</h3>
              <p className="text-muted-foreground">
                Trend peso, composizione corporea, circonferenze.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="progress-pics" className="space-y-6">
            <Card className="p-8 text-center">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Progress Pics</h3>
              <p className="text-muted-foreground">
                Galleria foto di progressione fisica nel tempo.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p className="text-muted-foreground">
                Impostazioni profilo atleta, notifiche, e gestione account.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CoachLayout>
  );
}
