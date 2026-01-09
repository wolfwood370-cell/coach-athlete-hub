import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Activity,
  Dumbbell,
  Camera,
  MessageSquare,
  Scale,
  HeartPulse,
  Clock,
  Minus,
  ChevronRight,
  Send,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sparkline Component
function Sparkline({ data, color = "primary", className }: { 
  data: number[]; 
  color?: "primary" | "success" | "warning" | "destructive";
  className?: string;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const colorClasses = {
    primary: "stroke-primary",
    success: "stroke-success",
    warning: "stroke-warning",
    destructive: "stroke-destructive"
  };

  return (
    <svg 
      viewBox="0 0 100 40" 
      className={cn("w-full h-8", className)}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colorClasses[color]}
        points={points}
      />
    </svg>
  );
}

// Mock Data - Needs Attention Athletes
const needsAttentionAthletes = [
  { 
    id: 1,
    name: "Marco Rossi", 
    avatar: "MR",
    issue: "Check-in Missed",
    issueType: "critical" as const,
    lastCheckin: "4 giorni fa",
    details: "Nessun check-in da 4 giorni",
  },
  { 
    id: 2,
    name: "Elena Bianchi", 
    avatar: "EB",
    issue: "Low Readiness",
    issueType: "critical" as const,
    lastCheckin: "Oggi",
    details: "Score 28/100 - stress elevato",
  },
  { 
    id: 3,
    name: "Giulia Verdi", 
    avatar: "GV",
    issue: "Low Readiness",
    issueType: "critical" as const,
    lastCheckin: "Ieri",
    details: "Score 35/100 - dolore spalla",
  },
  { 
    id: 4,
    name: "Luca Ferrari", 
    avatar: "LF",
    issue: "Weight Stall",
    issueType: "warning" as const,
    lastCheckin: "Oggi",
    details: "Peso invariato da 3 settimane",
  },
  { 
    id: 5,
    name: "Sara Conti", 
    avatar: "SC",
    issue: "Weight Stall",
    issueType: "warning" as const,
    lastCheckin: "2 giorni fa",
    details: "-0.1kg in 4 settimane",
  },
];

// Mock Data - Business Health with Sparklines
const businessMetrics = [
  { 
    label: "Active Clients", 
    value: 24, 
    suffix: "",
    change: "+2",
    trend: "up" as const,
    sparklineData: [18, 19, 19, 20, 21, 20, 22, 21, 23, 22, 24, 24],
    color: "primary" as const,
    icon: Users 
  },
  { 
    label: "Compliance Rate", 
    value: 87, 
    suffix: "%",
    change: "+5%",
    trend: "up" as const,
    sparklineData: [72, 75, 78, 76, 80, 82, 79, 83, 85, 84, 86, 87],
    color: "success" as const,
    icon: TrendingUp 
  },
  { 
    label: "Churn Risk", 
    value: 3, 
    suffix: "",
    change: "-1",
    trend: "down" as const,
    sparklineData: [6, 5, 5, 4, 5, 4, 4, 3, 4, 3, 3, 3],
    color: "warning" as const,
    icon: AlertTriangle 
  },
];

// Mock Data - Activity Feed
const activityFeed = [
  { 
    id: 1,
    athlete: "Sofia Neri",
    action: "ha completato WOD A",
    highlight: "(PR su Squat 120kg)",
    time: "5 min",
    icon: Dumbbell,
    type: "success"
  },
  { 
    id: 2,
    athlete: "Andrea Russo",
    action: "check-in inviato",
    highlight: "Readiness 85/100",
    time: "12 min",
    icon: HeartPulse,
    type: "default"
  },
  { 
    id: 3,
    athlete: "Giulia Verdi",
    action: "ha caricato",
    highlight: "3 foto progresso",
    time: "23 min",
    icon: Camera,
    type: "default"
  },
  { 
    id: 4,
    athlete: "Paolo Marino",
    action: "ha completato",
    highlight: "Lower Body B",
    time: "45 min",
    icon: Dumbbell,
    type: "default"
  },
  { 
    id: 5,
    athlete: "Laura Gallo",
    action: "peso registrato",
    highlight: "62.3 kg (-0.4)",
    time: "1h",
    icon: Scale,
    type: "default"
  },
  { 
    id: 6,
    athlete: "Chiara Costa",
    action: "ti ha scritto",
    highlight: "",
    time: "2h",
    icon: MessageSquare,
    type: "message"
  },
  { 
    id: 7,
    athlete: "Davide Greco",
    action: "ha completato",
    highlight: "Cardio HIIT",
    time: "3h",
    icon: Dumbbell,
    type: "default"
  },
];

const getIssueConfig = (issue: string) => {
  switch (issue) {
    case "Check-in Missed":
      return { icon: Clock, color: "destructive" as const };
    case "Low Readiness":
      return { icon: HeartPulse, color: "destructive" as const };
    case "Weight Stall":
      return { icon: Minus, color: "warning" as const };
    default:
      return { icon: AlertTriangle, color: "warning" as const };
  }
};

export default function CoachDashboard() {
  return (
    <CoachLayout title="Dashboard" subtitle="Panoramica e triage atleti">
      <div className="space-y-6 animate-fade-in">
        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-4 lg:gap-5">
          
          {/* ===== NEEDS ATTENTION - Full Width Priority ===== */}
          <Card className="col-span-12 border-0 shadow-sm bg-card">
            <CardHeader className="pb-2 pt-4 px-4 lg:px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Needs Attention</CardTitle>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {needsAttentionAthletes.filter(a => a.issueType === 'critical').length} critical · {needsAttentionAthletes.filter(a => a.issueType === 'warning').length} warning
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 lg:px-5 py-2">Atleta</th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2 hidden sm:table-cell">Ultimo Check-in</th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2">Stato</th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2 hidden md:table-cell">Dettagli</th>
                      <th className="text-right text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 lg:px-5 py-2">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {needsAttentionAthletes.map((athlete) => {
                      const config = getIssueConfig(athlete.issue);
                      const IconComponent = config.icon;
                      const isCritical = athlete.issueType === 'critical';
                      
                      return (
                        <tr 
                          key={athlete.id}
                          className="group border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          {/* Athlete */}
                          <td className="px-4 lg:px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-shrink-0">
                                <div className={cn(
                                  "h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold",
                                  isCritical ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                                )}>
                                  {athlete.avatar}
                                </div>
                              </div>
                              <span className="font-medium text-sm">{athlete.name}</span>
                            </div>
                          </td>
                          
                          {/* Last Check-in */}
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-sm text-muted-foreground tabular-nums">{athlete.lastCheckin}</span>
                          </td>
                          
                          {/* Status Badge */}
                          <td className="px-4 py-3">
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 gap-1 border-0",
                                isCritical 
                                  ? "bg-destructive/10 text-destructive" 
                                  : "bg-warning/10 text-warning"
                              )}
                            >
                              <IconComponent className="h-3 w-3" />
                              {athlete.issue}
                            </Badge>
                          </td>
                          
                          {/* Details */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm text-muted-foreground">{athlete.details}</span>
                          </td>
                          
                          {/* Actions */}
                          <td className="px-4 lg:px-5 py-3">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Message
                              </Button>
                              <Button 
                                size="sm" 
                                className={cn(
                                  "h-7 px-2 text-xs",
                                  isCritical
                                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    : "bg-warning hover:bg-warning/90 text-warning-foreground"
                                )}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                            </div>
                            {/* Mobile: always show */}
                            <div className="flex items-center justify-end gap-1.5 group-hover:hidden md:hidden">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7 px-2 text-xs"
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ===== BUSINESS HEALTH with Sparklines ===== */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {businessMetrics.map((metric) => {
              const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;
              const isPositive = (metric.trend === 'up' && metric.label !== 'Churn Risk') || 
                                 (metric.trend === 'down' && metric.label === 'Churn Risk');
              
              return (
                <Card key={metric.label} className="border-0 shadow-sm hover-lift">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          {metric.label}
                        </p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-bold tabular-nums">
                            {metric.value}
                          </span>
                          <span className="text-sm text-muted-foreground">{metric.suffix}</span>
                          <span className={cn(
                            "text-xs font-medium flex items-center gap-0.5 ml-1",
                            isPositive ? "text-success" : "text-destructive"
                          )}>
                            <TrendIcon className="h-3 w-3" />
                            {metric.change}
                          </span>
                        </div>
                      </div>
                      <div className={cn(
                        "p-2 rounded-lg",
                        metric.color === 'primary' && "bg-primary/10",
                        metric.color === 'success' && "bg-success/10",
                        metric.color === 'warning' && "bg-warning/10"
                      )}>
                        <metric.icon className={cn(
                          "h-4 w-4",
                          metric.color === 'primary' && "text-primary",
                          metric.color === 'success' && "text-success",
                          metric.color === 'warning' && "text-warning"
                        )} />
                      </div>
                    </div>
                    
                    {/* Sparkline */}
                    <div className="mt-2">
                      <Sparkline 
                        data={metric.sparklineData} 
                        color={isPositive ? "success" : "warning"} 
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Ultimi 30 giorni</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ===== LIVE ACTIVITY FEED ===== */}
          <Card className="col-span-12 lg:col-span-4 border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
                  <CardTitle className="text-sm font-semibold">Live Activity</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[280px]">
                <div className="px-4 pb-4 space-y-0.5">
                  {activityFeed.map((activity) => (
                    <div 
                      key={activity.id}
                      className="flex items-start gap-3 py-2.5 px-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer -mx-2"
                    >
                      <div className={cn(
                        "flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-0.5",
                        activity.type === 'success' ? "bg-success/10" : 
                        activity.type === 'message' ? "bg-primary/10" : "bg-secondary"
                      )}>
                        <activity.icon className={cn(
                          "h-3.5 w-3.5",
                          activity.type === 'success' ? "text-success" : 
                          activity.type === 'message' ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">
                          <span className="font-medium">{activity.athlete}</span>
                          {" "}
                          <span className="text-muted-foreground">{activity.action}</span>
                          {activity.highlight && (
                            <>
                              {" "}
                              <span className={cn(
                                "font-medium",
                                activity.type === 'success' && "text-success"
                              )}>
                                {activity.highlight}
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </div>
      </div>
    </CoachLayout>
  );
}
