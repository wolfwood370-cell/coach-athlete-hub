import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PhaseFocusType } from "@/hooks/usePeriodization";
import {
  Dumbbell,
  Target,
  Zap,
  Activity,
  Flame,
  TrendingUp,
  Heart,
} from "lucide-react";

// Phase configuration for colors and icons
const PHASE_CONFIG: Record<PhaseFocusType, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: typeof Dumbbell;
}> = {
  strength: {
    label: "Forza",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-b-orange-500",
    icon: Target,
  },
  hypertrophy: {
    label: "Ipertrofia",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/20",
    borderColor: "border-b-indigo-500",
    icon: Dumbbell,
  },
  endurance: {
    label: "Resistenza",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-b-cyan-500",
    icon: Activity,
  },
  power: {
    label: "Potenza",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-b-amber-500",
    icon: Zap,
  },
  recovery: {
    label: "Recupero",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-b-emerald-500",
    icon: Heart,
  },
  peaking: {
    label: "Picco",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-b-red-500",
    icon: Flame,
  },
  transition: {
    label: "Transizione",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-500/20",
    borderColor: "border-b-slate-500",
    icon: TrendingUp,
  },
};

export interface PhaseInfo {
  id: string;
  name: string;
  focus_type: PhaseFocusType;
  start_date: string;
  end_date: string;
}

interface WeekInfo {
  weekIndex: number;
  phase: PhaseInfo | null;
}

interface WeekTabsProps {
  currentWeek: number;
  totalWeeks: number;
  phases: PhaseInfo[];
  onWeekChange: (week: number) => void;
  className?: string;
}

export function WeekTabs({
  currentWeek,
  totalWeeks,
  phases,
  onWeekChange,
  className,
}: WeekTabsProps) {
  // Map weeks to their corresponding phases
  const weeksWithPhases = useMemo((): WeekInfo[] => {
    const result: WeekInfo[] = [];
    
    // Sort phases by start date
    const sortedPhases = [...phases].sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    let currentPhaseIndex = 0;
    let weekInPhase = 0;
    
    for (let i = 0; i < totalWeeks; i++) {
      let assignedPhase: PhaseInfo | null = null;
      
      if (currentPhaseIndex < sortedPhases.length) {
        const phase = sortedPhases[currentPhaseIndex];
        const phaseStart = new Date(phase.start_date);
        const phaseEnd = new Date(phase.end_date);
        const phaseDuration = Math.ceil((phaseEnd.getTime() - phaseStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        
        if (weekInPhase < phaseDuration) {
          assignedPhase = phase;
          weekInPhase++;
        }
        
        if (weekInPhase >= phaseDuration) {
          currentPhaseIndex++;
          weekInPhase = 0;
        }
      }
      
      result.push({
        weekIndex: i,
        phase: assignedPhase,
      });
    }
    
    return result;
  }, [phases, totalWeeks]);

  return (
    <div className={cn("border-b border-border/50 bg-muted/30", className)}>
      <ScrollArea className="w-full">
        <div className="flex items-center gap-1 px-2 py-2 min-w-max">
          {weeksWithPhases.map((weekInfo) => {
            const { weekIndex, phase } = weekInfo;
            const isActive = weekIndex === currentWeek;
            const config = phase ? PHASE_CONFIG[phase.focus_type] : null;
            const Icon = config?.icon;

            return (
              <TooltipProvider key={weekIndex}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onWeekChange(weekIndex)}
                      className={cn(
                        "relative flex flex-col items-center px-3 py-1.5 rounded-t-md transition-all min-w-[60px]",
                        "hover:bg-background/80",
                        isActive && "bg-background shadow-sm",
                        phase && "border-b-2",
                        phase && config?.borderColor,
                        !phase && "border-b-2 border-b-transparent"
                      )}
                    >
                      {/* Week number */}
                      <div className="flex items-center gap-1">
                        {Icon && (
                          <Icon 
                            className={cn(
                              "h-3 w-3",
                              isActive ? config?.color : "text-muted-foreground/50"
                            )} 
                          />
                        )}
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isActive ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          S{weekIndex + 1}
                        </span>
                      </div>

                      {/* Phase indicator dot */}
                      {phase && (
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full mt-0.5",
                            config?.bgColor?.replace("/20", "")
                          )}
                          style={{
                            backgroundColor: phase.focus_type === "strength" ? "#f97316" :
                              phase.focus_type === "hypertrophy" ? "#6366f1" :
                              phase.focus_type === "endurance" ? "#06b6d4" :
                              phase.focus_type === "power" ? "#f59e0b" :
                              phase.focus_type === "recovery" ? "#10b981" :
                              phase.focus_type === "peaking" ? "#ef4444" :
                              "#64748b"
                          }}
                        />
                      )}

                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-primary rounded-full" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p className="font-medium">Settimana {weekIndex + 1}</p>
                    {phase && (
                      <p className={cn("text-[10px]", config?.color)}>
                        {phase.name} · {config?.label}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}

          {/* Add more weeks button if no phases */}
          {totalWeeks < 52 && phases.length === 0 && (
            <button
              onClick={() => onWeekChange(totalWeeks)}
              className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <span className="text-lg">+</span>
            </button>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
