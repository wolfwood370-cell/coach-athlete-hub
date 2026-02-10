import { Button } from "@/components/ui/button";
import { Timer, X, Plus, Minus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface RestTimerPillProps {
  active: boolean;
  remaining: number;
  total: number;
  onSkip: () => void;
  onAdd: (seconds: number) => void;
  onReset: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function RestTimerPill({
  active,
  remaining,
  total,
  onSkip,
  onAdd,
  onReset,
}: RestTimerPillProps) {
  if (!active) return null;

  const isUrgent = remaining <= 10;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-4 right-4 z-50"
        >
          <div className="bg-[hsl(var(--m3-surface-container-high,var(--card)))] rounded-2xl p-4 shadow-2xl border border-border/30 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer className={cn("h-5 w-5", isUrgent ? "text-destructive" : "text-primary")} />
                <span className="text-sm font-medium">Recupero</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSkip}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Timer Display */}
            <div className="text-center mb-3">
              <span
                className={cn(
                  "text-5xl font-bold tabular-nums transition-colors",
                  isUrgent ? "text-destructive animate-pulse" : "text-foreground"
                )}
              >
                {formatTime(remaining)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
              <div
                className={cn(
                  "h-full transition-all duration-1000 ease-linear rounded-full",
                  isUrgent ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${(remaining / total) * 100}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" className="h-9" onClick={() => onAdd(-15)}>
                <Minus className="h-3 w-3 mr-1" />
                15s
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={onReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={() => onAdd(15)}>
                <Plus className="h-3 w-3 mr-1" />
                15s
              </Button>
              <Button size="sm" className="h-9 ml-2" onClick={onSkip}>
                Skip
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
