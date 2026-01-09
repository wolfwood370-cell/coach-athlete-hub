import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  Activity
} from "lucide-react";

const stats = [
  { label: "Active Athletes", value: "24", change: "+3", icon: Users, trend: "up" },
  { label: "Workouts This Week", value: "156", change: "+12%", icon: Activity, trend: "up" },
  { label: "Avg. Compliance", value: "87%", change: "+5%", icon: TrendingUp, trend: "up" },
  { label: "Pending Reviews", value: "8", change: "", icon: Clock, trend: "neutral" },
];

const recentAthletes = [
  { name: "Sofia Rossi", status: "completed", workout: "Upper Body A", time: "2 ore fa", compliance: 95 },
  { name: "Marco Bianchi", status: "in-progress", workout: "Lower Body B", time: "In corso", compliance: 88 },
  { name: "Giulia Verdi", status: "missed", workout: "Cardio HIIT", time: "Ieri", compliance: 72 },
  { name: "Luca Ferrari", status: "completed", workout: "Full Body", time: "3 ore fa", compliance: 91 },
];

const alerts = [
  { type: "warning", message: "3 atleti sotto il 70% di compliance questa settimana", action: "Visualizza" },
  { type: "info", message: "Nuovi feedback da 5 atleti", action: "Leggi" },
];

export default function CoachDashboard() {
  return (
    <CoachLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Benvenuto, Marco. Ecco la panoramica di oggi.</p>
          </div>
          <Button className="gradient-primary text-white hover:opacity-90">
            + Nuovo Atleta
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="hover-lift">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold">{stat.value}</span>
                      {stat.change && (
                        <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-success' : 'text-muted-foreground'}`}>
                          {stat.change}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div 
                key={i}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  alert.type === 'warning' 
                    ? 'bg-warning/5 border-warning/20' 
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className={`h-5 w-5 ${alert.type === 'warning' ? 'text-warning' : 'text-primary'}`} />
                  <span className="text-sm">{alert.message}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  {alert.action}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Recent Athletes Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Attività Recente</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              Vedi tutti <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentAthletes.map((athlete, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {athlete.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{athlete.name}</p>
                      <p className="text-sm text-muted-foreground">{athlete.workout}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={
                        athlete.status === 'completed' ? 'default' : 
                        athlete.status === 'in-progress' ? 'secondary' : 'destructive'
                      }
                      className={
                        athlete.status === 'completed' ? 'bg-success/10 text-success border-0' : 
                        athlete.status === 'in-progress' ? 'bg-warning/10 text-warning border-0' : ''
                      }
                    >
                      {athlete.status === 'completed' ? 'Completato' : 
                       athlete.status === 'in-progress' ? 'In corso' : 'Mancato'}
                    </Badge>
                    <span className="text-sm text-muted-foreground w-20 text-right">{athlete.time}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
}
