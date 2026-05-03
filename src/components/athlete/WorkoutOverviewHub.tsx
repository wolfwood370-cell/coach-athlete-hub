import { ArrowLeft, Menu, Timer, Zap, MoreHorizontal, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PlanDay {
  weekday: string; // M, T, W...
  day: number;
  active?: boolean;
  disabled?: boolean;
}

export interface PlanItem {
  id: string;
  label?: string; // e.g. "A1."
  name: string;
  detail: string; // e.g. "2 mins" or "4 Serie x 6-8 Reps"
  detailVariant?: "chip" | "text";
}

export interface PlanPhase {
  id: string;
  index: number;
  title: string;
  items: PlanItem[];
}

export interface WorkoutOverviewHubProps {
  days: PlanDay[];
  workoutTitle: string;
  estMinutes: number;
  intensityLabel: string;
  phasesCount: number;
  phases: PlanPhase[];
  onBack?: () => void;
  onMenu?: () => void;
  onSelectDay?: (day: PlanDay) => void;
  onItemClick?: (item: PlanItem, phase: PlanPhase) => void;
  onItemMore?: (item: PlanItem, phase: PlanPhase) => void;
  onStart?: () => void;
}

export const WorkoutOverviewHub = ({
  days,
  workoutTitle,
  estMinutes,
  intensityLabel,
  phasesCount,
  phases,
  onBack,
  onMenu,
  onSelectDay,
  onItemClick,
  onItemMore,
  onStart,
}: WorkoutOverviewHubProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col font-[Inter]">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 bg-background/95 backdrop-blur border-b border-border">
        <button onClick={onBack} className="p-2 -ml-2 text-primary" aria-label="Back">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-[Manrope] font-bold text-foreground text-lg">Today's Plan</h1>
        <button onClick={onMenu} className="p-2 -mr-2 text-primary" aria-label="Menu">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 px-4 py-4 space-y-5 pb-32">
        {/* Week strip */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => (
            <button
              key={i}
              onClick={() => onSelectDay?.(d)}
              disabled={d.disabled}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={`text-xs font-[Manrope] font-semibold ${
                  d.active
                    ? "text-primary"
                    : d.disabled
                    ? "text-muted-foreground/50"
                    : "text-muted-foreground"
                }`}
              >
                {d.weekday}
              </span>
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center font-[Manrope] font-bold text-sm transition-all ${
                  d.active
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : d.disabled
                    ? "bg-primary/5 text-muted-foreground/50"
                    : "bg-primary/10 text-foreground"
                }`}
              >
                {d.day}
              </span>
            </button>
          ))}
        </div>

        {/* Workout summary card */}
        <section className="bg-card rounded-2xl p-5 border border-border space-y-3">
          <h2 className="font-[Manrope] font-bold text-2xl text-foreground leading-tight">
            {workoutTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-[Manrope] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1">
              <Timer className="w-4 h-4" />
              {estMinutes} Min Est.
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              {intensityLabel}
            </span>
            <span>•</span>
            <span>{phasesCount} Fasi</span>
          </div>
        </section>

        {/* Phases */}
        {phases.map((phase) => (
          <section key={phase.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-[Manrope] font-bold text-sm">
                {phase.index}
              </div>
              <h3 className="font-[Manrope] font-bold text-lg text-foreground">{phase.title}</h3>
            </div>

            <div className="relative pl-6 space-y-2">
              <div className="absolute left-3 top-1 bottom-1 w-px bg-primary/20" />
              {phase.items.map((it) => {
                const isMain = !!it.label;
                return (
                  <button
                    key={it.id}
                    onClick={() => onItemClick?.(it, phase)}
                    className={`relative w-full text-left bg-card rounded-xl p-3.5 border border-border hover:border-primary/40 transition-colors ${
                      isMain ? "border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-[Manrope] font-semibold text-foreground">
                          {it.label && <span className="text-primary mr-1">{it.label}</span>}
                          {it.name}
                        </p>
                        {isMain && (
                          <p className="text-sm text-muted-foreground mt-0.5">{it.detail}</p>
                        )}
                      </div>

                      {isMain ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemMore?.(it, phase);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground"
                          aria-label="More"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-foreground text-xs font-semibold flex-shrink-0">
                          {it.detail}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* Sticky footer */}
      <footer className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 space-y-2">
        <Button
          onClick={onStart}
          className="w-full h-13 h-12 rounded-full font-[Manrope] font-bold text-base gap-2"
          size="lg"
        >
          <Play className="w-5 h-5 fill-current" />
          Start Workout
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Tap an exercise above to preview details.
        </p>
      </footer>
    </div>
  );
};

export default WorkoutOverviewHub;
