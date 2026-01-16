import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  FolderOpen,
  Calendar,
  Dumbbell,
  GripVertical,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgramPlan {
  id: string;
  name: string;
  description: string | null;
  is_template: boolean;
}

interface ProgramWeek {
  id: string;
  program_plan_id: string;
  week_order: number;
  name: string | null;
}

interface ProgramDay {
  id: string;
  program_week_id: string;
  day_number: number;
  name: string | null;
}

interface ProgramWorkout {
  id: string;
  program_day_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  day_number?: number; // Added for scheduling context
}

interface WeekWithWorkouts extends ProgramWeek {
  workouts: ProgramWorkout[];
  days: ProgramDay[];
}

interface PlanWithWeeks extends ProgramPlan {
  weeks: WeekWithWorkouts[];
}

// Draggable Workout Item
function DraggableWorkout({
  workout,
  weekId,
  planId,
}: {
  workout: ProgramWorkout;
  weekId: string;
  planId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `calendar-workout-${workout.id}`,
      data: {
        type: "calendar-workout",
        workout,
        weekId,
        planId,
      },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-grab active:cursor-grabbing group",
        isDragging && "ring-2 ring-primary shadow-lg"
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      <Dumbbell className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="text-xs font-medium truncate flex-1">
        {workout.name}
      </span>
      {workout.day_number !== undefined && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
          G{workout.day_number}
        </Badge>
      )}
    </div>
  );
}

// Draggable Week Item (for Smart Paste)
function DraggableWeek({
  week,
  planId,
  workoutCount,
}: {
  week: ProgramWeek;
  planId: string;
  workoutCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `calendar-week-${week.id}`,
      data: {
        type: "calendar-week",
        week,
        planId,
      },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded bg-primary/5 hover:bg-primary/10 cursor-grab active:cursor-grabbing transition-colors",
        isDragging && "ring-2 ring-primary shadow-lg"
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
      <Calendar className="h-3 w-3 text-primary shrink-0" />
      <span className="text-xs font-medium flex-1">
        {week.name || `Settimana ${week.week_order}`}
      </span>
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
        {workoutCount}
      </Badge>
    </div>
  );
}

export function ProgramsDrawer() {
  const { user } = useAuth();
  const [expandedPlans, setExpandedPlans] = useState<string[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([]);

  // Fetch all program plans with nested structure
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["calendar-programs", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // 1. Fetch all program plans
      const { data: plans, error: plansError } = await supabase
        .from("program_plans")
        .select("*")
        .eq("coach_id", user.id)
        .order("updated_at", { ascending: false });

      if (plansError) throw plansError;
      if (!plans?.length) return [];

      // 2. Fetch all weeks for these plans
      const planIds = plans.map((p) => p.id);
      const { data: weeks, error: weeksError } = await supabase
        .from("program_weeks")
        .select("*")
        .in("program_plan_id", planIds)
        .order("week_order", { ascending: true });

      if (weeksError) throw weeksError;

      // 3. Fetch all days for these weeks
      const weekIds = weeks?.map((w) => w.id) || [];
      const { data: days, error: daysError } = await supabase
        .from("program_days")
        .select("*")
        .in("program_week_id", weekIds)
        .order("day_number", { ascending: true });

      if (daysError) throw daysError;

      // 4. Fetch all workouts for these days
      const dayIds = days?.map((d) => d.id) || [];
      const { data: workouts, error: workoutsError } = await supabase
        .from("program_workouts")
        .select("*")
        .in("program_day_id", dayIds)
        .order("sort_order", { ascending: true });

      if (workoutsError) throw workoutsError;

      // 5. Build nested structure
      const daysMap = new Map<string, ProgramDay[]>();
      days?.forEach((day) => {
        const existing = daysMap.get(day.program_week_id) || [];
        existing.push(day);
        daysMap.set(day.program_week_id, existing);
      });

      const workoutsMap = new Map<string, ProgramWorkout[]>();
      workouts?.forEach((workout) => {
        // Find day number for this workout
        const day = days?.find((d) => d.id === workout.program_day_id);
        const workoutWithDay = { ...workout, day_number: day?.day_number };

        const existing = workoutsMap.get(workout.program_day_id) || [];
        existing.push(workoutWithDay);
        workoutsMap.set(workout.program_day_id, existing);
      });

      // Group workouts by week (flatten from days)
      const weekWorkoutsMap = new Map<string, ProgramWorkout[]>();
      weeks?.forEach((week) => {
        const weekDays = daysMap.get(week.id) || [];
        const allWorkouts: ProgramWorkout[] = [];
        weekDays.forEach((day) => {
          const dayWorkouts = workoutsMap.get(day.id) || [];
          allWorkouts.push(...dayWorkouts);
        });
        weekWorkoutsMap.set(week.id, allWorkouts);
      });

      // Build final structure
      const result: PlanWithWeeks[] = plans.map((plan) => {
        const planWeeks =
          weeks?.filter((w) => w.program_plan_id === plan.id) || [];
        return {
          ...plan,
          weeks: planWeeks.map((week) => ({
            ...week,
            days: daysMap.get(week.id) || [],
            workouts: weekWorkoutsMap.get(week.id) || [],
          })),
        };
      });

      return result;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!programs.length) {
    return (
      <div className="p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <FolderOpen className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Nessun programma</p>
        <p className="text-xs text-muted-foreground mt-1">
          Crea un programma nel Program Builder
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <Accordion
          type="multiple"
          value={expandedPlans}
          onValueChange={setExpandedPlans}
          className="space-y-2"
        >
          {programs.map((plan) => (
            <AccordionItem
              key={plan.id}
              value={plan.id}
              className="border rounded-lg bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-2 text-left">
                  <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{plan.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {plan.weeks.length} settimane
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2">
                <Accordion
                  type="multiple"
                  value={expandedWeeks}
                  onValueChange={setExpandedWeeks}
                  className="space-y-1"
                >
                  {plan.weeks.map((week) => (
                    <AccordionItem
                      key={week.id}
                      value={week.id}
                      className="border-0"
                    >
                      {/* Draggable Week Header */}
                      <div className="flex items-center gap-1">
                        <DraggableWeek
                          week={week}
                          planId={plan.id}
                          workoutCount={week.workouts.length}
                        />
                        <AccordionTrigger className="p-1 hover:no-underline hover:bg-muted/50 rounded [&>svg]:hidden">
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="pt-1 pl-4 space-y-1">
                        {week.workouts.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground px-2 py-1">
                            Nessun workout
                          </p>
                        ) : (
                          week.workouts.map((workout) => (
                            <DraggableWorkout
                              key={workout.id}
                              workout={workout}
                              weekId={week.id}
                              planId={plan.id}
                            />
                          ))
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </ScrollArea>
  );
}
