import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Battery
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadinessData {
  isCompleted: boolean;
  score: number;
  sleepHours: number;
  sleepQuality: number;
  stress: number;
  hasPain: boolean;
}

const initialReadiness: ReadinessData = {
  isCompleted: false,
  score: 0,
  sleepHours: 7,
  sleepQuality: 7,
  stress: 5,
  hasPain: false,
};

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
  const [readiness, setReadiness] = useState<ReadinessData>(initialReadiness);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tempReadiness, setTempReadiness] = useState<ReadinessData>(initialReadiness);

  const calculateScore = useCallback((data: ReadinessData): number => {
    // Sleep hours score (0-35 points) - optimal is 7-9 hours
    let sleepHoursScore = 0;
    if (data.sleepHours >= 7 && data.sleepHours <= 9) {
      sleepHoursScore = 35;
    } else if (data.sleepHours >= 6) {
      sleepHoursScore = 25;
    } else if (data.sleepHours >= 5) {
      sleepHoursScore = 15;
    } else {
      sleepHoursScore = 5;
    }
    
    // Sleep quality score (0-25 points)
    const sleepQualityScore = (data.sleepQuality / 10) * 25;
    
    // Stress score (0-25 points) - lower is better
    const stressScore = ((10 - data.stress) / 10) * 25;
    
    // Pain score (0-15 points)
    const painScore = data.hasPain ? 0 : 15;
    
    return Math.round(sleepHoursScore + sleepQualityScore + stressScore + painScore);
  }, []);

  const handleOpenDrawer = () => {
    setTempReadiness({ ...readiness });
    setDrawerOpen(true);
  };

  const handleSubmitReadiness = () => {
    const score = calculateScore(tempReadiness);
    setReadiness({
      ...tempReadiness,
      isCompleted: true,
      score,
    });
    setDrawerOpen(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-success to-success/60";
    if (score >= 50) return "from-warning to-warning/60";
    return "from-destructive to-destructive/60";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Ottimo";
    if (score >= 50) return "Moderato";
    return "Basso";
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
                <h3 className="font-semibold text-base mb-1">Daily Readiness</h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-[200px] mx-auto">
                  Compila il check giornaliero per ottimizzare il tuo piano
                </p>
                <Button 
                  onClick={handleOpenDrawer}
                  className="w-full h-12 text-sm font-semibold gradient-primary"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Start Day
                </Button>
              </div>
            ) : (
              /* ===== COMPLETED STATE ===== */
              <div className="p-4">
                <div className="flex items-center gap-4">
                  {/* Battery Score */}
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "h-20 w-20 rounded-2xl bg-gradient-to-br flex items-center justify-center",
                      getScoreGradient(readiness.score)
                    )}>
                      <div className="text-center">
                        <Battery className="h-4 w-4 mx-auto mb-0.5 text-white/80" />
                        <span className="text-2xl font-bold text-white tabular-nums">
                          {readiness.score}
                        </span>
                        <span className="text-[10px] text-white/80 block -mt-0.5">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Readiness</p>
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
                      <div className="text-center p-2 rounded-lg bg-secondary/50">
                        <HeartPulse className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                        <p className="text-xs font-medium">{readiness.hasPain ? "Sì" : "No"}</p>
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
        <DrawerContent className="athlete-theme">
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader className="text-center">
              <DrawerTitle className="text-lg">Daily Check-in</DrawerTitle>
              <DrawerDescription className="text-xs">
                Rispondi a queste domande per calcolare la tua readiness
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="px-4 pb-4 space-y-6">
              {/* Sleep Hours */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <Moon className="h-4 w-4 text-primary" />
                    Ore di sonno
                  </Label>
                  <span className="text-sm font-semibold tabular-nums">
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

              {/* Sleep Quality */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Qualità del sonno
                  </Label>
                  <span className="text-sm font-semibold tabular-nums">
                    {tempReadiness.sleepQuality}/10
                  </span>
                </div>
                <Slider
                  value={[tempReadiness.sleepQuality]}
                  onValueChange={([value]) => setTempReadiness(prev => ({ ...prev, sleepQuality: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Pessima</span>
                  <span>Ottima</span>
                </div>
              </div>

              {/* Stress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <Brain className="h-4 w-4 text-primary" />
                    Livello di stress
                  </Label>
                  <span className="text-sm font-semibold tabular-nums">
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
                  <span>Rilassato</span>
                  <span>Molto stressato</span>
                </div>
              </div>

              {/* Pain Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <Label className="flex items-center gap-2 text-sm cursor-pointer">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  Hai dolori o fastidi fisici?
                </Label>
                <Switch
                  checked={tempReadiness.hasPain}
                  onCheckedChange={(checked) => setTempReadiness(prev => ({ ...prev, hasPain: checked }))}
                />
              </div>

              {/* Preview Score */}
              <div className="text-center py-3 rounded-lg bg-secondary/30">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Score previsto
                </p>
                <p className={cn(
                  "text-3xl font-bold tabular-nums",
                  getScoreColor(calculateScore(tempReadiness))
                )}>
                  {calculateScore(tempReadiness)}%
                </p>
              </div>
            </div>

            <DrawerFooter className="pt-2">
              <Button 
                onClick={handleSubmitReadiness}
                className="w-full h-12 font-semibold gradient-primary"
              >
                Conferma Check-in
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
