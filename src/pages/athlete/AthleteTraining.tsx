import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  isToday, 
  isPast, 
  addWeeks
} from "date-fns";
import { it } from "date-fns/locale";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Play, 
  Clock, 
  Dumbbell,
  Calendar,
  Lock,
  Flame,
  Plus,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReadiness } from "@/hooks/useReadiness";
import { SessionBuilderDialog } from "@/components/athlete/SessionBuilderDialog";

interface WorkoutLog {
  id: string;
  scheduled_date: string;
  status: string;
  completed_at: string | null;
  duration_minutes: number | null;
  workouts?: {
    id: string;
    title: string;
    structure: any[];
  } | null;
}

export default function AthleteTraining() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [showSessionBuilder, setShowSessionBuilder] = useState(false);
  const [showReadinessPrompt, setShowReadinessPrompt] = useState(false);
  
  const { readiness } = useReadiness();
  const canTrain = readiness.isCompleted;

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Get coach info (brand color + coach_id)
  const { data: athleteProfile } = useQuery({
    queryKey: ["athlete-profile-with-coach", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("coach_id")
        .eq("id", user.id)
        .single();
      return profile;
    },
    enabled: !!user,
  });

  const { data: brandColor } = useQuery({
    queryKey: ["athlete-brand-color", athleteProfile?.coach_id],
    queryFn: async () => {
      if (!athleteProfile?.coach_id) return null;
      const { data: coach } = await supabase
        .from("profiles")
        .select("brand_color")
        .eq("id", athleteProfile.coach_id)
        .single();
      return coach?.brand_color || null;
    },
    enabled: !!athleteProfile?.coach_id,
  });

  // Calculate week dates based on offset
  const weekDates = useMemo(() => {
    const baseDate = weekOffset === 0 ? new Date() : addWeeks(new Date(), weekOffset);
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekOffset]);

  // Fetch workout logs for the visible week
  const { data: workoutLogs = [], isLoading } = useQuery({
    queryKey: ["athlete-week-workouts", user?.id, weekDates[0]?.toISOString()],
    queryFn: async () => {
      if (!user) return [];
      
      const weekStart = format(weekDates[0], "yyyy-MM-dd");
      const weekEnd = format(weekDates[6], "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("workout_logs")
        .select(`
          id,
          scheduled_date,
          status,
          completed_at,
          duration_minutes,
          workouts (
            id,
            title,
            structure
          )
        `)
        .eq("athlete_id", user.id)
        .gte("scheduled_date", weekStart)
        .lte("scheduled_date", weekEnd)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return (data || []) as WorkoutLog[];
    },
    enabled: !!user,
  });

  // Group workouts by date
  const workoutsByDate = useMemo(() => {
    const map = new Map<string, WorkoutLog[]>();
    workoutLogs.forEach((log) => {
      const dateKey = log.scheduled_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(log);
    });
    return map;
  }, [workoutLogs]);

  // Get workouts for selected date
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedWorkouts = workoutsByDate.get(selectedDateKey) || [];

  const handlePrevWeek = () => setWeekOffset((prev) => prev - 1);
  const handleNextWeek = () => setWeekOffset((prev) => prev + 1);
  const handleToday = () => {
    setWeekOffset(0);
    setSelectedDate(new Date());
  };

  // Handle FAB click - check readiness first
  const handleFreeSessionClick = () => {
    if (!canTrain) {
      setShowReadinessPrompt(true);
      return;
    }
    setShowSessionBuilder(true);
  };

  const getWorkoutStatus = (log: WorkoutLog) => {
    if (log.status === "completed" || log.completed_at) return "completed";
    if (log.status === "missed") return "missed";
    
    const logDate = new Date(log.scheduled_date);
    if (isToday(logDate)) return "today";
    if (isPast(logDate)) return "missed";
    return "scheduled";
  };

  return (
    <AthleteLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Allenamenti</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="text-xs"
              style={{ color: brandColor || undefined }}
            >
              Oggi
            </Button>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              {format(weekDates[0], "d MMM", { locale: it })} - {format(weekDates[6], "d MMM yyyy", { locale: it })}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Week Strip */}
        <div className="px-4 pb-4">
          <div className="flex gap-1">
            {weekDates.map((date) => {
              const dateKey = format(date, "yyyy-MM-dd");
              const hasWorkout = workoutsByDate.has(dateKey);
              const workouts = workoutsByDate.get(dateKey) || [];
              const isSelected = isSameDay(date, selectedDate);
              const isCurrentDay = isToday(date);
              
              // Determine dot color based on workout status
              let dotColor = "bg-primary";
              if (hasWorkout) {
                const statuses = workouts.map(getWorkoutStatus);
                if (statuses.every((s) => s === "completed")) {
                  dotColor = "bg-green-500";
                } else if (statuses.some((s) => s === "missed")) {
                  dotColor = "bg-red-500";
                } else if (statuses.some((s) => s === "today")) {
                  dotColor = "bg-amber-500";
                }
              }

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex-1 flex flex-col items-center py-2 rounded-xl transition-all duration-200",
                    isSelected 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : isCurrentDay 
                        ? "bg-primary/10" 
                        : "hover:bg-muted/50"
                  )}
                  style={isSelected && brandColor ? { backgroundColor: brandColor } : undefined}
                >
                  <span className={cn(
                    "text-[10px] uppercase font-medium mb-1",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {format(date, "EEE", { locale: it })}
                  </span>
                  <span className={cn(
                    "text-lg font-semibold",
                    isSelected ? "text-primary-foreground" : ""
                  )}>
                    {format(date, "d")}
                  </span>
                  {/* Workout indicator dot */}
                  <div className="h-1.5 mt-1">
                    {hasWorkout && (
                      <div 
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isSelected ? "bg-primary-foreground" : dotColor
                        )}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Content */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 pb-24">
            {/* Date Header */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {format(selectedDate, "EEEE d MMMM", { locale: it })}
              </span>
              {isToday(selectedDate) && (
                <Badge variant="secondary" className="text-xs">Oggi</Badge>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : selectedWorkouts.length === 0 ? (
              /* Empty state with Free Session option */
              <Card className="p-6 border-dashed">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Calendar className="h-8 w-8 opacity-50" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Nessun allenamento programmato</p>
                    <p className="text-xs opacity-70 mt-0.5">Giorno di riposo 💪</p>
                  </div>
                  
                  {isToday(selectedDate) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-2"
                      onClick={handleFreeSessionClick}
                    >
                      <Dumbbell className="h-4 w-4" />
                      Inizia sessione libera
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <>
                {selectedWorkouts.map((log) => {
                  const status = getWorkoutStatus(log);
                  
                  return (
                    <WorkoutCard
                      key={log.id}
                      log={log}
                      status={status}
                      brandColor={brandColor}
                      canTrain={canTrain}
                      onStart={() => navigate(`/athlete/workout/${log.workouts?.id || log.id}`)}
                      onViewDetails={() => navigate(`/athlete/workout/${log.workouts?.id || log.id}`)}
                    />
                  );
                })}
                
                {/* Free Session Card - only for today */}
                {isToday(selectedDate) && (
                  <FreeSessionCard
                    brandColor={brandColor}
                    canTrain={canTrain}
                    onStart={handleFreeSessionClick}
                  />
                )}
              </>
            )}
          </div>
        </ScrollArea>


        {/* Readiness Required Prompt */}
        {showReadinessPrompt && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowReadinessPrompt(false)}
          >
            <Card 
              className="p-6 max-w-sm w-full space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-2">
                <div 
                  className="h-14 w-14 rounded-full mx-auto flex items-center justify-center"
                  style={{ backgroundColor: brandColor ? `${brandColor}20` : "hsl(var(--primary) / 0.1)" }}
                >
                  <Zap 
                    className="h-7 w-7" 
                    style={{ color: brandColor || "hsl(var(--primary))" }}
                  />
                </div>
                <h3 className="font-semibold text-lg">Check-in Richiesto</h3>
                <p className="text-sm text-muted-foreground">
                  Completa il check-in mattutino per iniziare una sessione libera.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowReadinessPrompt(false)}
                >
                  Annulla
                </Button>
                <Button
                  className="flex-1"
                  style={{ backgroundColor: brandColor || undefined }}
                  onClick={() => {
                    setShowReadinessPrompt(false);
                    navigate("/athlete");
                  }}
                >
                  Vai al Check-in
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Session Builder Dialog */}
        <SessionBuilderDialog
          open={showSessionBuilder}
          onOpenChange={setShowSessionBuilder}
          coachId={athleteProfile?.coach_id || null}
          athleteId={user?.id || ""}
          brandColor={brandColor}
        />
      </div>
    </AthleteLayout>
  );
}

// Workout Card Component
interface WorkoutCardProps {
  log: WorkoutLog;
  status: "completed" | "today" | "scheduled" | "missed";
  brandColor: string | null;
  canTrain: boolean;
  onStart: () => void;
  onViewDetails: () => void;
}

function WorkoutCard({ log, status, brandColor, canTrain, onStart, onViewDetails }: WorkoutCardProps) {
  const workoutName = log.workouts?.title || "Allenamento";
  const structure = log.workouts?.structure || [];
  const exerciseCount = structure.length;

  // Completed workout card
  if (status === "completed") {
    return (
      <Card className="p-4 border-success/30 bg-success/5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="h-5 w-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">{workoutName}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {log.duration_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {log.duration_minutes} min
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-success border-success/30">
            Completato
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-3 text-success"
          onClick={onViewDetails}
        >
          Vedi dettagli
        </Button>
      </Card>
    );
  }

  // Missed workout card
  if (status === "missed") {
    return (
      <Card className="p-4 border-destructive/30 bg-destructive/5 opacity-70">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <Flame className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">{workoutName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {exerciseCount} esercizi
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-destructive border-destructive/30">
            Saltato
          </Badge>
        </div>
      </Card>
    );
  }

  // Today's workout card
  if (status === "today") {
    return (
      <Card 
        className="p-4 border-2 relative overflow-hidden"
        style={{ borderColor: brandColor || "hsl(var(--primary))" }}
      >
        {/* Gradient accent */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: brandColor ? `linear-gradient(90deg, ${brandColor}, ${brandColor}80)` : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.5))" }}
        />
        
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: brandColor ? `${brandColor}20` : "hsl(var(--primary) / 0.1)" }}
            >
              <Dumbbell 
                className="h-5 w-5" 
                style={{ color: brandColor || "hsl(var(--primary))" }}
              />
            </div>
            <div>
              <h3 className="font-semibold">{workoutName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {exerciseCount} esercizi programmati
              </p>
            </div>
          </div>
        </div>

        {/* Exercise preview */}
        {exerciseCount > 0 && (
          <div className="mb-4 pl-13">
            <div className="space-y-1">
              {structure.slice(0, 3).map((ex: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  <span className="truncate">
                    {ex.exercise_name || ex.name} - {ex.sets}×{ex.reps}
                  </span>
                </div>
              ))}
              {exerciseCount > 3 && (
                <p className="text-xs text-muted-foreground opacity-70">
                  +{exerciseCount - 3} altri esercizi
                </p>
              )}
            </div>
          </div>
        )}

        <Button 
          className="w-full gap-2"
          style={{ backgroundColor: brandColor || undefined }}
          onClick={onStart}
          disabled={!canTrain}
        >
          {!canTrain ? (
            <>
              <Lock className="h-4 w-4" />
              Check-in richiesto
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Inizia allenamento
            </>
          )}
        </Button>
      </Card>
    );
  }

  // Future/scheduled workout card (read-only)
  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-muted-foreground">{workoutName}</h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {exerciseCount} esercizi programmati
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          In programma
        </Badge>
      </div>

      {/* Exercise preview */}
      {exerciseCount > 0 && (
        <div className="space-y-1 pl-13">
          {structure.slice(0, 4).map((ex: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground/70">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span className="truncate">
                {ex.exercise_name || ex.name} - {ex.sets}×{ex.reps}
              </span>
            </div>
          ))}
          {exerciseCount > 4 && (
            <p className="text-xs text-muted-foreground/50">
              +{exerciseCount - 4} altri
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// Free Session Card Component
interface FreeSessionCardProps {
  brandColor: string | null;
  canTrain: boolean;
  onStart: () => void;
}

function FreeSessionCard({ brandColor, canTrain, onStart }: FreeSessionCardProps) {
  return (
    <Card 
      className={cn(
        "p-4 border-2 border-dashed transition-all duration-200 cursor-pointer group",
        canTrain 
          ? "hover:border-primary hover:bg-primary/5" 
          : "opacity-60"
      )}
      style={canTrain && brandColor ? { borderColor: `${brandColor}50` } : undefined}
      onClick={onStart}
    >
      <div className="flex items-center gap-4">
        <div 
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
            canTrain ? "bg-primary/10 group-hover:bg-primary/20" : "bg-muted"
          )}
          style={canTrain && brandColor ? { backgroundColor: `${brandColor}15` } : undefined}
        >
          {canTrain ? (
            <Zap 
              className="h-5 w-5" 
              style={{ color: brandColor || "hsl(var(--primary))" }}
            />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className={cn(
            "font-semibold",
            !canTrain && "text-muted-foreground"
          )}>
            Sessione Libera
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {canTrain 
              ? "Crea un allenamento personalizzato" 
              : "Completa il check-in per sbloccare"
            }
          </p>
        </div>

        <div 
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
            canTrain 
              ? "bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground" 
              : "bg-muted text-muted-foreground"
          )}
          style={canTrain && brandColor ? { backgroundColor: `${brandColor}15` } : undefined}
        >
          {canTrain ? (
            <Plus className="h-5 w-5" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
        </div>
      </div>
    </Card>
  );
}
