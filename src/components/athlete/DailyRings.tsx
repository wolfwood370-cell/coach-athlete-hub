import { cn } from "@/lib/utils";
import { Dumbbell, Flame, Check, LucideIcon } from "lucide-react";

interface RingConfig {
  id: string;
  label: string;
  value: number;
  target: number;
  icon: LucideIcon;
  getColor: (percentage: number) => string;
}

interface DailyRingsProps {
  fuelValue: number;
  fuelTarget: number;
  trainingProgress: number; // 0-100
  habitsCompleted: number;
  habitsTotal: number;
  coachLogoUrl?: string | null;
}

// Individual Ring Component
const ProgressRing = ({
  percentage,
  color,
  size = 80,
  strokeWidth = 6,
  icon: Icon,
  label,
  value,
  unit,
}: {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--secondary))"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
          />
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      {/* Value and label */}
      <div className="text-center">
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>}
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
};

// Helper to determine color based on percentage
const getFuelColor = (percentage: number): string => {
  // Within +/- 5% of target is green
  if (percentage >= 95 && percentage <= 105) return "hsl(160 84% 39%)"; // success
  // Within +/- 15% is yellow
  if (percentage >= 85 && percentage <= 115) return "hsl(38 92% 50%)"; // warning
  // Otherwise red
  return "hsl(0 84% 60%)"; // destructive
};

const getTrainingColor = (percentage: number): string => {
  if (percentage >= 100) return "hsl(160 84% 39%)"; // success
  if (percentage > 0) return "hsl(var(--primary))"; // primary
  return "hsl(var(--muted-foreground))"; // not started
};

const getHabitsColor = (percentage: number): string => {
  if (percentage >= 100) return "hsl(160 84% 39%)"; // success
  if (percentage >= 50) return "hsl(38 92% 50%)"; // warning
  if (percentage > 0) return "hsl(var(--primary))";
  return "hsl(var(--muted-foreground))";
};

export function DailyRings({
  fuelValue,
  fuelTarget,
  trainingProgress,
  habitsCompleted,
  habitsTotal,
}: DailyRingsProps) {
  const fuelPercentage = fuelTarget > 0 ? (fuelValue / fuelTarget) * 100 : 0;
  const habitsPercentage = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;

  return (
    <div className="relative">
      {/* Rings Container */}
      <div className="flex items-center justify-around py-4">
        {/* Left Ring: Fuel (Calories) */}
        <ProgressRing
          percentage={fuelPercentage}
          color={getFuelColor(fuelPercentage)}
          icon={Flame}
          label="Fuel"
          value={fuelValue.toLocaleString()}
          unit={`/${(fuelTarget / 1000).toFixed(1)}k`}
        />

        {/* Center Ring: Training (larger) */}
        <ProgressRing
          percentage={trainingProgress}
          color={getTrainingColor(trainingProgress)}
          size={96}
          strokeWidth={8}
          icon={Dumbbell}
          label="Training"
          value={`${trainingProgress}%`}
        />

        {/* Right Ring: Habits */}
        <ProgressRing
          percentage={habitsPercentage}
          color={getHabitsColor(habitsPercentage)}
          icon={Check}
          label="Habits"
          value={`${habitsCompleted}/${habitsTotal}`}
        />
      </div>
    </div>
  );
}
