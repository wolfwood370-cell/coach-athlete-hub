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

// Ring Chart Component
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
  
  const {
    readiness,
    tempReadiness,
    setTempReadiness,
    isLoading,
    isSaving,
    calculateScore,
    saveReadiness,
  } = useReadiness();

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

        {/* ===== READINESS CARD (Bio-Gate) ===== */}
        <Card className="border-0 overflow-hidden">
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
              /* ===== COMPLETED STATE with Ring Chart ===== */
              <div className="p-4">
                <div className="flex items-center gap-4">
                  {/* Ring Chart */}
                  <div className="flex-shrink-0">
                    <ReadinessRing score={readiness.score} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Prontezza</p>
                        <p className={cn("text-sm font-semibold", getScoreColor(readiness.score))}>
                          {getScoreLabel(readiness.score)}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs text-muted-foreground"
                        onClick={handleOpenDrawer}
                      >
                        Modifica
                      </Button>
                    </div>

                    {/* Indicators */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-secondary/50">
                        <Moon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                        <p className="text-xs font-medium tabular-nums">{readiness.sleepHours}h</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-secondary/50">
                        <Activity className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                        <p className="text-xs font-medium tabular-nums">{readiness.energy}/10</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-secondary/50">
                        <Brain className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                        <p className="text-xs font-medium tabular-nums">{readiness.stress}/10</p>
                      </div>
                    </div>
                  </div>
                </div>
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
