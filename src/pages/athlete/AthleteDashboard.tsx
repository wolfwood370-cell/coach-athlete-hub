import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { 
  Moon, 
  Brain, 
  HeartPulse,
  ChevronRight,
  Flame,
  Footprints,
  UtensilsCrossed,
  Dumbbell,
  Sparkles,
  Clock,
  Zap,
  Smile,
  Activity,
  Check,
  Scale
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReadiness, initialReadiness, ReadinessData } from "@/hooks/useReadiness";
import { AcwrCard } from "@/components/athlete/AcwrCard";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Body parts for DOMS map
const bodyParts = [
  "Petto", "Tricipiti", "Bicipiti", "Spalle", "Trapezi", "Dorsali",
  "Bassa Schiena", "Glutei", "Femorali", "Quadricipiti", "Polpacci"
] as const;

type BodyPart = typeof bodyParts[number];
type SorenessLevel = 0 | 1 | 2 | 3;

interface SorenessMap {
  [key: string]: SorenessLevel;
}

const todayTasks = [
  { 
    id: "workout",
    label: "Upper Body Hypertrophy",
    sublabel: "45 min · 6 esercizi",
    icon: Dumbbell,
    type: "workout" as const,
    progress: undefined,
    value: undefined,
    target: undefined,
  },
  { 
    id: "steps",
    label: "Passi",
    sublabel: undefined,
    icon: Footprints,
    type: "progress" as const,
    progress: 35,
    value: 3500,
    target: 10000,
  },
  { 
    id: "nutrition",
    label: "Macros",
    sublabel: undefined,
    icon: UtensilsCrossed,
    type: "progress" as const,
    progress: 48,
    value: 1200,
    target: 2500,
  },
];

// Soreness level colors and labels
const sorenessConfig: Record<SorenessLevel, { bg: string; label: string }> = {
  0: { bg: "bg-secondary", label: "Nessuno" },
  1: { bg: "bg-warning/80", label: "Leggero" },
  2: { bg: "bg-orange-500", label: "Moderato" },
  3: { bg: "bg-destructive", label: "Acuto" },
};

// ============================================
// HRV-BASED READINESS ALGORITHM (MacroFactor Style)
// ============================================

interface HrvReadinessResult {
  score: number;
  level: "high" | "moderate" | "low";
  color: string;
  bgColor: string;
  label: string;
  reason: string;
  factors: Array<{ label: string; status: "good" | "warning" | "bad"; detail: string }>;
}

/**
 * Calculate readiness based on HRV and Sleep data
 * Uses baseline comparison for HRV assessment
 */
function calculateHrvReadiness(
  hrv: number | null,
  hrvBaseline: number,
  sleepHours: number,
  sleepQuality: number,
  energy: number,
  stress: number
): HrvReadinessResult {
  const factors: HrvReadinessResult["factors"] = [];
  let score = 0;
  let primaryReason = "";
  
  // Calculate HRV deviation from baseline
  const hrvDeviation = hrv !== null ? ((hrv - hrvBaseline) / hrvBaseline) * 100 : null;
  
  // HRV Analysis (40 points max)
  if (hrv !== null && hrvBaseline > 0) {
    if (hrvDeviation !== null) {
      if (hrvDeviation >= -10) {
        // Within baseline (+/- 10%)
        score += 40;
        factors.push({ label: "HRV", status: "good", detail: `${hrv}ms (${hrvDeviation > 0 ? "+" : ""}${hrvDeviation.toFixed(0)}% vs baseline)` });
      } else if (hrvDeviation > -20) {
        // Moderate drop (10-20%)
        score += 25;
        factors.push({ label: "HRV", status: "warning", detail: `${hrv}ms (${hrvDeviation.toFixed(0)}% vs baseline)` });
        if (!primaryReason) primaryReason = `HRV ${hrvDeviation.toFixed(0)}% sotto baseline`;
      } else {
        // Significant drop (>20%)
        score += 10;
        factors.push({ label: "HRV", status: "bad", detail: `${hrv}ms (${hrvDeviation.toFixed(0)}% vs baseline)` });
        if (!primaryReason) primaryReason = `HRV critico: ${hrvDeviation.toFixed(0)}% sotto baseline`;
      }
    }
  } else {
    // No HRV data - use moderate score
    score += 25;
    factors.push({ label: "HRV", status: "warning", detail: "Nessun dato" });
  }
  
  // Sleep Duration Analysis (25 points max)
  if (sleepHours >= 7) {
    score += 25;
    factors.push({ label: "Sonno", status: "good", detail: `${sleepHours}h` });
  } else if (sleepHours >= 6) {
    score += 15;
    factors.push({ label: "Sonno", status: "warning", detail: `${sleepHours}h` });
    if (!primaryReason) primaryReason = "Sonno insufficiente";
  } else {
    score += 5;
    factors.push({ label: "Sonno", status: "bad", detail: `${sleepHours}h` });
    if (!primaryReason) primaryReason = `Solo ${sleepHours}h di sonno`;
  }
  
  // Sleep Quality (15 points max)
  const sqNorm = sleepQuality / 10;
  if (sqNorm >= 0.7) {
    score += 15;
    factors.push({ label: "Qualità Sonno", status: "good", detail: `${sleepQuality}/10` });
  } else if (sqNorm >= 0.4) {
    score += 10;
    factors.push({ label: "Qualità Sonno", status: "warning", detail: `${sleepQuality}/10` });
  } else {
    score += 5;
    factors.push({ label: "Qualità Sonno", status: "bad", detail: `${sleepQuality}/10` });
    if (!primaryReason) primaryReason = "Qualità del sonno scarsa";
  }
  
  // Energy Level (10 points max)
  const energyNorm = energy / 10;
  if (energyNorm >= 0.7) {
    score += 10;
  } else if (energyNorm >= 0.4) {
    score += 6;
  } else {
    score += 2;
    if (!primaryReason) primaryReason = "Livello energetico basso";
  }
  
  // Stress Penalty (10 points max, inverted)
  const stressNorm = stress / 10;
  if (stressNorm <= 0.3) {
    score += 10;
  } else if (stressNorm <= 0.6) {
    score += 6;
  } else {
    score += 2;
    if (!primaryReason) primaryReason = "Stress elevato";
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  // Determine level
  let level: HrvReadinessResult["level"];
  let color: string;
  let bgColor: string;
  let label: string;
  
  if (score >= 75) {
    level = "high";
    color = "text-success";
    bgColor = "bg-success";
    label = "Alta Prontezza";
    if (!primaryReason) primaryReason = "Tutti i parametri ottimali";
  } else if (score >= 50) {
    level = "moderate";
    color = "text-warning";
    bgColor = "bg-warning";
    label = "Prontezza Moderata";
  } else {
    level = "low";
    color = "text-destructive";
    bgColor = "bg-destructive";
    label = "Bassa Prontezza";
  }
  
  return { score, level, color, bgColor, label, reason: primaryReason, factors };
}

// ============================================
// LARGE CIRCULAR READINESS INDICATOR
// ============================================

const LargeReadinessCircle = ({ 
  score, 
  level,
  isOverridden 
}: { 
  score: number;
  level: "high" | "moderate" | "low";
  isOverridden?: boolean;
}) => {
  const radius = 56;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (level === "high") return "hsl(160 84% 39%)";
    if (level === "moderate") return "hsl(38 92% 50%)";
    return "hsl(0 84% 60%)";
  };

  return (
    <div className="relative h-28 w-28">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          stroke="hsl(var(--secondary))"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress ring */}
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ 
            strokeDashoffset,
            transition: "stroke-dashoffset 0.8s ease-out"
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(
          "text-3xl font-bold tabular-nums",
          level === "high" ? "text-success" : level === "moderate" ? "text-warning" : "text-destructive"
        )}>
          {score}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {isOverridden ? "Override" : "Score"}
        </span>
      </div>
    </div>
  );
};

// Original small ring for existing completed state
const ReadinessRing = ({ score }: { score: number }) => {
  const radius = 40;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return "hsl(160 84% 39%)"; // success
    if (score >= 50) return "hsl(38 92% 50%)"; // warning
    return "hsl(0 84% 60%)"; // destructive
  };

  return (
    <div className="relative h-20 w-20">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          stroke="hsl(var(--secondary))"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress ring */}
        <circle
          stroke={getScoreColor()}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ 
            strokeDashoffset,
            transition: "stroke-dashoffset 0.5s ease-out"
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Zap className={cn(
          "h-6 w-6",
          score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"
        )} />
      </div>
    </div>
  );
};

// Psychophysical Slider Card
const ParamSliderCard = ({ 
  label, 
  value, 
  onChange,
  lowLabel,
  highLabel,
  inverted = false,
  icon: Icon
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
      // For stress: high is bad
      if (value <= 3) return "bg-success";
      if (value <= 6) return "bg-warning";
      return "bg-destructive";
    }
    // For normal: high is good
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
        <span className={cn(
          "text-sm font-semibold tabular-nums px-2 py-0.5 rounded-md",
          getSliderColor(),
          "text-white"
        )}>
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={10}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-foreground/60">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
};

// Body Part Chip Component
const BodyPartChip = ({
  part,
  level,
  onClick
}: {
  part: BodyPart;
  level: SorenessLevel;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        "active:scale-95",
        sorenessConfig[level].bg,
        level === 0 ? "text-muted-foreground" : "text-white"
      )}
    >
      {part}
    </button>
  );
};

export default function AthleteDashboard() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [subjectiveOverride, setSubjectiveOverride] = useState<number | null>(null);
  const [showOverrideSlider, setShowOverrideSlider] = useState(false);
  const [tempOverride, setTempOverride] = useState(70);
  
  const {
    readiness,
    tempReadiness,
    setTempReadiness,
    isLoading,
    isSaving,
    calculateScore,
    saveReadiness,
  } = useReadiness();

  // Simulated HRV data (would come from wearable integration)
  // In production, this would be fetched from daily_metrics.hrv_rmssd
  const hrvBaseline = 55; // ms - user's baseline HRV
  const currentHrv = readiness.isCompleted 
    ? Math.round(hrvBaseline * (0.8 + (readiness.energy / 10) * 0.4)) // Simulate based on energy
    : null;
  
  // Calculate HRV-based readiness
  const hrvReadiness = calculateHrvReadiness(
    currentHrv,
    hrvBaseline,
    readiness.sleepHours,
    readiness.sleepQuality,
    readiness.energy,
    readiness.stress
  );
  
  // Use override if set, otherwise use calculated score
  const displayScore = subjectiveOverride !== null ? subjectiveOverride : hrvReadiness.score;
  const isOverridden = subjectiveOverride !== null;

  // Sync tempReadiness when drawer opens
  useEffect(() => {
    if (drawerOpen) {
      setTempReadiness(readiness.isCompleted ? { ...readiness } : { ...initialReadiness });
    }
  }, [drawerOpen, readiness, setTempReadiness]);

  const handleOpenDrawer = () => {
    setDrawerOpen(true);
  };

  const handleSubmitReadiness = async () => {
    await saveReadiness(tempReadiness);
    setDrawerOpen(false);
  };

  const handleSorenessToggle = (part: BodyPart) => {
    setTempReadiness(prev => {
      const sorenessMap = prev.sorenessMap || {};
      const currentLevel = (sorenessMap[part] ?? 0) as SorenessLevel;
      const nextLevel = ((currentLevel + 1) % 4) as SorenessLevel;
      
      const newMap = { ...sorenessMap };
      if (nextLevel === 0) {
        delete newMap[part];
      } else {
        newMap[part] = nextLevel;
      }
      
      return { ...prev, sorenessMap: newMap };
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Ottimo";
    if (score >= 50) return "Moderato";
    return "Basso";
  };

  const handleSleepHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 24) {
      setTempReadiness(prev => ({ ...prev, sleepHours: value }));
    }
  };

  return (
    <AthleteLayout>
      <div className="space-y-5 p-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-muted-foreground text-xs">Buongiorno</p>
            <h1 className="text-lg font-semibold">Sofia 👋</h1>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">SN</span>
          </div>
        </div>

        {/* ===== ENHANCED MORNING READINESS CARD ===== */}
        <Card className="border-0 overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-0">
            {!readiness.isCompleted ? (
              /* ===== NOT COMPLETED STATE ===== */
              <div className="p-5 text-center">
                <div className="relative mx-auto mb-4 h-20 w-20">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse-soft" />
                  <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-base mb-1">Prontezza Giornaliera</h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-[200px] mx-auto">
                  Compila il check giornaliero per ottimizzare il tuo piano
                </p>
                <Button 
                  onClick={handleOpenDrawer}
                  className="w-full h-12 text-sm font-semibold gradient-primary"
                  disabled={isLoading}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Biofeedback
                </Button>
              </div>
            ) : (
              /* ===== ENHANCED COMPLETED STATE ===== */
              <div className="p-5">
                {/* Top Row: Circle + Status */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Large Circle */}
                  <LargeReadinessCircle 
                    score={displayScore} 
                    level={displayScore >= 75 ? "high" : displayScore >= 50 ? "moderate" : "low"}
                    isOverridden={isOverridden}
                  />
                  
                  {/* Status & Reason */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn(
                        "text-base font-semibold",
                        displayScore >= 75 ? "text-success" : displayScore >= 50 ? "text-warning" : "text-destructive"
                      )}>
                        {displayScore >= 75 ? "Alta Prontezza" : displayScore >= 50 ? "Prontezza Moderata" : "Bassa Prontezza"}
                      </h3>
                      {isOverridden && (
                        <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary">
                          Override
                        </Badge>
                      )}
                    </div>
                    
                    {/* Reason / "Why" explanation */}
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {hrvReadiness.reason}
                    </p>
                    
                    {/* Factor Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {hrvReadiness.factors.slice(0, 3).map((factor, i) => (
                        <Badge 
                          key={i}
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-2 py-0.5",
                            factor.status === "good" && "bg-success/10 text-success border-success/20",
                            factor.status === "warning" && "bg-warning/10 text-warning border-warning/20",
                            factor.status === "bad" && "bg-destructive/10 text-destructive border-destructive/20"
                          )}
                        >
                          {factor.label}: {factor.detail}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* HRV & Sleep Row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="text-center p-2.5 rounded-xl bg-secondary/50">
                    <HeartPulse className="h-4 w-4 mx-auto text-primary mb-1" />
                    <p className="text-sm font-semibold tabular-nums">{currentHrv || "—"}</p>
                    <p className="text-[9px] text-muted-foreground">HRV ms</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-secondary/50">
                    <Moon className="h-4 w-4 mx-auto text-indigo-400 mb-1" />
                    <p className="text-sm font-semibold tabular-nums">{readiness.sleepHours}h</p>
                    <p className="text-[9px] text-muted-foreground">Sonno</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-secondary/50">
                    <Activity className="h-4 w-4 mx-auto text-emerald-400 mb-1" />
                    <p className="text-sm font-semibold tabular-nums">{readiness.energy}/10</p>
                    <p className="text-[9px] text-muted-foreground">Energia</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-secondary/50">
                    <Brain className="h-4 w-4 mx-auto text-amber-400 mb-1" />
                    <p className="text-sm font-semibold tabular-nums">{readiness.stress}/10</p>
                    <p className="text-[9px] text-muted-foreground">Stress</p>
                  </div>
                </div>
                
                {/* Subjective Override Section */}
                {!showOverrideSlider ? (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setShowOverrideSlider(true)}
                    >
                      <Smile className="h-4 w-4 mr-1.5" />
                      Mi sento {displayScore >= 75 ? "diversamente" : "meglio di così"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-xs text-muted-foreground"
                      onClick={handleOpenDrawer}
                    >
                      Modifica Check-in
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Come ti senti davvero?</Label>
                      <span className="text-sm font-bold text-primary tabular-nums">{tempOverride}</span>
                    </div>
                    <Slider
                      value={[tempOverride]}
                      onValueChange={([v]) => setTempOverride(v)}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs gradient-primary"
                        onClick={() => {
                          setSubjectiveOverride(tempOverride);
                          setShowOverrideSlider(false);
                          toast.success(`Override soggettivo salvato: ${tempOverride}/100`);
                        }}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Applica Override
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setShowOverrideSlider(false);
                          if (subjectiveOverride !== null) {
                            setSubjectiveOverride(null);
                            toast.info("Override rimosso, usando dati dispositivo");
                          }
                        }}
                      >
                        {subjectiveOverride !== null ? "Reset" : "Annulla"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== TODAY'S FOCUS ===== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Focus di Oggi</h2>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {todayTasks.length} attività
            </span>
          </div>
          
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <Card 
                key={task.id}
                className="border-0 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => {
                  if (task.type === 'workout') {
                    navigate('/athlete/workout/1');
                  }
                }}
              >
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      task.type === 'workout' ? "bg-primary/15" : "bg-secondary"
                    )}>
                      <task.icon className={cn(
                        "h-5 w-5",
                        task.type === 'workout' ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{task.label}</span>
                        {task.type === 'progress' && task.value !== undefined && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {task.value.toLocaleString()}/{task.target?.toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      {task.sublabel && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{task.sublabel}</span>
                        </div>
                      )}
                      
                      {task.progress !== undefined && (
                        <Progress 
                          value={task.progress} 
                          className="h-1 mt-2"
                        />
                      )}
                    </div>
                    
                    {/* Start button for workout */}
                    {task.type === 'workout' ? (
                      <Button 
                        size="sm" 
                        className="h-8 px-3 gradient-primary text-xs font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/athlete/workout/1');
                        }}
                      >
                        Start
                      </Button>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ===== QUICK STATS ===== */}
        <div className="grid grid-cols-2 gap-3">
          {/* ACWR Card */}
          <AcwrCard />
          
          <Card className="border-0">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground">Calorie</span>
              </div>
              <p className="text-xl font-bold tabular-nums">1,200</p>
              <p className="text-[10px] text-muted-foreground">/ 2,500 kcal</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Streak</span>
              </div>
              <p className="text-xl font-bold tabular-nums">12</p>
              <p className="text-[10px] text-muted-foreground">giorni consecutivi</p>
            </CardContent>
          </Card>
          
          <Card className="border-0">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Smile className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground">Umore</span>
              </div>
              <p className="text-xl font-bold tabular-nums">{readiness.isCompleted ? readiness.mood : "—"}</p>
              <p className="text-[10px] text-muted-foreground">/ 10</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== READINESS DRAWER (High-Fidelity Bio-Gate) ===== */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="theme-athlete max-h-[90vh] bg-background">
          <div className="mx-auto w-full max-w-md overflow-y-auto">
            <DrawerHeader className="text-center pb-2">
              <DrawerTitle className="text-lg">Daily Check-in</DrawerTitle>
              <DrawerDescription className="text-xs">
                Come ti senti oggi?
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="px-4 pb-4 space-y-6 overflow-y-auto">
              
              {/* ===== SECTION A: SLEEP (Hybrid Layout) ===== */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <Moon className="h-4 w-4 text-primary" />
                  SONNO
                </Label>
                <div className="flex flex-row items-center justify-between gap-4 p-3 rounded-xl bg-secondary/50">
                  {/* Left: Sleep Duration */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-foreground/60 uppercase tracking-wide">Ore</span>
                    <Input
                      type="number"
                      value={tempReadiness.sleepHours}
                      onChange={handleSleepHoursChange}
                      step={0.5}
                      min={0}
                      max={24}
                      className="w-16 h-12 text-center text-xl font-bold bg-card text-foreground border-0"
                    />
                  </div>
                  
                  {/* Right: Sleep Quality Slider */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-foreground/60 uppercase tracking-wide">Qualità</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{tempReadiness.sleepQuality}/10</span>
                    </div>
                    <Slider
                      value={[tempReadiness.sleepQuality]}
                      onValueChange={([value]) => setTempReadiness(prev => ({ ...prev, sleepQuality: value }))}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-foreground/60">
                      <span>Poor</span>
                      <span>Great</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== SECTION: BODY WEIGHT ===== */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <Scale className="h-4 w-4 text-primary" />
                  PESO CORPOREO
                </Label>
                <div className="flex flex-row items-center gap-4 p-3 rounded-xl bg-secondary/50">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[10px] text-foreground/60 uppercase tracking-wide">Peso odierno</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={tempReadiness.bodyWeight ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTempReadiness(prev => ({ 
                            ...prev, 
                            bodyWeight: value === "" ? null : parseFloat(value) 
                          }));
                        }}
                        step={0.1}
                        min={30}
                        max={300}
                        placeholder="—"
                        className="w-24 h-12 text-center text-xl font-bold bg-card text-foreground border-0"
                      />
                      <span className="text-sm font-medium text-foreground/60">kg</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-center max-w-[140px]">
                    <p>Pesati la mattina, a digiuno, per un dato più accurato</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <Activity className="h-4 w-4 text-primary" />
                  PARAMETRI PSICOFISICI
                </Label>
                
                <ParamSliderCard
                  label="Energia"
                  value={tempReadiness.energy}
                  onChange={(v) => setTempReadiness(prev => ({ ...prev, energy: v }))}
                  lowLabel="Low"
                  highLabel="High"
                  icon={Zap}
                />
                
                <ParamSliderCard
                  label="Stress"
                  value={tempReadiness.stress}
                  onChange={(v) => setTempReadiness(prev => ({ ...prev, stress: v }))}
                  lowLabel="Low"
                  highLabel="High"
                  inverted={true}
                  icon={Brain}
                />
                
                <ParamSliderCard
                  label="Umore"
                  value={tempReadiness.mood}
                  onChange={(v) => setTempReadiness(prev => ({ ...prev, mood: v }))}
                  lowLabel="Low"
                  highLabel="High"
                  icon={Smile}
                />
                
                <ParamSliderCard
                  label="Digestione"
                  value={tempReadiness.digestion}
                  onChange={(v) => setTempReadiness(prev => ({ ...prev, digestion: v }))}
                  lowLabel="Poor"
                  highLabel="Great"
                  icon={HeartPulse}
                />
              </div>

              {/* ===== SECTION C: DOMS & BODY MAP ===== */}
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
                
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {([0, 1, 2, 3] as SorenessLevel[]).map((level) => (
                    <div key={level} className="flex items-center gap-1.5">
                      <div className={cn("h-3 w-3 rounded-full", sorenessConfig[level].bg)} />
                      <span className="text-[10px] text-foreground/60">{sorenessConfig[level].label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Score */}
              <div className="flex items-center justify-center gap-4 py-4 rounded-xl bg-secondary/30">
                <ReadinessRing score={calculateScore(tempReadiness)} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-foreground/60 mb-1">
                    Score previsto
                  </p>
                  <p className={cn(
                    "text-2xl font-bold tabular-nums",
                    getScoreColor(calculateScore(tempReadiness))
                  )}>
                    {calculateScore(tempReadiness)}%
                  </p>
                  <p className={cn(
                    "text-xs font-medium",
                    getScoreColor(calculateScore(tempReadiness))
                  )}>
                    {getScoreLabel(calculateScore(tempReadiness))}
                  </p>
                </div>
              </div>
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
                <Button variant="ghost" className="w-full text-primary hover:text-primary/80 hover:bg-primary/10">
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
