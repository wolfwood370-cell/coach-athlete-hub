import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNutritionTargets } from "@/hooks/useNutritionTargets";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Wallet, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, startOfWeek, addDays, isToday } from "date-fns";
import { it } from "date-fns/locale";

interface DayBucket {
  date: string;
  label: string;
  target: number;
  consumed: number;
  delta: number; // positive = surplus (banked), negative = deficit
  isToday: boolean;
  isFuture: boolean;
}

export function CalorieBankCard() {
  const { user } = useAuth();
  const { targets } = useNutritionTargets();

  // Get the current week (Mon-Sun)
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return format(d, "yyyy-MM-dd");
  });

  const logsQuery = useQuery({
    queryKey: ["weekly-calorie-bank", user?.id, weekDates[0]],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("date, calories")
        .eq("athlete_id", user.id)
        .gte("date", weekDates[0])
        .lte("date", weekDates[6]);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  if (logsQuery.isLoading) {
    return (
      <Card className="border-0 bg-card/50">
        <CardContent className="p-5">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Aggregate calories per day
  const caloriesByDate = new Map<string, number>();
  for (const log of logsQuery.data ?? []) {
    if (log.calories) {
      caloriesByDate.set(log.date, (caloriesByDate.get(log.date) ?? 0) + log.calories);
    }
  }

  const todayStr = format(today, "yyyy-MM-dd");
  const weeklyTarget = targets.calories * 7;

  // Build day buckets
  const days: DayBucket[] = weekDates.map((date) => {
    const d = new Date(date + "T12:00:00");
    const isTodayDate = date === todayStr;
    const isFuture = date > todayStr;
    const consumed = caloriesByDate.get(date) ?? 0;
    const target = targets.calories;
    const delta = isFuture ? 0 : target - consumed; // surplus = positive

    return {
      date,
      label: format(d, "EEE", { locale: it }).charAt(0).toUpperCase() + format(d, "EEE", { locale: it }).slice(1, 3),
      target,
      consumed,
      delta,
      isToday: isTodayDate,
      isFuture,
    };
  });

  // Calculate weekly consumed and banked surplus
  const weeklyConsumed = days.reduce((sum, d) => sum + d.consumed, 0);
  const bankedSurplus = days
    .filter((d) => !d.isFuture && !d.isToday)
    .reduce((sum, d) => sum + d.delta, 0);

  // Remaining days including today
  const remainingDays = days.filter((d) => d.isFuture || d.isToday).length;
  const weeklyRemaining = weeklyTarget - weeklyConsumed;
  const dailyAdjusted = remainingDays > 0 ? Math.round(weeklyRemaining / remainingDays) : 0;

  const weeklyPercent = Math.min((weeklyConsumed / weeklyTarget) * 100, 100);
  const isOverBudget = weeklyRemaining < 0;

  return (
    <Card className="border-0 bg-gradient-to-br from-tertiary/5 via-tertiary/8 to-tertiary/5 overflow-hidden">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-tertiary/15 flex items-center justify-center">
              <Wallet className="h-4.5 w-4.5 text-tertiary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Calorie Bank</h3>
              <p className="text-[10px] text-muted-foreground">Budget settimanale</p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-2",
              bankedSurplus > 0
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : bankedSurplus < -200
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {bankedSurplus > 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : bankedSurplus < 0 ? (
              <TrendingDown className="h-3 w-3 mr-1" />
            ) : (
              <Minus className="h-3 w-3 mr-1" />
            )}
            {bankedSurplus > 0 ? "+" : ""}
            {bankedSurplus} kcal saved
          </Badge>
        </div>

        {/* Weekly progress */}
        <div className="space-y-2 mb-4">
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-700",
                isOverBudget
                  ? "bg-gradient-to-r from-amber-500 to-amber-400"
                  : "bg-gradient-to-r from-tertiary/80 to-tertiary"
              )}
              style={{ width: `${weeklyPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{weeklyConsumed.toLocaleString()} consumate</span>
            <span>{weeklyTarget.toLocaleString()} budget</span>
          </div>
        </div>

        {/* Adjusted daily target */}
        <div className="text-center p-3 rounded-xl bg-background/60 mb-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
            Target oggi (aggiustato)
          </p>
          <span
            className={cn(
              "text-2xl font-bold tabular-nums",
              dailyAdjusted > targets.calories + 100
                ? "text-emerald-600 dark:text-emerald-400"
                : dailyAdjusted < targets.calories - 100
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground"
            )}
          >
            {dailyAdjusted.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground ml-1">kcal</span>
          {dailyAdjusted !== targets.calories && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Base: {targets.calories} {dailyAdjusted > targets.calories ? `+ ${dailyAdjusted - targets.calories} rollover` : `- ${targets.calories - dailyAdjusted} recupero`}
            </p>
          )}
        </div>

        {/* Day-by-day mini bars */}
        <div className="flex gap-1.5 items-end">
          {days.map((day) => {
            const pct = day.target > 0 ? Math.min((day.consumed / day.target) * 100, 130) : 0;
            const isOverDay = day.consumed > day.target;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-all duration-500",
                    "relative overflow-hidden",
                    day.isToday ? "min-h-[4px]" : ""
                  )}
                  style={{ height: `${Math.max(pct * 0.4, 4)}px` }}
                >
                  <div
                    className={cn(
                      "absolute inset-0 rounded-t-sm",
                      day.isFuture
                        ? "bg-muted/40"
                        : isOverDay
                          ? "bg-amber-400/70"
                          : day.isToday
                            ? "bg-tertiary"
                            : "bg-tertiary/50"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[9px] tabular-nums",
                    day.isToday
                      ? "font-bold text-tertiary"
                      : day.isFuture
                        ? "text-muted-foreground/40"
                        : "text-muted-foreground"
                  )}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
