import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { triggerConfetti } from "@/utils/ux";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Brain,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Dumbbell,
  HeartPulse,
  Moon,
  Play,
  Scale,
  ShieldAlert,
  Smile,
  Sun,
  Zap,
} from "lucide-react";

import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MealScannerDialog } from "@/components/nutrition/MealScannerDialog";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useReadiness,
  initialReadiness,
  ReadinessResult,
} from "@/hooks/useReadiness";
import { calculateReadinessScore } from "@/lib/math/readinessMath";
import { useNutritionTargets } from "@/hooks/useNutritionTargets";
import { useFmsAlerts } from "@/hooks/useFmsAlerts";
import { useMetabolicStore } from "@/stores/useMetabolicStore";

// ============================================================================
// Body parts for DOMS map (used inside check-in drawer)
// ============================================================================
const bodyParts = [
  "Petto", "Tricipiti", "Bicipiti", "Spalle", "Trapezi", "Dorsali",
  "Bassa Schiena", "Glutei", "Femorali", "Quadricipiti", "Polpacci",
] as const;

type BodyPart = (typeof bodyParts)[number];
type SorenessLevel = 0 | 1 | 2 | 3;

const sorenessConfig: Record<
  SorenessLevel,
  { bg: string; text: string; label: string }
> = {
  0: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", label: "Nessuno" },
  1: { bg: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-700 dark:text-yellow-300", label: "Leggero" },
  2: { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", label: "Moderato" },
  3: { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-700 dark:text-rose-300", label: "Acuto" },
};

// ============================================================================
// Hero Readiness Ring — large, premium, "Oura-style"
// ============================================================================
function ReadinessHeroRing({
  score,
  brandColor,
  isCompleted,
}: {
  score: number;
  brandColor?: string | null;
  isCompleted: boolean;
}) {
  const radius = 64;
  const stroke = 10;
  const r = radius - stroke / 2;
  const circumference = r * 2 * Math.PI;
  const pct = isCompleted ? Math.max(0, Math.min(100, score)) / 100 : 0;
  const dashOffset = circumference * (1 - pct);

  const ringColor = !isCompleted
    ? "hsl(var(--muted-foreground))"
    : score >= 75
      ? "hsl(160 84% 39%)"
      : score >= 50
        ? "hsl(38 92% 50%)"
        : "hsl(0 84% 60%)";

  return (
    <div className="relative h-32 w-32 flex-shrink-0">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="-rotate-90"
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      >
        <circle
          stroke="hsl(var(--muted) / 0.4)"
          fill="transparent"
          strokeWidth={stroke}
          r={r}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={ringColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          r={r}
          cx={radius}
          cy={radius}
          style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isCompleted ? (
          <>
            <span
              className="text-4xl font-bold tabular-nums leading-none"
              style={{ color: ringColor }}
            >
              {score}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
              Readiness
            </span>
          </>
        ) : (
          <>
            <Sun className="h-7 w-7 text-amber-500" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5 text-center px-2">
              Tap to check-in
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compact Macro Pill — horizontal mini bar
// ============================================================================
function MacroPill({
  label,
  current,
  target,
  colorClass,
}: {
  label: string;
  current: number;
  target: number;
  colorClass: string;
}) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
        <span className="text-[10px] font-semibold tabular-nums text-foreground/80">
          {Math.round(current)}
          <span className="text-muted-foreground font-normal">/{target}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Drawer slider card (shared by check-in)
// ============================================================================
const ParamSliderCard = ({
  label, value, onChange, lowLabel, highLabel, inverted = false, icon: Icon,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
  inverted?: boolean;
  icon: React.ElementType;
}) => {
  const getSliderColor = () => {
    if (inverted) {
      if (value <= 3) return "bg-success";
      if (value <= 6) return "bg-warning";
      return "bg-destructive";
    }
    if (value >= 7) return "bg-success";
    if (value >= 4) return "bg-warning";
    return "bg-destructive";
  };
  return (
    <div className="p-3 rounded-xl bg-secondary/50 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className="h-4 w-4 text-primary" />
          {label}
        </Label>
        <span className={cn("text-sm font-semibold tabular-nums px-2 py-0.5 rounded-md text-white", getSliderColor())}>
          {value}
        </span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={1} max={10} step={1} className="w-full" />
      <div className="flex justify-between text-[10px] text-foreground/60">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
};

const BodyPartChip = ({ part, level, onClick }: { part: BodyPart; level: SorenessLevel; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95",
      sorenessConfig[level].bg, sorenessConfig[level].text,
    )}
  >
    {part}
  </button>
);

// ============================================================================
// MAIN — Athlete Dashboard (Widget Control Center)
// ============================================================================
export default function AthleteDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const currentUserId = user?.id ?? null;
  const todayDate = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  // Payment success celebration
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      triggerConfetti();
      toast.success("Pagamento confermato!", {
        description: "Il tuo abbonamento è ora attivo.",
        duration: 5000,
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Auto-open check-in drawer on redirect
  useEffect(() => {
    if (searchParams.get("openCheckin") === "true") {
      setDrawerOpen(true);
      setSearchParams(
        (prev) => { prev.delete("openCheckin"); return prev; },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  // ---- Data hooks ----
  const {
    readiness, tempReadiness, setTempReadiness, isSaving,
    calculateReadiness, saveReadiness, baseline,
  } = useReadiness();

  const { targets: nutritionTargets } = useNutritionTargets(currentUserId || undefined);
  const { todayIntake } = useMetabolicStore();
  const { data: fmsData } = useFmsAlerts(currentUserId);

  // Coach branding
  const { data: coachProfile } = useQuery({
    queryKey: ["coach-branding", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data: athleteProfile } = await supabase
        .from("profiles").select("coach_id").eq("id", currentUserId).single();
      if (!athleteProfile?.coach_id) return null;
      const { data: coach } = await supabase
        .from("profiles").select("logo_url, brand_color, full_name")
        .eq("id", athleteProfile.coach_id).single();
      return coach;
    },
    enabled: !!currentUserId,
    staleTime: 10 * 60 * 1000,
  });

  // Today's workout
  const { data: todayWorkout } = useQuery({
    queryKey: ["todays-workout", currentUserId, todayDate],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data } = await supabase
        .from("workouts")
        .select("id, title, estimated_duration, structure, status")
        .eq("athlete_id", currentUserId)
        .eq("scheduled_date", todayDate)
        .in("status", ["pending", "completed"])
        .maybeSingle();
      return data;
    },
    enabled: !!currentUserId,
    staleTime: 60 * 1000,
  });

  // Readiness derived
  const readinessResult: ReadinessResult = readiness.isCompleted
    ? calculateReadiness(readiness)
    : {
        score: 0, level: "moderate" as const, color: "text-muted-foreground",
        bgColor: "bg-muted", label: "Check-in non completato", reason: "",
        penalties: [], isNewUser: baseline.isNewUser, dataPoints: baseline.dataPoints,
        breakdown: null, hrvStatus: "optimal" as const, rhrStatus: "optimal" as const,
      };

  const displayScore = readinessResult.score;
  const canTrain = readiness.isCompleted;
  const isLowReadiness = readiness.isCompleted && displayScore < 40;
  const hasFmsRedFlags = !!fmsData?.hasRedFlags;

  const statusBadge = !readiness.isCompleted
    ? { label: "Check-in", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" }
    : displayScore >= 75
      ? { label: "Optimal", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" }
      : displayScore >= 50
        ? { label: "Caution", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" }
        : { label: "Rest", color: "bg-rose-500/15 text-rose-600 border-rose-500/30" };

  // Sync drawer state
  useEffect(() => {
    if (drawerOpen) {
      setTempReadiness(
        readiness.isCompleted ? { ...readiness } : { ...initialReadiness },
      );
    }
  }, [drawerOpen, readiness, setTempReadiness]);

  const handleSubmitReadiness = async () => {
    const sorenessValues = Object.values(tempReadiness.sorenessMap || {}) as number[];
    const maxSoreness = sorenessValues.length > 0 ? Math.max(...sorenessValues) : 0;
    const sorenessScale = Math.round(1 + (maxSoreness / 3) * 9);
    const dynamicScore = calculateReadinessScore({
      sleepHours: tempReadiness.sleepHours, stress: tempReadiness.stress,
      soreness: sorenessScale, mood: tempReadiness.mood,
      hrv: tempReadiness.hrvRmssd, rhr: tempReadiness.restingHr,
      hrvBaseline: baseline.hrvBaseline, rhrBaseline: baseline.restingHrBaseline,
      hrvSd: baseline.hrvSd, rhrSd: baseline.restingHrSd,
    });
    await saveReadiness({ ...tempReadiness, score: dynamicScore });
    setDrawerOpen(false);
  };

  const handleSorenessToggle = (part: BodyPart) => {
    setTempReadiness((prev) => {
      const sorenessMap = prev.sorenessMap || {};
      const currentLevel = (sorenessMap[part] ?? 0) as SorenessLevel;
      const nextLevel = ((currentLevel + 1) % 4) as SorenessLevel;
      const newMap = { ...sorenessMap };
      if (nextLevel === 0) delete newMap[part];
      else newMap[part] = nextLevel;
      return { ...prev, sorenessMap: newMap };
    });
  };

  const handleSleepHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") { setTempReadiness((p) => ({ ...p, sleepHours: 0 })); return; }
    const value = parseFloat(raw);
    if (!isNaN(value) && value >= 0 && value <= 24) {
      setTempReadiness((p) => ({ ...p, sleepHours: value }));
    }
  };

  const tempReadinessResult = calculateReadiness(tempReadiness);
  const firstName = (profile?.full_name || "").split(" ")[0] || "Atleta";
  const brandColor = coachProfile?.brand_color || null;

  return (
    <AthleteLayout>
      <div className="flex flex-col gap-3 p-4 pb-24">
        {/* ===== TOP BAR ===== */}
        <header className="flex items-center justify-between pt-1">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {format(new Date(), "EEEE d MMMM", { locale: it })}
            </p>
            <h1 className="text-lg font-semibold leading-tight truncate">
              Ready for today, {firstName}?
            </h1>
          </div>
          <button
            onClick={() => navigate("/athlete/profile")}
            className="flex-shrink-0 active:scale-95 transition-transform"
            aria-label="Apri profilo"
          >
            <Avatar className="h-10 w-10 border border-border/50">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={firstName} />}
              <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                {firstName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
        </header>

        {/* ===== HERO WIDGET — READINESS / FMS STATUS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card
            className="relative overflow-hidden border-border/40 cursor-pointer rounded-3xl shadow-sm hover:shadow-md transition-shadow"
            onClick={() => setDrawerOpen(true)}
          >
            {/* Soft brand glow */}
            <div
              className="absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: brandColor || "hsl(var(--primary))" }}
            />

            <CardContent className="relative p-5 flex items-center gap-5">
              <ReadinessHeroRing
                score={displayScore}
                brandColor={brandColor}
                isCompleted={readiness.isCompleted}
              />

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-semibold uppercase tracking-wider border", statusBadge.color)}
                  >
                    {statusBadge.label}
                  </Badge>
                  {hasFmsRedFlags && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold uppercase tracking-wider border bg-rose-500/15 text-rose-600 border-rose-500/30 gap-1"
                    >
                      <ShieldAlert className="h-3 w-3" />
                      FMS
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                  {readiness.isCompleted
                    ? readinessResult.reason || "Tutti i parametri ottimali"
                    : "Sblocca l'allenamento con il check-in mattutino."}
                </p>
                {baseline.isNewUser && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    Baseline {baseline.dataPoints}/3 giorni
                  </div>
                )}
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        </motion.div>

        {/* ===== ACTION WIDGET — TODAY'S TRAINING ===== */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {todayWorkout ? (
            <Card
              className={cn(
                "relative overflow-hidden border-0 rounded-3xl shadow-md",
                !canTrain && "opacity-70",
              )}
              style={{
                background: canTrain
                  ? `linear-gradient(135deg, ${brandColor || "hsl(var(--primary))"} 0%, ${brandColor || "hsl(var(--primary))"}cc 100%)`
                  : "linear-gradient(135deg, hsl(var(--muted)), hsl(var(--muted)/0.7))",
              }}
            >
              <CardContent className="p-5 flex items-center gap-4 text-white">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
                      Today's Mission
                    </span>
                  </div>
                  <h2 className="text-xl font-bold leading-tight truncate">
                    {todayWorkout.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1.5 text-xs opacity-90">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {todayWorkout.estimated_duration || 45} min
                    </span>
                    {canTrain && isLowReadiness && (
                      <span className="flex items-center gap-1 font-semibold">
                        <AlertTriangle className="h-3 w-3" />
                        Scala intensità
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  size="lg"
                  className={cn(
                    "h-12 min-h-[48px] px-5 rounded-2xl bg-white text-foreground font-semibold shadow-lg",
                    "hover:bg-white/95 active:scale-95 transition-all",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canTrain) { setDrawerOpen(true); return; }
                    navigate(`/athlete/workout/${todayWorkout.id}`);
                  }}
                  style={{ color: brandColor || "hsl(var(--primary))" }}
                >
                  <Play className="h-4 w-4 fill-current" />
                  {canTrain ? "Start" : "Check-in"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl border-border/40 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Moon className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-emerald-700 dark:text-emerald-400">
                    Rest Day
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Nessun workout programmato. Concentrati sul recupero.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[48px]"
                  onClick={() => navigate("/athlete/workout")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* ===== METABOLIC WIDGET — NUTRITION ===== */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="relative rounded-3xl border-border/40 shadow-sm overflow-visible">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Metabolic Hub
                  </p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {Math.round(todayIntake.calories)}
                    <span className="text-muted-foreground font-normal">
                      {" / "}
                      {nutritionTargets.calories} kcal
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => navigate("/athlete/nutrition")}
                  className="text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1 min-h-[44px] px-2"
                >
                  Logs
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              <div className="flex items-stretch gap-4">
                <MacroPill
                  label="Cal"
                  current={todayIntake.calories}
                  target={nutritionTargets.calories}
                  colorClass="bg-rose-500"
                />
                <MacroPill
                  label="Pro"
                  current={todayIntake.protein}
                  target={nutritionTargets.protein}
                  colorClass="bg-violet-500"
                />
                <MacroPill
                  label="Carb"
                  current={todayIntake.carbs}
                  target={nutritionTargets.carbs}
                  colorClass="bg-amber-500"
                />
                <MacroPill
                  label="Fat"
                  current={todayIntake.fats}
                  target={nutritionTargets.fats}
                  colorClass="bg-emerald-500"
                />
              </div>
            </CardContent>

            {/* Floating "Snap Meal" camera FAB */}
            <button
              onClick={() => setScannerOpen(true)}
              className={cn(
                "absolute -top-3 -right-3 h-12 w-12 rounded-full",
                "flex items-center justify-center shadow-lg",
                "bg-foreground text-background active:scale-90 transition-transform",
                "ring-4 ring-background",
              )}
              aria-label="Snap meal"
            >
              <Camera className="h-5 w-5" />
            </button>
          </Card>
        </motion.div>
      </div>

      {/* ===== MEAL SCANNER ===== */}
      <MealScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} />

      {/* ===== READINESS DRAWER ===== */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="theme-athlete max-h-[90vh] bg-background">
          <div className="mx-auto w-full max-w-md overflow-y-auto">
            <DrawerHeader className="text-center pb-2">
              <DrawerTitle className="text-lg">Morning Check-in</DrawerTitle>
              <DrawerDescription className="text-xs">
                Registra i tuoi dati biometrici del mattino
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-4 pb-4 space-y-6 overflow-y-auto">
              {/* WEARABLE METRICS */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  METRICHE WEARABLE
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-secondary/50 space-y-2">
                    <span className="text-[10px] text-foreground/60 uppercase tracking-wide">HRV (RMSSD)</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number" value={tempReadiness.hrvRmssd ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTempReadiness((p) => ({ ...p, hrvRmssd: v === "" ? null : parseInt(v) }));
                        }}
                        min={10} max={200} placeholder="—"
                        className="w-full h-12 text-center text-xl font-bold bg-card border-0"
                      />
                      <span className="text-sm text-foreground/60">ms</span>
                    </div>
                    {baseline.hrvBaseline && (
                      <p className="text-[10px] text-muted-foreground">Baseline: {Math.round(baseline.hrvBaseline)}ms</p>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50 space-y-2">
                    <span className="text-[10px] text-foreground/60 uppercase tracking-wide">FC a Riposo</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number" value={tempReadiness.restingHr ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTempReadiness((p) => ({ ...p, restingHr: v === "" ? null : parseInt(v) }));
                        }}
                        min={30} max={120} placeholder="—"
                        className="w-full h-12 text-center text-xl font-bold bg-card border-0"
                      />
                      <span className="text-sm text-foreground/60">bpm</span>
                    </div>
                    {baseline.restingHrBaseline && (
                      <p className="text-[10px] text-muted-foreground">Baseline: {Math.round(baseline.restingHrBaseline)}bpm</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SLEEP */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <Moon className="h-4 w-4 text-primary" />
                  SONNO
                </Label>
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-secondary/50">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-foreground/60 uppercase tracking-wide">Ore</span>
                    <Input
                      type="number" value={tempReadiness.sleepHours} onChange={handleSleepHoursChange}
                      step={0.5} min={0} max={24}
                      className="w-16 h-12 text-center text-xl font-bold bg-card border-0"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-foreground/60 uppercase tracking-wide">Qualità</span>
                      <span className="text-sm font-semibold tabular-nums">{tempReadiness.sleepQuality}/10</span>
                    </div>
                    <Slider
                      value={[tempReadiness.sleepQuality]}
                      onValueChange={([v]) => setTempReadiness((p) => ({ ...p, sleepQuality: v }))}
                      min={1} max={10} step={1}
                    />
                  </div>
                </div>
              </div>

              {/* WEIGHT */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <Scale className="h-4 w-4 text-primary" />
                  PESO CORPOREO
                </Label>
                <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="number" value={tempReadiness.bodyWeight ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTempReadiness((p) => ({ ...p, bodyWeight: v === "" ? null : parseFloat(v) }));
                      }}
                      step={0.1} min={30} max={300} placeholder="—"
                      className="w-24 h-12 text-center text-xl font-bold bg-card border-0"
                    />
                    <span className="text-sm text-foreground/60">kg</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground max-w-[140px]">A digiuno per dato accurato</p>
                </div>
              </div>

              {/* SUBJECTIVE */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <Activity className="h-4 w-4 text-primary" />
                  COME TI SENTI?
                </Label>
                <ParamSliderCard label="Energia" value={tempReadiness.energy}
                  onChange={(v) => setTempReadiness((p) => ({ ...p, energy: v }))}
                  lowLabel="Low" highLabel="High" icon={Zap} />
                <ParamSliderCard label="Stress" value={tempReadiness.stress}
                  onChange={(v) => setTempReadiness((p) => ({ ...p, stress: v }))}
                  lowLabel="Low" highLabel="High" inverted icon={Brain} />
                <ParamSliderCard label="Umore" value={tempReadiness.mood}
                  onChange={(v) => setTempReadiness((p) => ({ ...p, mood: v }))}
                  lowLabel="Low" highLabel="High" icon={Smile} />
                <ParamSliderCard label="Digestione" value={tempReadiness.digestion}
                  onChange={(v) => setTempReadiness((p) => ({ ...p, digestion: v }))}
                  lowLabel="Poor" highLabel="Great" icon={HeartPulse} />
              </div>

              {/* SORENESS */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  SORENESS MAP
                </Label>
                <p className="text-[10px] text-foreground/60">
                  Tocca per ciclare: Nessuno → Leggero → Moderato → Acuto
                </p>
                <div className="flex flex-wrap gap-2">
                  {bodyParts.map((part) => (
                    <BodyPartChip
                      key={part}
                      part={part}
                      level={(tempReadiness.sorenessMap?.[part] ?? 0) as SorenessLevel}
                      onClick={() => handleSorenessToggle(part)}
                    />
                  ))}
                </div>
              </div>

              {tempReadinessResult.isNewUser && (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Baseline in costruzione ({baseline.dataPoints}/3 giorni)
                  </p>
                </div>
              )}
            </div>

            <DrawerFooter className="pt-2">
              <Button
                onClick={handleSubmitReadiness}
                className="w-full h-12 font-semibold gradient-primary"
                disabled={isSaving}
              >
                <Check className="h-4 w-4 mr-2" />
                {isSaving ? "Salvataggio..." : "Conferma Check-in"}
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" className="w-full text-primary hover:bg-primary/10">
                  Annulla
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </AthleteLayout>
  );
}
