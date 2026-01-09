import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoachDashboardData } from "@/hooks/useCoachData";
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
  ChevronRight,
  Send,
  CheckCircle2,
  UserPlus
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

const getIssueConfig = (issue: string) => {
  switch (issue) {
    case "Check-in Missed":
      return { icon: Clock, color: "destructive" as const };
    case "Low Readiness":
      return { icon: HeartPulse, color: "destructive" as const };
    case "High Stress":
      return { icon: AlertTriangle, color: "warning" as const };
    case "Weight Stall":
      return { icon: Minus, color: "warning" as const };
    default:
      return { icon: AlertTriangle, color: "warning" as const };
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
    needsAttentionAthletes, 
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

  const businessMetricsWithSparklines: Array<{
    label: string;
    value: number;
    suffix: string;
    change: string;
    trend: "up" | "down" | "neutral";
    sparklineData: number[];
    color: "primary" | "success" | "warning";
    icon: typeof Users;
  }> = [
    { 
      label: "Active Clients", 
      value: businessMetrics.activeClients, 
      suffix: "",
      change: "+0",
      trend: "up",
      sparklineData: generateSparkline(businessMetrics.activeClients, 2),
      color: "primary",
      icon: Users 
    },
    { 
      label: "Compliance Rate", 
      value: businessMetrics.complianceRate, 
      suffix: "%",
      change: "+0%",
      trend: "up",
      sparklineData: generateSparkline(businessMetrics.complianceRate, 10),
      color: "success",
      icon: TrendingUp 
    },
    { 
      label: "Churn Risk", 
      value: businessMetrics.churnRisk, 
      suffix: "",
      change: "0",
      trend: "neutral",
      sparklineData: generateSparkline(businessMetrics.churnRisk, 2),
      color: "warning",
      icon: AlertTriangle 
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
                    <CardTitle className="text-sm font-semibold">Needs Attention</CardTitle>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {needsAttentionAthletes.filter(a => a?.issueType === 'critical').length} critical · {needsAttentionAthletes.filter(a => a?.issueType === 'warning').length} warning
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : needsAttentionAthletes.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {athletes.length === 0 
                      ? "Nessun atleta collegato. Invita i tuoi atleti!" 
                      : "Tutti gli atleti sono in buono stato!"}
                  </p>
                  {athletes.length === 0 && (
                    <Button variant="outline" size="sm" className="mt-4">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invita Atleta
                    </Button>
                  )}
                </div>
              ) : (
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
                        if (!athlete) return null;
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
              )}
            </CardContent>
          </Card>

          {/* ===== BUSINESS HEALTH with Sparklines ===== */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {businessMetricsWithSparklines.map((metric) => {
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
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <CardTitle className="text-sm font-semibold">Live Activity</CardTitle>
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
                            activity.type === 'success' ? "bg-success/10" : 
                            activity.type === 'message' ? "bg-primary/10" : "bg-secondary"
                          )}>
                            <ActivityIcon className={cn(
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
