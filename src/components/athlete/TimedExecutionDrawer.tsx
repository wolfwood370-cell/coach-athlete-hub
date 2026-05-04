import { useEffect, useRef, useState } from "react";
import { Play, Check, Plus, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TimedSet {
  id: string;
  previous?: string;
  weightKg: number | null;
  seconds: number;
  completed: boolean;
}

interface TimedExecutionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseLabel: string;
  exerciseName: string;
  videoUrl?: string;
  videoDuration?: string;
  defaultSeconds?: number;
  sets: TimedSet[];
  onSetsChange: (sets: TimedSet[]) => void;
  onFinish: () => void;
}

export function TimedExecutionDrawer({
  open,
  onOpenChange,
  exerciseLabel,
  exerciseName,
  videoUrl,
  videoDuration = "0:45",
  defaultSeconds = 60,
  sets,
  onSetsChange,
  onFinish,
}: TimedExecutionDrawerProps) {
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeSetId === null) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          completeActive();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSetId]);

  const completeActive = () => {
    if (!activeSetId) return;
    onSetsChange(
      sets.map((s) => (s.id === activeSetId ? { ...s, completed: true } : s))
    );
    setActiveSetId(null);
  };

  const startSet = (set: TimedSet) => {
    setActiveSetId(set.id);
    setRemaining(set.seconds || defaultSeconds);
  };

  const updateSet = (id: string, patch: Partial<TimedSet>) => {
    onSetsChange(sets.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addSet = () => {
    const last = sets[sets.length - 1];
    onSetsChange([
      ...sets,
      {
        id: crypto.randomUUID(),
        weightKg: last?.weightKg ?? 0,
        seconds: last?.seconds ?? defaultSeconds,
        completed: false,
      },
    ]);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-3xl p-0 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="w-10" />
          <div className="h-1.5 w-10 rounded-full bg-muted" />
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-32">
          {/* Video */}
          <div className="relative aspect-video rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden mb-4">
            {videoUrl ? (
              <video src={videoUrl} className="w-full h-full object-cover" controls />
            ) : (
              <Play className="h-12 w-12 text-primary/60" />
            )}
            <span className="absolute bottom-2 right-2 bg-foreground/80 text-background text-xs font-medium px-2 py-0.5 rounded">
              {videoDuration}
            </span>
          </div>

          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {exerciseLabel}
          </div>
          <h2 className="font-display text-2xl font-bold mb-6">{exerciseName}</h2>

          {/* Header */}
          <div className="grid grid-cols-[32px_1fr_1fr_1.4fr_32px] gap-2 px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Set</span>
            <span>Previous</span>
            <span>+Kg</span>
            <span>Secs</span>
            <span />
          </div>

          {/* Sets */}
          <div className="space-y-2">
            {sets.map((set, i) => {
              const isActive = activeSetId === set.id;
              return (
                <div
                  key={set.id}
                  className={cn(
                    "grid grid-cols-[32px_1fr_1fr_1.4fr_32px] gap-2 items-center rounded-full p-1.5 transition",
                    isActive && "bg-primary/10",
                    set.completed && "opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-semibold text-center",
                      isActive ? "text-primary" : "text-foreground"
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="text-xs text-muted-foreground text-center truncate">
                    {set.previous ?? "—"}
                  </div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={set.weightKg ?? ""}
                    onChange={(e) =>
                      updateSet(set.id, {
                        weightKg: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    disabled={set.completed}
                    className="h-9 rounded-full text-center text-sm bg-background"
                    placeholder="-"
                  />
                  {isActive ? (
                    <div className="h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                      {formatTime(remaining)}
                    </div>
                  ) : set.completed ? (
                    <div className="h-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {set.seconds}s
                    </div>
                  ) : (
                    <button
                      onClick={() => startSet(set)}
                      className="h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center gap-1 text-sm font-semibold"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Start {set.seconds}s
                    </button>
                  )}
                  <div className="flex items-center justify-center">
                    {set.completed ? (
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-muted" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={addSet}
            className="mt-4 flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-wider px-2"
          >
            <Plus className="h-4 w-4" />
            Add Set
          </button>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-4 bg-background border-t">
          <Button
            onClick={onFinish}
            className="w-full h-12 rounded-full text-sm font-bold uppercase tracking-wider"
          >
            Finish Exercise
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
