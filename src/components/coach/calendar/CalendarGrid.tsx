import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Clock,
  CheckCircle2,
  XCircle,
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
  isToday,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachHourOfInterval,
  setHours,
} from "date-fns";
import { it } from "date-fns/locale";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export interface ScheduledWorkoutLog {
  id: string;
  status: "scheduled" | "completed" | "missed";
  scheduled_date: string;
  scheduled_start_time: string | null;
  workout_name: string;
  athlete_id: string;
  athlete_name: string;
  avatar_url: string | null;
  program_workout_id: string | null;
}

interface CalendarGridProps {
  workoutLogs: ScheduledWorkoutLog[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  view: "month" | "week" | "day";
  onViewChange: (view: "month" | "week" | "day") => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

// Droppable Day Cell
function DroppableDayCell({
  date,
  isSelected,
  isCurrentMonth,
  isTodayDate,
  workouts,
  onClick,
}: {
  date: Date;
  isSelected: boolean;
  isCurrentMonth: boolean;
  isTodayDate: boolean;
  workouts: ScheduledWorkoutLog[];
  onClick: () => void;
}) {
  const dateKey = format(date, "yyyy-MM-dd");
  const { isOver, setNodeRef } = useDroppable({
    id: `calendar-day-${dateKey}`,
    data: { type: "calendar-day", date, dateKey },
  });

  const hasWorkouts = workouts.length > 0;
  const scheduledCount = workouts.filter((w) => w.status === "scheduled").length;
  const completedCount = workouts.filter((w) => w.status === "completed").length;

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "min-h-[80px] p-1.5 rounded-lg transition-all relative flex flex-col border",
        "hover:bg-muted/50",
        !isCurrentMonth && "opacity-40",
        isSelected && "ring-2 ring-primary bg-primary/5",
        isTodayDate && !isSelected && "bg-muted/80",
        isOver && "ring-2 ring-primary bg-primary/10 scale-[1.02]",
        "border-border/30"
      )}
    >
      <span
        className={cn(
          "text-sm font-medium self-start",
          isTodayDate && "text-primary font-bold"
        )}
      >
        {format(date, "d")}
      </span>

      {/* Workout indicators */}
      {hasWorkouts && (
        <div className="flex-1 flex flex-col justify-end gap-0.5 mt-1">
          {workouts.slice(0, 2).map((workout) => (
            <div
              key={workout.id}
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded truncate text-left",
                workout.status === "scheduled" &&
                  "bg-primary/10 text-primary",
                workout.status === "completed" &&
                  "bg-success/10 text-success",
                workout.status === "missed" &&
                  "bg-destructive/10 text-destructive"
              )}
            >
              {workout.workout_name}
            </div>
          ))}
          {workouts.length > 2 && (
            <span className="text-[10px] text-muted-foreground px-1">
              +{workouts.length - 2} altri
            </span>
          )}
        </div>
      )}

      {/* Status dots */}
      {hasWorkouts && (
        <div className="absolute top-1 right-1 flex gap-0.5">
          {scheduledCount > 0 && (
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
          {completedCount > 0 && (
            <div className="h-1.5 w-1.5 rounded-full bg-success" />
          )}
        </div>
      )}
    </button>
  );
}

// Week View Row
function WeekViewRow({
  date,
  workouts,
  isSelected,
  onClick,
}: {
  date: Date;
  workouts: ScheduledWorkoutLog[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const dateKey = format(date, "yyyy-MM-dd");
  const { isOver, setNodeRef } = useDroppable({
    id: `calendar-day-${dateKey}`,
    data: { type: "calendar-day", date, dateKey },
  });

  const isTodayDate = isToday(date);

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "flex items-stretch border-b border-border/30 min-h-[100px] cursor-pointer hover:bg-muted/30 transition-colors",
        isSelected && "bg-primary/5",
        isOver && "bg-primary/10"
      )}
    >
      {/* Day label */}
      <div
        className={cn(
          "w-20 shrink-0 p-2 border-r border-border/30 flex flex-col items-center justify-center",
          isTodayDate && "bg-primary/5"
        )}
      >
        <span className="text-[10px] uppercase text-muted-foreground">
          {format(date, "EEE", { locale: it })}
        </span>
        <span
          className={cn(
            "text-lg font-semibold tabular-nums",
            isTodayDate && "text-primary"
          )}
        >
          {format(date, "d")}
        </span>
      </div>

      {/* Workouts */}
      <div className="flex-1 p-2 space-y-1">
        {workouts.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Trascina un workout qui
          </p>
        ) : (
          workouts.map((workout) => (
            <div
              key={workout.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md text-sm",
                workout.status === "scheduled" && "bg-primary/10 text-primary",
                workout.status === "completed" && "bg-success/10 text-success",
                workout.status === "missed" &&
                  "bg-destructive/10 text-destructive"
              )}
            >
              {workout.status === "scheduled" && (
                <Clock className="h-3.5 w-3.5 shrink-0" />
              )}
              {workout.status === "completed" && (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              )}
              {workout.status === "missed" && (
                <XCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="font-medium truncate flex-1">
                {workout.workout_name}
              </span>
              <Avatar className="h-5 w-5">
                <AvatarImage src={workout.avatar_url || undefined} />
                <AvatarFallback className="text-[8px]">
                  {workout.athlete_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function CalendarGrid({
  workoutLogs,
  onDateSelect,
  selectedDate,
  view,
  onViewChange,
  currentDate,
  onDateChange,
}: CalendarGridProps) {
  // Group workouts by date
  const workoutsByDate = useMemo(() => {
    const grouped: Record<string, ScheduledWorkoutLog[]> = {};
    workoutLogs.forEach((log) => {
      const dateKey = log.scheduled_date;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(log);
    });
    return grouped;
  }, [workoutLogs]);

  // Get days based on view
  const days = useMemo(() => {
    if (view === "month") {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const monthDays = eachDayOfInterval({ start, end });

      // Pad to Monday start
      let startDay = getDay(start);
      startDay = startDay === 0 ? 6 : startDay - 1;
      const paddingDays: (Date | null)[] = Array(startDay).fill(null);

      return [...paddingDays, ...monthDays];
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      return [currentDate];
    }
  }, [currentDate, view]);

  const handlePrev = () => {
    if (view === "month") {
      onDateChange(subMonths(currentDate, 1));
    } else if (view === "week") {
      onDateChange(subWeeks(currentDate, 1));
    } else {
      onDateChange(new Date(currentDate.getTime() - 86400000));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      onDateChange(addMonths(currentDate, 1));
    } else if (view === "week") {
      onDateChange(addWeeks(currentDate, 1));
    } else {
      onDateChange(new Date(currentDate.getTime() + 86400000));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
    onDateSelect(new Date());
  };

  // Title based on view
  const title = useMemo(() => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy", { locale: it });
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, "d MMM", { locale: it })} - ${format(end, "d MMM yyyy", { locale: it })}`;
    } else {
      return format(currentDate, "EEEE d MMMM yyyy", { locale: it });
    }
  }, [currentDate, view]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize min-w-[200px] text-center">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Oggi
          </Button>
        </div>

        <Tabs value={view} onValueChange={(v) => onViewChange(v as any)}>
          <TabsList className="h-8">
            <TabsTrigger value="month" className="text-xs px-3">
              Mese
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-3">
              Settimana
            </TabsTrigger>
            <TabsTrigger value="day" className="text-xs px-3">
              Giorno
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden pt-4">
        {view === "month" && (
          <>
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

            {/* Month Grid */}
            <div className="grid grid-cols-7 gap-1 auto-rows-fr">
              {days.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="min-h-[80px]" />;
                }

                const dateKey = format(day, "yyyy-MM-dd");
                const dayWorkouts = workoutsByDate[dateKey] || [];

                return (
                  <DroppableDayCell
                    key={dateKey}
                    date={day}
                    isSelected={isSameDay(day, selectedDate)}
                    isCurrentMonth={isSameMonth(day, currentDate)}
                    isTodayDate={isToday(day)}
                    workouts={dayWorkouts}
                    onClick={() => onDateSelect(day)}
                  />
                );
              })}
            </div>
          </>
        )}

        {view === "week" && (
          <ScrollArea className="h-full">
            <div className="space-y-0 border border-border/30 rounded-lg overflow-hidden">
              {(days as Date[]).map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayWorkouts = workoutsByDate[dateKey] || [];

                return (
                  <WeekViewRow
                    key={dateKey}
                    date={day}
                    workouts={dayWorkouts}
                    isSelected={isSameDay(day, selectedDate)}
                    onClick={() => onDateSelect(day)}
                  />
                );
              })}
            </div>
          </ScrollArea>
        )}

        {view === "day" && (
          <ScrollArea className="h-full">
            <div className="border border-border/30 rounded-lg overflow-hidden">
              <WeekViewRow
                date={currentDate}
                workouts={workoutsByDate[format(currentDate, "yyyy-MM-dd")] || []}
                isSelected={true}
                onClick={() => {}}
              />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span>Programmato</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span>Completato</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          <span>Mancato</span>
        </div>
      </div>
    </div>
  );
}
