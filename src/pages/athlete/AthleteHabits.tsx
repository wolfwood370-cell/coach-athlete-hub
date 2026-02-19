import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Check, CheckCircle2, Droplets, Moon, Apple, Footprints } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAthleteHabits } from "@/hooks/useAthleteHabits";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

// Placeholder habits for when no coach-assigned habits exist
const placeholderHabits = [
  { id: "1", name: "Dormire 8 ore", icon: Moon, category: "Recupero" },
  { id: "2", name: "Bere 3L di acqua", icon: Droplets, category: "Idratazione" },
  { id: "3", name: "5 porzioni frutta/verdura", icon: Apple, category: "Nutrizione" },
  { id: "4", name: "10.000 passi", icon: Footprints, category: "Movimento" },
];

export default function AthleteHabits() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const {
    habits,
    completedHabits,
    totalHabits,
    toggleHabit,
    isToggling,
    isLoading,
  } = useAthleteHabits(userId || undefined);

  const hasAssignedHabits = totalHabits > 0;

  return (
    <AthleteLayout title="Le mie abitudini">
      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <CheckCircle2 className="h-4.5 w-4.5 text-violet-500" />
            </div>
            <span className="font-semibold">Abitudini Giornaliere</span>
          </div>
          {hasAssignedHabits && (
            <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 border-violet-500/20">
              {completedHabits}/{totalHabits}
            </Badge>
          )}
        </div>

        {/* Assigned habits from coach */}
        {hasAssignedHabits ? (
          <div className="space-y-2">
            {habits.map((habit, index) => (
              <motion.button
                key={habit.athlete_habit_id}
                onClick={() => toggleHabit(habit.athlete_habit_id, !habit.isCompleted)}
                disabled={isToggling}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl transition-all",
                  "active:scale-[0.98]",
                  habit.isCompleted
                    ? "bg-success/10 border border-success/20"
                    : "bg-secondary/50 hover:bg-secondary/70 border border-transparent"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                    habit.isCompleted
                      ? "bg-success"
                      : "border-2 border-muted-foreground/30"
                  )}
                >
                  {habit.isCompleted && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      habit.isCompleted && "line-through text-muted-foreground"
                    )}
                  >
                    {habit.name}
                  </span>
                  {habit.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{habit.description}</p>
                  )}
                </div>
                {habit.category && (
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {habit.category}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          /* Placeholder habits when none assigned */
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              Il tuo coach non ha ancora assegnato abitudini. Ecco alcuni suggerimenti:
            </p>
            {placeholderHabits.map((habit, index) => (
              <motion.div
                key={habit.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-transparent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="h-7 w-7 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
                  <habit.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium flex-1">{habit.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {habit.category}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AthleteLayout>
  );
}
