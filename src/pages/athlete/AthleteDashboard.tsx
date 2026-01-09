import { useState } from "react";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
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
  TrendingDown,
  Minus
} from "lucide-react";

// Mock state - in real app this would come from API/state
const mockReadinessData = {
  isCompleted: true,
  score: 78,
  indicators: {
    sleep: { value: 7.5, label: "Sonno", status: "good" },
    stress: { value: 4, label: "Stress", status: "medium" },
    pain: { value: 2, label: "Dolori", status: "good" },
  }
};

const todayTasks = [
  { 
    id: "workout",
    label: "Allenamento: Upper Body Power",
    icon: Dumbbell,
    completed: false,
    accent: "primary"
  },
  { 
    id: "steps",
    label: "Obiettivo Passi",
    sublabel: "3,240 / 10,000",
    icon: Footprints,
    completed: false,
    progress: 32,
    accent: "warning"
  },
  { 
    id: "nutrition",
    label: "Log Nutrizione",
    sublabel: "1,200 / 2,400 kcal",
    icon: UtensilsCrossed,
    completed: false,
    progress: 50,
    accent: "success"
  },
];

const energyBalance = {
  intake: 1200,
  target: 2400,
  status: "deficit" as "deficit" | "maintenance" | "surplus"
};

export default function AthleteDashboard() {
  const [tasks, setTasks] = useState(todayTasks);
  const [readiness] = useState(mockReadinessData);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 70) return "stroke-success";
    if (score >= 40) return "stroke-warning";
    return "stroke-destructive";
  };

  const getIndicatorColor = (status: string) => {
    if (status === "good") return "bg-success";
    if (status === "medium") return "bg-warning";
    return "bg-destructive";
  };

  const getBalanceStatus = () => {
    const diff = energyBalance.target - energyBalance.intake;
    if (diff > 200) return { label: "Sei in Deficit", icon: TrendingDown, color: "text-warning" };
    if (diff < -200) return { label: "Sei in Surplus", icon: Flame, color: "text-destructive" };
    return { label: "Mantenimento", icon: Minus, color: "text-success" };
  };

  const balanceStatus = getBalanceStatus();
  const intakePercent = Math.min((energyBalance.intake / energyBalance.target) * 100, 100);

  return (
    <AthleteLayout>
      <div className="space-y-5 p-5 animate-fade-in">
        {/* Header */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Buongiorno, Sofia 👋</p>
            <h1 className="text-xl font-bold">Come stai oggi?</h1>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">SN</span>
          </div>
        </div>

        {/* Readiness Card (Bio-Gate) */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-card to-secondary/50">
          <CardContent className="p-5">
            {!readiness.isCompleted ? (
              /* Not completed state */
              <div className="text-center py-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Daily Check</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Compila il check giornaliero per sbloccare il tuo piano
                </p>
                <Button className="w-full gradient-primary text-white h-12 font-semibold">
                  Start Daily Check
                </Button>
              </div>
            ) : (
              /* Completed state */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Readiness Score</p>
                    <p className="text-sm text-muted-foreground mt-1">Pronto per allenarti</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary text-xs h-7">
                    Dettagli <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-6">
                  {/* Circular Score */}
                  <div className="relative flex-shrink-0">
                    <svg className="h-24 w-24 -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        strokeWidth="8"
                        fill="none"
                        className="stroke-secondary"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(readiness.score / 100) * 251.2} 251.2`}
                        className={`${getScoreRingColor(readiness.score)} transition-all duration-500`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${getScoreColor(readiness.score)}`}>
                        {readiness.score}
                      </span>
                    </div>
                  </div>

                  {/* Indicators */}
                  <div className="flex-1 space-y-3">
                    {Object.entries(readiness.indicators).map(([key, indicator]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${getIndicatorColor(indicator.status)}`} />
                        <div className="flex items-center gap-2 flex-1">
                          {key === 'sleep' && <Moon className="h-4 w-4 text-muted-foreground" />}
                          {key === 'stress' && <Brain className="h-4 w-4 text-muted-foreground" />}
                          {key === 'pain' && <HeartPulse className="h-4 w-4 text-muted-foreground" />}
                          <span className="text-sm">{indicator.label}</span>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {key === 'sleep' ? `${indicator.value}h` : `${indicator.value}/10`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Focus */}
        <div>
          <h2 className="font-semibold text-base mb-3">Today's Focus</h2>
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <Card 
                key={task.id}
                className={`overflow-hidden transition-all duration-200 ${
                  task.completed ? 'bg-success/5 border-success/20' : 'hover:bg-muted/30'
                }`}
              >
                <CardContent className="p-4">
                  <div 
                    className="flex items-start gap-4 cursor-pointer"
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className="pt-0.5">
                      <Checkbox 
                        checked={task.completed}
                        className={`h-6 w-6 rounded-full border-2 ${
                          task.completed 
                            ? 'border-success bg-success data-[state=checked]:bg-success' 
                            : 'border-muted-foreground/30'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <task.icon className={`h-4 w-4 flex-shrink-0 ${
                          task.completed ? 'text-success' : 'text-primary'
                        }`} />
                        <span className={`font-medium text-sm ${
                          task.completed ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {task.label}
                        </span>
                      </div>
                      {task.sublabel && (
                        <p className={`text-xs mt-1 ${
                          task.completed ? 'text-success' : 'text-muted-foreground'
                        }`}>
                          {task.sublabel}
                        </p>
                      )}
                      {task.progress !== undefined && !task.completed && (
                        <Progress 
                          value={task.progress} 
                          className="h-1.5 mt-2"
                        />
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Energy Balance Widget */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Energy Balance</span>
              </div>
              <div className={`flex items-center gap-1 ${balanceStatus.color}`}>
                <balanceStatus.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{balanceStatus.label}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Intake: {energyBalance.intake} kcal</span>
                <span>Target: {energyBalance.target} kcal</span>
              </div>
              
              <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${intakePercent}%` }}
                />
                {/* Target marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
                  style={{ left: '100%', transform: 'translateX(-1px)' }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {energyBalance.target - energyBalance.intake} kcal rimanenti
                </span>
                <span className="text-xs font-medium text-primary">
                  {Math.round(intakePercent)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </AthleteLayout>
  );
}
