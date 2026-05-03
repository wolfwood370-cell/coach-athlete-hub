import { ArrowLeft, Flame, Brain, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PerformanceMilestonesProps {
  onBack?: () => void;
  onContinue?: () => void;
  title?: string;
  subtitle?: string;
  streakValue?: number;
  currentStreak?: number;
  allTimeBest?: number;
  coachInsight?: string;
}

export function PerformanceMilestones({
  onBack,
  onContinue,
  title = "Perfect Week!",
  subtitle = "You've logged your biofeedback for 7 consecutive days.",
  streakValue = 7,
  currentStreak = 7,
  allTimeBest = 14,
  coachInsight = "Consistency is the foundation of elite performance. Your daily data allows us to perfectly calibrate your training loads. Keep the chain going.",
}: PerformanceMilestonesProps) {
  return (
    <div className="flex flex-col h-full bg-background font-['Inter']">
      {/* Header */}
      <header className="flex-shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-2 px-3 h-14">
          <button
            onClick={onBack}
            aria-label="Back"
            className="h-10 w-10 flex items-center justify-center rounded-full text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-center pr-10 text-base font-bold text-primary font-['Manrope']">
            Performance Milestones
          </h1>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Achievement Medal */}
        <div className="flex flex-col items-center pt-10">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full bg-amber-400/30 blur-2xl"
              aria-hidden
            />
            <div className="relative h-44 w-44 rounded-full bg-card border-[6px] border-amber-400 shadow-xl flex flex-col items-center justify-center">
              <Flame className="h-10 w-10 text-amber-500" strokeWidth={2.2} />
              <span className="text-5xl font-black text-foreground font-['Manrope'] leading-none mt-1">
                {streakValue}
              </span>
            </div>
          </div>

          <h2 className="mt-8 text-3xl font-bold text-foreground font-['Manrope'] tracking-tight">
            {title}
          </h2>
          <p className="mt-2 text-center text-base text-muted-foreground max-w-xs">
            {subtitle}
          </p>
        </div>

        {/* Stats */}
        <div className="mt-8 rounded-2xl bg-card shadow-sm p-5">
          <div className="grid grid-cols-2 divide-x divide-border/60">
            <div className="pr-4">
              <p className="text-[11px] font-bold tracking-widest text-muted-foreground font-['Manrope']">
                CURRENT STREAK
              </p>
              <p className="mt-2 text-3xl font-bold text-primary font-['Manrope']">
                {currentStreak} <span className="text-2xl font-semibold">Days</span>
              </p>
            </div>
            <div className="pl-4">
              <p className="text-[11px] font-bold tracking-widest text-muted-foreground font-['Manrope']">
                ALL-TIME BEST
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground font-['Manrope']">
                {allTimeBest} <span className="text-2xl font-semibold">Days</span>
              </p>
            </div>
          </div>
        </div>

        {/* Coach Insight */}
        <div className="mt-6 relative rounded-2xl bg-primary/5 border-l-4 border-primary p-5 overflow-hidden">
          <Quote
            className="absolute top-3 right-3 h-12 w-12 text-primary/15"
            aria-hidden
          />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary">
              <Brain className="h-4 w-4" />
              <span className="text-xs font-bold tracking-widest font-['Manrope']">
                COACH INSIGHT
              </span>
            </div>
            <p className="mt-3 text-base leading-relaxed text-foreground/90">
              {coachInsight}
            </p>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={onContinue}
          className="mt-6 w-full h-14 rounded-full text-base font-semibold font-['Manrope'] shadow-lg"
        >
          Continue the Grind
        </Button>
      </main>
    </div>
  );
}

export default PerformanceMilestones;
