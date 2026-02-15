import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Droplets,
  ShieldAlert,
  Zap,
  Leaf,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CycleStatus } from "@/hooks/useCyclePhasing";
import { CycleSymptomDrawer } from "./CycleSymptomDrawer";

// ── Phase visual config ────────────────────────────────

const phaseConfig = {
  menstrual: {
    gradient: "from-rose-500/20 via-pink-500/10 to-background",
    ring: "hsl(346 77% 50%)",
    icon: Droplets,
    iconColor: "text-rose-500",
    badgeBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
  follicular: {
    gradient: "from-emerald-500/20 via-teal-500/10 to-background",
    ring: "hsl(160 84% 39%)",
    icon: Zap,
    iconColor: "text-emerald-500",
    badgeBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  ovulatory: {
    gradient: "from-amber-500/20 via-orange-500/10 to-background",
    ring: "hsl(38 92% 50%)",
    icon: Activity,
    iconColor: "text-amber-500",
    badgeBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  luteal: {
    gradient: "from-violet-500/20 via-purple-500/10 to-background",
    ring: "hsl(263 70% 50%)",
    icon: Leaf,
    iconColor: "text-violet-500",
    badgeBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  },
};

// ── Circular Progress SVG ──────────────────────────────

function CycleRing({
  day,
  total,
  color,
}: {
  day: number;
  total: number;
  color: string;
}) {
  const radius = 44;
  const stroke = 5;
  const normalR = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalR;
  const progress = day / total;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative h-24 w-24 flex-shrink-0">
      <svg
        width={radius * 2}
        height={radius * 2}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={radius}
          cy={radius}
          r={normalR}
          fill="transparent"
          stroke="hsl(var(--secondary))"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalR}
          fill="transparent"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums leading-none">
          {day}
        </span>
        <span className="text-[10px] text-muted-foreground">/{total}</span>
      </div>
    </div>
  );
}

// ── Main Card ──────────────────────────────────────────

interface CyclePhaseCardProps {
  cycleStatus: CycleStatus;
  cycleLength: number;
  onLogSymptoms: (symptoms: string[]) => Promise<void>;
  isLogging: boolean;
}

export function CyclePhaseCard({
  cycleStatus,
  cycleLength,
  onLogSymptoms,
  isLogging,
}: CyclePhaseCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const config = phaseConfig[cycleStatus.currentPhase];
  const PhaseIcon = config.icon;
  const mods = cycleStatus.trainingModifiers;

  const isHighRisk = mods.injury_risk.startsWith("High");

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card
          className={cn(
            "relative overflow-hidden border-border/50"
          )}
        >
          {/* Gradient background */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-60",
              config.gradient
            )}
          />

          <CardContent className="relative p-4 space-y-3">
            {/* Header row */}
            <div className="flex items-start gap-3">
              <CycleRing
                day={cycleStatus.daysIntoCycle}
                total={cycleLength}
                color={config.ring}
              />

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <PhaseIcon className={cn("h-4 w-4", config.iconColor)} />
                  <h3 className="font-semibold text-sm leading-tight">
                    {cycleStatus.phaseLabel} — Giorno {cycleStatus.daysIntoCycle}
                  </h3>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cycleStatus.powerTip}
                </p>

                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  Prossimo ciclo ~{format(cycleStatus.predictedNextPeriod, "d MMM")}
                </p>
              </div>
            </div>

            {/* Modifier badges */}
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className={cn("text-[10px] font-medium", config.badgeBg)}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {mods.volume_suggestion}
              </Badge>

               <Badge
                variant="outline"
                className="text-[10px] font-medium bg-secondary/50 border-border/50"
              >
                Forza {mods.strength_potential}%
              </Badge>

              {isHighRisk && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium bg-destructive/10 text-destructive border-destructive/30"
                >
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  {mods.injury_risk}
                </Badge>
              )}

              <Badge
                variant="outline"
                className="text-[10px] font-medium bg-secondary/50 border-border/50"
              >
                {mods.nutrition_focus}
              </Badge>
            </div>

            {/* Log Symptoms CTA */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs h-8 bg-secondary/30 hover:bg-secondary/60"
              onClick={() => setDrawerOpen(true)}
            >
              <span className="flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5" />
                Registra Sintomi
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <CycleSymptomDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={onLogSymptoms}
        isSaving={isLogging}
      />
    </>
  );
}

// ── Setup CTA Card (when not configured) ───────────────

export function CycleSetupCTA({ onSetup }: { onSetup: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card
        className="relative overflow-hidden cursor-pointer border-dashed border-primary/30 hover:border-primary/50 transition-colors"
        onClick={onSetup}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-violet-500/5" />
        <CardContent className="relative p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Droplets className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Cycle-Sync Engine</h3>
              <p className="text-xs text-muted-foreground">
                Ottimizza l'allenamento in base alle fasi del ciclo
              </p>
            </div>
            <Button size="sm" variant="outline" className="text-xs">
              Configura
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
