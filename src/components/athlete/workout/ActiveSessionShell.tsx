import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Flag, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsivePhoneWrapper } from "@/components/athlete/PhoneMockup";

interface ActiveSessionShellProps {
  title: string;
  elapsedSeconds: number;
  completedSets: number;
  totalSets: number;
  isOnline: boolean;
  isRecoveryMode: boolean;
  onFinish: () => void;
  children: ReactNode;
  restTimerNode?: ReactNode;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ActiveSessionShell({
  title,
  elapsedSeconds,
  completedSets,
  totalSets,
  isOnline,
  isRecoveryMode,
  onFinish,
  children,
  restTimerNode,
}: ActiveSessionShellProps) {
  // Prevent accidental back-swipe / navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const shellContent = (
    <div className="h-[100dvh] lg:h-full flex flex-col bg-[hsl(var(--m3-surface,var(--background)))] text-foreground relative overflow-hidden">
      {/* Status bar safe area */}
      <div className="safe-top flex-shrink-0" />

      {/* Compact Header */}
      <header className="flex-shrink-0 sticky top-0 z-40 bg-[hsl(var(--m3-surface,var(--background)))]/95 backdrop-blur-xl border-b border-border/20 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold truncate">{title}</h1>
              {isRecoveryMode && (
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] h-5 shrink-0">
                  📉 Recovery
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="h-3 w-3" />
                <span className="tabular-nums font-medium">{formatTime(elapsedSeconds)}</span>
              </div>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {completedSets}/{totalSets} sets
              </span>
              {!isOnline && (
                <WifiOff className="h-3 w-3 text-amber-500" />
              )}
            </div>
          </div>
          <Button
            onClick={onFinish}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs font-semibold shrink-0"
          >
            <Flag className="h-3.5 w-3.5 mr-1" />
            Termina
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Floating rest timer */}
      {restTimerNode}
    </div>
  );

  return <ResponsivePhoneWrapper>{shellContent}</ResponsivePhoneWrapper>;
}
