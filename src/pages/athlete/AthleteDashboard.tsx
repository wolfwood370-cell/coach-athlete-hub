import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  ChevronRight,
  Flame,
  Footprints,
  UtensilsCrossed,
  Dumbbell,
  Sparkles,
  Clock,
  Zap,
  Frown,
  Meh,
  Smile,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAthleteReadiness, ReadinessData } from "@/hooks/useAthleteReadiness";
import { toast } from "sonner";

const SORENESS_OPTIONS = [
  { id: "legs", label: "Gambe" },
  { id: "back", label: "Schiena" },
  { id: "chest", label: "Petto" },
  { id: "shoulders", label: "Spalle" },
  { id: "arms", label: "Braccia" },
  { id: "core", label: "Core" },
];

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

export default function AthleteDashboard() {
  const navigate = useNavigate();
  const { readiness, loading, saving, calculateScore, saveReadiness, initialReadiness } = useAthleteReadiness();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tempReadiness, setTempReadiness] = useState<ReadinessData>(initialReadiness);

  // Sync tempReadiness when readiness changes
  useEffect(() => {
    if (readiness.isCompleted) {
      setTempReadiness(readiness);
    }
  }, [readiness]);

  const handleOpenDrawer = () => {
    setTempReadiness(readiness.isCompleted ? { ...readiness } : { ...initialReadiness });
    setDrawerOpen(true);
  };

  const handleSubmitReadiness = async () => {
    const success = await saveReadiness(tempReadiness);
    if (success) {
      toast.success("Check-in salvato!");
      setDrawerOpen(false);
    } else {
      toast.error("Errore nel salvataggio");
    }
  };

  const toggleSoreness = (location: string) => {
    setTempReadiness(prev => {
      const current = prev.sorenessLocations;
      const updated = current.includes(location)
        ? current.filter(l => l !== location)
        : [...current, location];
      return { ...prev, sorenessLocations: updated, hasPain: updated.length > 0 };
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return "stroke-success";
    if (score >= 50) return "stroke-warning";
    return "stroke-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Ottimo";
    if (score >= 50) return "Moderato";
    return "Basso";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-success/10";
    if (score >= 50) return "bg-warning/10";
    return "bg-destructive/10";
  };

  // SVG Ring progress component
  const ScoreRing = ({ score, size = 100 }: { score: number; size?: number }) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background ring */}
          <circle
            className="stroke-secondary"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress ring */}
          <circle
            className={cn("transition-all duration-700 ease-out", getScoreRingColor(score))}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold tabular-nums", getScoreColor(score))}>
            {score}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {getScoreLabel(score)}
          </span>
        </div>
      </div>
    );
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
            {loading ? (
              /* Loading state */
              <div className="p-5 text-center">
                <div className="animate-pulse space-y-3">
                  <div className="h-20 w-20 mx-auto rounded-full bg-secondary" />
                  <div className="h-4 w-32 mx-auto rounded bg-secondary" />
                  <div className="h-10 w-full rounded bg-secondary" />
                </div>
              </div>
            ) : !readiness.isCompleted ? (
              /* ===== NOT COMPLETED STATE ===== */
              <div className="p-5 text-center">
                <div className="relative mx-auto mb-4 h-20 w-20">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse-soft" />
                  <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-base mb-1">Daily Readiness</h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-[200px] mx-auto">
                  Compila il check giornaliero per ottimizzare il tuo piano
                </p>
                <Button 
                  onClick={handleOpenDrawer}
                  className="w-full h-12 text-sm font-semibold gradient-primary"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Start Check-in
                </Button>
              </div>
            ) : (
              /* ===== COMPLETED STATE ===== */
              <div className="p-4">
                <div className="flex items-center gap-4">
                  {/* Score Ring */}
                  <ScoreRing score={readiness.score} size={88} />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Daily Readiness</p>
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
                        <Brain className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                        <p className="text-xs font-medium tabular-nums">{readiness.stress}/10</p>
                      </div>
                      <div className={cn(
                        "text-center p-2 rounded-lg",
                        readiness.sorenessLocations.length > 0 ? "bg-warning/10" : "bg-secondary/50"
                      )}>
                        <AlertCircle className={cn(
                          "h-3.5 w-3.5 mx-auto mb-0.5",
                          readiness.sorenessLocations.length > 0 ? "text-warning" : "text-muted-foreground"
                        )} />
                        <p className="text-xs font-medium">{readiness.sorenessLocations.length}</p>
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
            <h2 className="text-sm font-semibold">Today's Focus</h2>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {todayTasks.length} tasks
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
        </div>
      </div>

      {/* ===== READINESS DRAWER ===== */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="athlete-theme max-h-[90vh]">
          <div className="mx-auto w-full max-w-sm overflow-y-auto">
            <DrawerHeader className="text-center pb-2">
              <DrawerTitle className="text-lg">Daily Check-in</DrawerTitle>
              <DrawerDescription className="text-xs">
                Valuta come ti senti oggi per ottimizzare il tuo allenamento
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="px-4 pb-4 space-y-5">
              {/* Sleep Hours */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Moon className="h-4 w-4 text-primary" />
                    Ore di sonno
                  </Label>
                  <span className="text-sm font-semibold tabular-nums bg-secondary px-2 py-0.5 rounded">
                    {tempReadiness.sleepHours}h
                  </span>
                </div>
                <Slider
                  value={[tempReadiness.sleepHours]}
                  onValueChange={([value]) => setTempReadiness(prev => ({ ...prev, sleepHours: value }))}
                  min={3}
                  max={12}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>3h</span>
                  <span>12h</span>
                </div>
              </div>

              {/* Sleep Quality - 3 Icons */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Qualità del sonno
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 1, label: "Scarsa", icon: Frown, color: "text-destructive" },
                    { value: 2, label: "Media", icon: Meh, color: "text-warning" },
                    { value: 3, label: "Buona", icon: Smile, color: "text-success" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTempReadiness(prev => ({ ...prev, sleepQuality: option.value }))}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                        tempReadiness.sleepQuality === option.value
                          ? "border-primary bg-primary/10"
                          : "border-transparent bg-secondary/50 hover:bg-secondary"
                      )}
                    >
                      <option.icon className={cn(
                        "h-7 w-7",
                        tempReadiness.sleepQuality === option.value ? option.color : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-xs font-medium",
                        tempReadiness.sleepQuality === option.value ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Brain className="h-4 w-4 text-primary" />
                    Livello di stress
                  </Label>
                  <span className={cn(
                    "text-sm font-semibold tabular-nums px-2 py-0.5 rounded",
                    tempReadiness.stress <= 3 ? "bg-success/20 text-success" :
                    tempReadiness.stress <= 6 ? "bg-warning/20 text-warning" :
                    "bg-destructive/20 text-destructive"
                  )}>
                    {tempReadiness.stress}/10
                  </span>
                </div>
                <Slider
                  value={[tempReadiness.stress]}
                  onValueChange={([value]) => setTempReadiness(prev => ({ ...prev, stress: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>😌 Rilassato</span>
                  <span>😰 Molto stressato</span>
                </div>
              </div>

              {/* Soreness Chips */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Zone con dolori o fastidi
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SORENESS_OPTIONS.map((option) => {
                    const isSelected = tempReadiness.sorenessLocations.includes(option.id);
                    return (
                      <Badge
                        key={option.id}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer px-3 py-1.5 text-xs font-medium transition-all",
                          isSelected 
                            ? "bg-warning text-warning-foreground hover:bg-warning/90" 
                            : "hover:bg-secondary"
                        )}
                        onClick={() => toggleSoreness(option.id)}
                      >
                        {option.label}
                      </Badge>
                    );
                  })}
                </div>
                {tempReadiness.sorenessLocations.length === 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    Tocca per selezionare le zone con fastidi (o lascia vuoto se stai bene)
                  </p>
                )}
              </div>

              {/* Preview Score */}
              <div className={cn(
                "text-center py-4 rounded-xl transition-colors",
                getScoreBgColor(calculateScore(tempReadiness))
              )}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Il tuo punteggio
                </p>
                <p className={cn(
                  "text-4xl font-bold tabular-nums",
                  getScoreColor(calculateScore(tempReadiness))
                )}>
                  {calculateScore(tempReadiness)}
                </p>
                <p className={cn(
                  "text-sm font-medium mt-1",
                  getScoreColor(calculateScore(tempReadiness))
                )}>
                  {getScoreLabel(calculateScore(tempReadiness))}
                </p>
              </div>
            </div>

            <DrawerFooter className="pt-2">
              <Button 
                onClick={handleSubmitReadiness}
                disabled={saving}
                className="w-full h-12 font-semibold gradient-primary"
              >
                {saving ? "Salvataggio..." : "Conferma Check-in"}
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" className="w-full">
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
