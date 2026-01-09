import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCoachDashboardData, AthleteIssue } from "@/hooks/useCoachData";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Dumbbell,
  Camera,
  MessageSquare,
  Scale,
  HeartPulse,
  Clock,
  Minus,
  Send,
  CheckCircle2,
  UserPlus,
  User,
  Mail,
  Activity,
  Frown
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

const getIssueConfig = (issue: AthleteIssue) => {
  switch (issue.type) {
    case "no_checkin":
      return { icon: Clock, colorClass: "bg-muted text-muted-foreground" };
    case "low_readiness":
      return { icon: HeartPulse, colorClass: "bg-destructive/10 text-destructive" };
    case "pain_reported":
      return { icon: Frown, colorClass: "bg-destructive/10 text-destructive" };
    case "high_stress":
      return { icon: AlertTriangle, colorClass: "bg-warning/10 text-warning" };
    default:
      return { icon: AlertTriangle, colorClass: "bg-muted text-muted-foreground" };
  }
};

const getActivityIcon = (iconName: string) => {
  switch (iconName) {
    case "Dumbbell": return Dumbbell;
    case "HeartPulse": return HeartPulse;
    case "Camera": return Camera;
    case "Scale": return Scale;
    case "MessageSquare": return MessageSquare;
    default: return Dumbbell;
  }
};

export default function CoachDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { 
    athletes, 
    problematicAthletes, 
    businessMetrics,
    activityFeed,
    isLoading 
  } = useCoachDashboardData();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Generate sparkline mock data (in real app, this would come from historical data)
  const generateSparkline = (base: number, variance: number) => {
    return Array.from({ length: 12 }, () => 
      Math.max(0, base + (Math.random() - 0.5) * variance * 2)
    );
  };

  // Count critical and warning issues
  const criticalCount = problematicAthletes.filter(a => 
    a.issues.some(i => i.severity === "critical")
  ).length;
  const warningCount = problematicAthletes.filter(a => 
    a.issues.some(i => i.severity === "warning") && !a.issues.some(i => i.severity === "critical")
  ).length;

  const businessMetricsData: Array<{
    label: string;
    value: number | string;
    suffix: string;
    sparklineData: number[];
    color: "primary" | "success" | "warning";
    icon: typeof Users;
  }> = [
    { 
      label: "Clienti Attivi", 
      value: businessMetrics.activeClients, 
      suffix: "",
      sparklineData: generateSparkline(businessMetrics.activeClients, 2),
      color: "primary",
      icon: Users 
    },
    { 
      label: "Compliance Oggi", 
      value: businessMetrics.complianceRate, 
      suffix: "%",
      sparklineData: generateSparkline(businessMetrics.complianceRate, 15),
      color: "success",
      icon: TrendingUp 
    },
    { 
      label: "Readiness Media", 
      value: businessMetrics.avgReadiness ?? "N/A", 
      suffix: businessMetrics.avgReadiness !== null ? "/100" : "",
      sparklineData: generateSparkline(businessMetrics.avgReadiness ?? 70, 10),
      color: businessMetrics.avgReadiness !== null && businessMetrics.avgReadiness >= 60 ? "success" : "warning",
      icon: Activity 
    },
  ];

  if (authLoading) {
    return (
      <CoachLayout title="Dashboard" subtitle="Caricamento...">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </CoachLayout>
    );
  }

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
                    <CardTitle className="text-sm font-semibold">Richiede Attenzione</CardTitle>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {criticalCount} critici · {warningCount} attenzione
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : problematicAthletes.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success/10 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Tutto OK!</h3>
                  <p className="text-sm text-muted-foreground">
                    {athletes.length === 0 
                      ? "Nessun atleta collegato. Invita i tuoi atleti!" 
                      : "Tutti i tuoi atleti stanno bene. Ottimo lavoro!"}
                  </p>
                  {athletes.length === 0 && (
                    <Button variant="outline" size="sm" className="mt-4">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invita Atleta
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {problematicAthletes.map((athlete) => {
                    const hasCritical = athlete.issues.some(i => i.severity === "critical");
                    
                    return (
                      <div 
                        key={athlete.id}
                        className="flex items-center gap-4 px-4 lg:px-5 py-4 hover:bg-muted/30 transition-colors"
                      >
                        {/* Avatar & Name */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className={cn(
                            "h-10 w-10 border-2",
                            hasCritical ? "border-destructive/50" : "border-warning/50"
                          )}>
                            <AvatarImage src={athlete.avatarUrl || undefined} />
                            <AvatarFallback className={cn(
                              "text-xs font-semibold",
                              hasCritical 
                                ? "bg-destructive/10 text-destructive" 
                                : "bg-warning/10 text-warning"
                            )}>
                              {athlete.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{athlete.name}</p>
                            {athlete.readinessScore !== null && (
                              <p className="text-xs text-muted-foreground">
                                Readiness: {athlete.readinessScore}/100
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Issue Badges */}
                        <div className="flex flex-wrap gap-1.5 justify-center flex-1">
                          {athlete.issues.map((issue, idx) => {
                            const config = getIssueConfig(issue);
                            const IconComponent = config.icon;
                            return (
                              <Badge 
                                key={idx}
                                variant="secondary"
                                className={cn(
                                  "text-[10px] font-medium px-2 py-0.5 gap-1 border-0 whitespace-nowrap",
                                  config.colorClass
                                )}
                                title={issue.details}
                              >
                                <IconComponent className="h-3 w-3" />
                                {issue.label}
                              </Badge>
                            );
                          })}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8"
                            title="Invia messaggio"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8"
                            title="Vedi profilo"
                          >
                            <User className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== BUSINESS HEALTH with Sparklines ===== */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {businessMetricsData.map((metric) => {
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
                        color={metric.color} 
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
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <CardTitle className="text-sm font-semibold">Attività Live</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[280px]">
                <div className="px-4 pb-4 space-y-0.5">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-3 py-2.5 px-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 mb-1" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))
                  ) : activityFeed.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      Nessuna attività recente
                    </div>
                  ) : (
                    activityFeed.map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.icon);
                      return (
                        <div 
                          key={activity.id}
                          className="flex items-start gap-3 py-2.5 px-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer -mx-2"
                        >
                          <div className={cn(
                            "flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-0.5",
                            activity.type === 'success' ? "bg-success/10" : "bg-muted"
                          )}>
                            <ActivityIcon className={cn(
                              "h-3.5 w-3.5",
                              activity.type === 'success' ? "text-success" : "text-muted-foreground"
                            )} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-tight">
                              <span className="font-medium">{activity.athlete}</span>
                              <span className="text-muted-foreground"> {activity.action} </span>
                              <span className="font-medium text-primary">{activity.highlight}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </div>
      </div>
    </CoachLayout>
  );
}
