import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Dumbbell,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay,
  isToday
} from "date-fns";
import { it } from "date-fns/locale";

interface ScheduledWorkout {
  id: string;
  title: string;
  athlete_id: string;
  athlete_name: string;
  avatar_initials: string;
  avatar_url: string | null;
  scheduled_date: string;
  status: string;
}

// Day names
const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function CoachCalendar() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Fetch workouts for the current month
  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ["calendar-workouts", user?.id, monthStart, monthEnd],
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
          profiles!workouts_athlete_id_fkey(full_name, avatar_url)
        `)
        .eq("coach_id", user.id)
        .gte("scheduled_date", monthStart)
        .lte("scheduled_date", monthEnd)
        .order("scheduled_date", { ascending: true });
      
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
        avatar_url: w.profiles?.avatar_url,
        scheduled_date: w.scheduled_date,
        status: w.status,
      })) as ScheduledWorkout[];
    },
    enabled: !!user && profile?.role === "coach",
  });

  // Group workouts by date
  const workoutsByDate = useMemo(() => {
    const grouped: Record<string, ScheduledWorkout[]> = {};
    workouts.forEach(workout => {
      const dateKey = workout.scheduled_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(workout);
    });
    return grouped;
  }, [workouts]);

  // Get days for the calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    // Adjust for Monday start
    let startDay = getDay(start);
    startDay = startDay === 0 ? 6 : startDay - 1; // Convert to Monday = 0
    
    // Add padding days from previous month
    const paddingDays = Array(startDay).fill(null);
    
    return [...paddingDays, ...days];
  }, [currentMonth]);

  // Get workouts for selected date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayWorkouts = workoutsByDate[selectedDateKey] ?? [];

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <CoachLayout title="Calendar" subtitle="Panoramica allenamenti programmati">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* ===== MONTH VIEW CALENDAR ===== */}
          <Card className="xl:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-lg font-semibold capitalize min-w-[180px] text-center">
                    {format(currentMonth, "MMMM yyyy", { locale: it })}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMonth(new Date());
                    setSelectedDate(new Date());
                  }}
                >
                  Oggi
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }
                  
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayWorkouts = workoutsByDate[dateKey] ?? [];
                  const hasWorkouts = dayWorkouts.length > 0;
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isTodayDate = isToday(day);
                  
                  // Calculate intensity (more workouts = more intense color)
                  const intensity = Math.min(dayWorkouts.length, 5);
                  
                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "aspect-square p-1 rounded-lg transition-all relative flex flex-col items-center justify-center gap-0.5",
                        "hover:bg-muted/50",
                        !isCurrentMonth && "opacity-40",
                        isSelected && "ring-2 ring-primary bg-primary/10",
                        isTodayDate && !isSelected && "bg-muted"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-medium",
                        isTodayDate && "text-primary font-bold"
                      )}>
                        {format(day, "d")}
                      </span>
                      
                      {/* Workout Dots */}
                      {hasWorkouts && (
                        <div className="flex gap-0.5 absolute bottom-1">
                          {dayWorkouts.slice(0, 3).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                intensity >= 4 ? "bg-destructive" :
                                intensity >= 2 ? "bg-warning" : "bg-primary"
                              )}
                            />
                          ))}
                          {dayWorkouts.length > 3 && (
                            <span className="text-[8px] text-muted-foreground font-medium">
                              +{dayWorkouts.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>1 workout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <span>2-3 workouts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <span>4+ workouts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===== SELECTED DAY DETAILS ===== */}
          <Card className="xl:col-span-1 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold capitalize">
                  {format(selectedDate, "EEEE d MMMM", { locale: it })}
                </CardTitle>
                <Badge variant="secondary" className="tabular-nums">
                  {selectedDayWorkouts.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : selectedDayWorkouts.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <CalendarDays className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nessun allenamento programmato
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
                <ScrollArea className="max-h-[400px]">
                  <div className="p-2 space-y-2">
                    {selectedDayWorkouts.map((workout) => (
                      <div
                        key={workout.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/coach/athlete/${workout.athlete_id}`)}
                      >
                        <Avatar className="h-10 w-10 border-2 border-border">
                          <AvatarImage src={workout.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {workout.avatar_initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {workout.athlete_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {workout.title}
                          </p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[10px] shrink-0",
                            workout.status === "completed" && "bg-success/10 text-success",
                            workout.status === "in_progress" && "bg-warning/10 text-warning",
                            workout.status === "pending" && "bg-muted text-muted-foreground"
                          )}
                        >
                          {workout.status === "completed" ? "Completato" :
                           workout.status === "in_progress" ? "In corso" : "Pendente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

        </div>

        {/* ===== UPCOMING WEEK PREVIEW ===== */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Prossimi 7 giorni
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const day = new Date();
                day.setDate(day.getDate() + i);
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayWorkouts = workoutsByDate[dateKey] ?? [];
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "text-center p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/30 transition-colors",
                      i === 0 && "bg-primary/5 border-primary/30"
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {format(day, "EEE", { locale: it })}
                    </p>
                    <p className="text-lg font-semibold tabular-nums mt-0.5">
                      {format(day, "d")}
                    </p>
                    {dayWorkouts.length > 0 ? (
                      <div className="flex justify-center gap-0.5 mt-1">
                        <Dumbbell className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-medium text-primary">
                          {dayWorkouts.length}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1">—</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
}
