import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Flame, 
  Target, 
  ChevronRight,
  Zap,
  Clock,
  Dumbbell
} from "lucide-react";

const todayWorkout = {
  name: "Upper Body Power",
  duration: "45 min",
  exercises: 8,
  difficulty: "Intenso",
};

const weekProgress = {
  completed: 4,
  total: 6,
  streak: 12,
};

const upcomingWorkouts = [
  { day: "Dom", name: "Lower Body", time: "10:00" },
  { day: "Lun", name: "Cardio HIIT", time: "07:30" },
  { day: "Mar", name: "Full Body", time: "18:00" },
];

export default function AthleteDashboard() {
  const progressPercent = (weekProgress.completed / weekProgress.total) * 100;

  return (
    <AthleteLayout>
      <div className="space-y-6 p-5 animate-fade-in">
        {/* Header */}
        <div className="pt-2">
          <p className="text-muted-foreground">Ciao, Sofia 👋</p>
          <h1 className="text-2xl font-bold">Pronta ad allenarti?</h1>
        </div>

        {/* Today's Workout Card */}
        <Card className="overflow-hidden border-0 gradient-primary">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/70 text-sm">Workout di oggi</p>
                <h2 className="text-xl font-bold text-white mt-1">{todayWorkout.name}</h2>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20">
                <Zap className="h-3.5 w-3.5 text-white" />
                <span className="text-xs font-medium text-white">{todayWorkout.difficulty}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center gap-1.5 text-white/80">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{todayWorkout.duration}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/80">
                <Dumbbell className="h-4 w-4" />
                <span className="text-sm">{todayWorkout.exercises} esercizi</span>
              </div>
            </div>

            <Button 
              className="w-full bg-white text-primary hover:bg-white/90 font-semibold h-12"
            >
              <Play className="h-5 w-5 mr-2 fill-primary" />
              Inizia Workout
            </Button>
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Progresso Settimanale</h3>
              <div className="flex items-center gap-1.5 text-warning">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">{weekProgress.streak} giorni</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {weekProgress.completed}/{weekProgress.total} workout completati
                </span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Week Days */}
            <div className="flex items-center justify-between mt-5 gap-2">
              {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => (
                <div 
                  key={i}
                  className={`flex-1 aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all
                    ${i < weekProgress.completed 
                      ? 'gradient-success text-white' 
                      : i === weekProgress.completed 
                        ? 'border-2 border-primary text-primary' 
                        : 'bg-secondary text-muted-foreground'
                    }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Workouts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Prossimi Workout</h3>
            <Button variant="ghost" size="sm" className="text-primary h-auto p-0">
              Vedi piano <ChevronRight className="h-4 w-4 ml-0.5" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {upcomingWorkouts.map((workout, i) => (
              <Card key={i} className="hover-lift">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{workout.name}</p>
                      <p className="text-sm text-muted-foreground">{workout.day} • {workout.time}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AthleteLayout>
  );
}
