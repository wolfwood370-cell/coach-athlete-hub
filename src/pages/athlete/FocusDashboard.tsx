import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Activity,
  Apple,
  ChevronRight,
  Cloud,
  CloudOff,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Utensils,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAthleteApp } from "@/hooks/useAthleteApp";
import { useMaterialYou, m3 } from "@/providers/MaterialYouProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsivePhoneWrapper } from "@/components/athlete/PhoneMockup";
import { AthleteBottomNav } from "@/components/athlete/AthleteBottomNav";

// ============================================
// FOCUS DASHBOARD - MATERIAL YOU DESIGN
// ============================================

// Readiness Dial Component
const ReadinessDial = ({
  score,
  isCompleted,
  level,
}: {
  score: number;
  isCompleted: boolean;
  level: "high" | "moderate" | "low";
}) => {
  const radius = 70;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getGradientColors = () => {
    if (!isCompleted) return ["hsl(var(--muted))", "hsl(var(--muted))"];
    if (level === "high") return ["#10b981", "#34d399"]; // Emerald
    if (level === "moderate") return ["#f59e0b", "#fbbf24"]; // Amber
    return ["#ef4444", "#f87171"]; // Red
  };

  const [startColor, endColor] = getGradientColors();
  const gradientId = `readiness-gradient-${level}`;

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          stroke="hsl(var(--m3-surface-container-high, var(--secondary)))"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress arc */}
        <motion.circle
          stroke={`url(#${gradientId})`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: isCompleted ? strokeDashoffset : circumference }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isCompleted ? (
          <>
            <motion.span
              className="text-4xl font-bold tabular-nums"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              style={{ color: startColor }}
            >
              {score}
            </motion.span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Prontezza
            </span>
          </>
        ) : (
          <>
            <Zap className="h-8 w-8 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground mt-1">Check-in</span>
          </>
        )}
      </div>
    </div>
  );
};

// Metric Pill Component (Material 3 style)
const MetricPill = ({
  icon: Icon,
  label,
  value,
  unit,
  color = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  color?: "primary" | "secondary" | "tertiary";
}) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[hsl(var(--m3-surface-container,var(--secondary)))] border border-[hsl(var(--m3-outline-variant,var(--border))/0.5)]">
      <Icon className="h-4 w-4 text-[hsl(var(--m3-primary,var(--primary)))]" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">
        {value}
        {unit && <span className="text-xs font-normal ml-0.5">{unit}</span>}
      </span>
    </div>
  );
};

// Quick Action Card (Material 3 Filled Tonal)
const QuickActionCard = ({
  icon: Icon,
  title,
  subtitle,
  onClick,
  accent = false,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent?: boolean;
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "flex-1 p-4 rounded-2xl text-left transition-all",
        "border border-[hsl(var(--m3-outline-variant,var(--border))/0.3)]",
        accent
          ? "bg-[hsl(var(--m3-primary-container,var(--primary)/0.15))]"
          : "bg-[hsl(var(--m3-surface-container,var(--secondary)))]"
      )}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center mb-3",
          accent
            ? "bg-[hsl(var(--m3-primary,var(--primary)))]"
            : "bg-[hsl(var(--m3-secondary-container,var(--muted)))]"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            accent
              ? "text-[hsl(var(--m3-on-primary,var(--primary-foreground)))]"
              : "text-[hsl(var(--m3-on-secondary-container,var(--foreground)))]"
          )}
        />
      </div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </motion.button>
  );
};

// Sync Status Indicator
const SyncIndicator = ({ status }: { status: "synced" | "syncing" | "offline" }) => {
  return (
    <div className="flex items-center gap-1.5">
      {status === "syncing" ? (
        <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin" />
      ) : status === "offline" ? (
        <CloudOff className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <Cloud className="h-3.5 w-3.5 text-success" />
      )}
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {status === "syncing" ? "Sincronizzazione" : status === "offline" ? "Non in Linea" : "Sincronizzato"}
      </span>
    </div>
  );
};

// Main Dashboard Component
export default function FocusDashboard() {
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);

  const {
    athleteName,
    dailyState,
    todayWorkout,
    nutrition,
    habits,
    streak,
    coach,
    isLoading,
    isSyncing,
    syncStatus,
  } = useAthleteApp();

  const greeting = getTimeBasedGreeting();
  const firstName = athleteName?.split(" ")[0] || "Atleta";

  return (
    <ResponsivePhoneWrapper>
      <div className="h-[100dvh] lg:h-full flex flex-col bg-[hsl(var(--m3-background,var(--background)))] text-foreground relative overflow-hidden">
        {/* Status bar safe area */}
        <div className="safe-top flex-shrink-0" />

        {/* ===== TOP BAR ===== */}
        <header className="flex-shrink-0 px-5 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Coach Logo */}
              {coach.logoUrl ? (
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="absolute inset-0 rounded-xl blur-lg opacity-30"
                    style={{ backgroundColor: coach.brandColor || "hsl(var(--primary))" }}
                  />
                  <img
                    src={coach.logoUrl}
                    alt="Coach"
                    className="relative h-10 w-10 rounded-xl object-contain bg-background/80 backdrop-blur-sm border border-[hsl(var(--m3-outline-variant,var(--border))/0.5)]"
                  />
                </motion.div>
              ) : coach.brandColor ? (
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                  style={{ backgroundColor: coach.brandColor }}
                >
                  {coach.coachName?.charAt(0) || "C"}
                </div>
              ) : null}

              {/* Greeting */}
              <div>
                <p className="text-xs text-muted-foreground">{greeting}</p>
                <h1 className="text-lg font-semibold">{firstName} 👋</h1>
              </div>
            </div>

            {/* Right side: Streak + Sync */}
            <div className="flex items-center gap-3">
              {streak.current > 0 && (
                <motion.div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/25"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Flame
                    className={cn(
                      "h-4 w-4",
                      streak.current >= 7 ? "text-orange-500" : "text-amber-500"
                    )}
                  />
                  <span className="text-sm font-bold tabular-nums text-orange-600 dark:text-orange-400">
                    {streak.current}
                  </span>
                </motion.div>
              )}
              <SyncIndicator status={isSyncing ? "syncing" : "synced"} />
            </div>
          </div>
        </header>

        {/* ===== MAIN SCROLLABLE CONTENT ===== */}
        <main className="flex-1 overflow-y-auto px-5 pb-32">
          <div className="space-y-6 py-4">
            {/* ===== UNIVERSAL READINESS CARD ===== */}
            <motion.div
              className="relative overflow-hidden rounded-3xl p-6"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(var(--m3-surface-container-high, var(--card))) 0%, 
                  hsl(var(--m3-surface-container, var(--secondary))) 100%)`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              {/* Content */}
              <div className="relative flex items-center gap-6">
                {/* Readiness Dial */}
                <ReadinessDial
                  score={dailyState.readinessScore}
                  isCompleted={dailyState.isCheckedIn}
                  level={dailyState.readinessLevel}
                />

                {/* Metrics & Status */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold">{dailyState.readinessLabel}</h2>
                    <p className="text-sm text-muted-foreground">{dailyState.readinessReason}</p>
                  </div>

                  {/* Quick metrics */}
                  <div className="flex flex-wrap gap-2">
                    {dailyState.sleepHours > 0 && (
                      <MetricPill
                        icon={Moon}
                        label="Sonno"
                        value={dailyState.sleepHours}
                        unit="h"
                      />
                    )}
                    {dailyState.hrvRmssd && (
                      <MetricPill
                        icon={Heart}
                        label="HRV"
                        value={Math.round(dailyState.hrvRmssd)}
                        unit="ms"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Check-in prompt */}
              {!dailyState.isCheckedIn && (
                <motion.div
                  className="mt-4 pt-4 border-t border-[hsl(var(--m3-outline-variant,var(--border))/0.3)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    className="w-full rounded-xl h-12 font-medium"
                    onClick={() => navigate("/athlete")}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Completa il Check-in
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* ===== TODAY'S WORKOUT CARD ===== */}
            {todayWorkout && (
              <motion.div
                className="rounded-2xl p-4 border border-[hsl(var(--m3-outline-variant,var(--border))/0.3)] bg-[hsl(var(--m3-surface-container,var(--card)))]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-[hsl(var(--m3-primary,var(--primary)))] flex items-center justify-center">
                      <Dumbbell className="h-6 w-6 text-[hsl(var(--m3-on-primary,var(--primary-foreground)))]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Esecuzione di oggi
                      </p>
                      <p className="font-semibold">{todayWorkout.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {todayWorkout.exerciseCount} esercizi
                        </Badge>
                        {todayWorkout.estimatedDuration && (
                          <span className="text-xs text-muted-foreground">
                            ~{todayWorkout.estimatedDuration} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-xl"
                    onClick={() => navigate(`/athlete/workout/${todayWorkout.id}`)}
                    disabled={!dailyState.isCheckedIn}
                  >
                    <Play className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ===== QUICK ACTIONS ===== */}
            <div className="flex gap-3">
              <QuickActionCard
                icon={Utensils}
                title="Registra Pasto"
                subtitle={`${nutrition.percentages.calories}% kcal`}
                onClick={() => navigate("/athlete/nutrition")}
              />
              <QuickActionCard
                icon={Activity}
                title="Le mie Abitudini"
                subtitle={`${habits.completed}/${habits.total} oggi`}
                onClick={() => navigate("/athlete/training")}
                accent
              />
            </div>

            {/* ===== TRAINING DAY INDICATOR ===== */}
            <div className="flex justify-center">
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs backdrop-blur-sm",
                  nutrition.isTrainingDay
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                )}
              >
                {nutrition.isTrainingDay ? "🏋️ Giorno di Allenamento" : "🌿 Giorno di Riposo"}
              </Badge>
            </div>
          </div>
        </main>

        {/* ===== FLOATING ACTION BUTTON ===== */}
        <AnimatePresence>
          <div className="absolute bottom-24 right-5 z-50">
            {/* FAB Menu Items */}
            <AnimatePresence>
              {fabOpen && (
                <>
                  <motion.button
                    className="absolute bottom-16 right-0 h-12 w-12 rounded-full bg-[hsl(var(--m3-tertiary-container,var(--secondary)))] shadow-lg flex items-center justify-center"
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    transition={{ delay: 0.05 }}
                    onClick={() => {
                      setFabOpen(false);
                      navigate("/athlete/nutrition");
                    }}
                  >
                    <Apple className="h-5 w-5 text-[hsl(var(--m3-on-tertiary-container,var(--foreground)))]" />
                  </motion.button>
                  <motion.button
                    className="absolute bottom-32 right-0 h-12 w-12 rounded-full bg-[hsl(var(--m3-secondary-container,var(--secondary)))] shadow-lg flex items-center justify-center"
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    onClick={() => {
                      setFabOpen(false);
                      if (todayWorkout) {
                        navigate(`/athlete/workout/${todayWorkout.id}`);
                      }
                    }}
                  >
                    <Dumbbell className="h-5 w-5 text-[hsl(var(--m3-on-secondary-container,var(--foreground)))]" />
                  </motion.button>
                </>
              )}
            </AnimatePresence>

            {/* Main FAB */}
            <motion.button
              className="h-14 w-14 rounded-full bg-[hsl(var(--m3-primary,var(--primary)))] shadow-lg flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
              animate={{ rotate: fabOpen ? 45 : 0 }}
              onClick={() => setFabOpen(!fabOpen)}
            >
              <Plus className="h-6 w-6 text-[hsl(var(--m3-on-primary,var(--primary-foreground)))]" />
            </motion.button>
          </div>
        </AnimatePresence>

        {/* ===== BOTTOM NAVIGATION ===== */}
        <AthleteBottomNav />
      </div>
    </ResponsivePhoneWrapper>
  );
}

// Helper function for time-based greeting
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buongiorno";
  if (hour < 18) return "Buon pomeriggio";
  return "Buonasera";
}
