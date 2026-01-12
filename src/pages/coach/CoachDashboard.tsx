import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAthleteRiskAnalysis, RiskLevel, RiskFlag } from "@/hooks/useAthleteRiskAnalysis";
import { useCoachDashboardData } from "@/hooks/useCoachData";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Dumbbell,
  HeartPulse,
  CheckCircle2,
  UserPlus,
  User,
  Mail,
  Activity,
  Zap,
  TrendingDown,
  ShieldAlert,
  Battery,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sparkline Component
function Sparkline({ data, color = "primary", className }: { 
  data: number[]; 
  color?: "primary" | "success" | "warning" | "destructive";
  className?: string;
}) {
  if (data.length < 2) {
    return (
      <div className={cn("w-full h-8 flex items-center justify-center", className)}>
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    );
  }

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

// Risk level configuration
const getRiskConfig = (level: RiskLevel) => {
  switch (level) {
    case "high":
      return { 
        dotClass: "bg-destructive", 
        borderClass: "border-destructive/50",
        bgClass: "bg-destructive/10",
        textClass: "text-destructive"
      };
    case "moderate":
      return { 
        dotClass: "bg-warning", 
        borderClass: "border-warning/50",
        bgClass: "bg-warning/10",
        textClass: "text-warning"
      };
    case "optimal":
      return { 
        dotClass: "bg-success", 
        borderClass: "border-success/50",
        bgClass: "bg-success/10",
        textClass: "text-success"
      };
    default:
      return { 
        dotClass: "bg-muted-foreground", 
        borderClass: "border-muted",
        bgClass: "bg-muted",
        textClass: "text-muted-foreground"
      };
  }
};

// Risk flag icon mapping
const getRiskFlagIcon = (type: RiskFlag["type"]) => {
  switch (type) {
    case "high_injury_risk":
      return ShieldAlert;
    case "overload_warning":
      return Zap;
    case "detraining_risk":
      return TrendingDown;
    case "low_recovery":
      return Battery;
    default:
      return AlertTriangle;
  }
};

const getActivityIcon = (iconName: string) => {
  switch (iconName) {
    case "Dumbbell": return Dumbbell;
    case "HeartPulse": return HeartPulse;
    default: return Dumbbell;
  }
};

export default function CoachDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  
  // Use new risk analysis hook
  const { 
    allAthletes,
    needsAttention, 
    healthyAthletes,
    isLoading: riskLoading 
  } = useAthleteRiskAnalysis();
  
  // Still use coach dashboard data for activity feed and some metrics
  const { 
    businessMetrics,
    activityFeed,
    isLoading: dashboardLoading 
  } = useCoachDashboardData();

  const isLoading = riskLoading || dashboardLoading;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Count by risk level
  const highRiskCount = allAthletes.filter(a => a.riskLevel === "high").length;
  const moderateRiskCount = allAthletes.filter(a => a.riskLevel === "moderate").length;

  // Generate sparkline data from historical compliance (mock for now, real data comes from allAthletes)
  const generateTrendData = (base: number, variance: number) => {
    return Array.from({ length: 14 }, () => 
      Math.max(0, base + (Math.random() - 0.5) * variance * 2)
    );
  };

  const businessMetricsData: Array<{
    label: string;
    value: number | string;
    suffix: string;
    sparklineData: number[];
    color: "primary" | "success" | "warning";
    icon: typeof Users;
  }> = [
    { 
      label: "Atleti Totali", 
      value: allAthletes.length, 
      suffix: "",
      sparklineData: generateTrendData(allAthletes.length, 2),
      color: "primary",
      icon: Users 
    },
    { 
      label: "Compliance Oggi", 
      value: businessMetrics.complianceRate, 
      suffix: "%",
      sparklineData: generateTrendData(businessMetrics.complianceRate, 15),
      color: "success",
      icon: TrendingUp 
    },
    { 
      label: "Readiness Media", 
      value: businessMetrics.avgReadiness ?? "N/A", 
      suffix: businessMetrics.avgReadiness !== null ? "/100" : "",
      sparklineData: generateTrendData(businessMetrics.avgReadiness ?? 70, 10),
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
    <CoachLayout title="Command Center" subtitle="Risk Analysis & Athlete Triage">
      <div className="space-y-6 animate-fade-in">
        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-4 lg:gap-5">
          
          {/* ===== PRIORITY INBOX - Full Width ===== */}
          <Card className="col-span-12 border-0 shadow-sm bg-card">
            <CardHeader className="pb-2 pt-4 px-4 lg:px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Priority Inbox</CardTitle>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {highRiskCount} high risk · {moderateRiskCount} moderate
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : needsAttention.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success/10 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">All Clear!</h3>
                  <p className="text-sm text-muted-foreground">
                    {allAthletes.length === 0 
                      ? "No athletes connected. Invite your athletes!" 
                      : "All athletes are in optimal training zones. Great work!"}
                  </p>
                  {allAthletes.length === 0 && (
                    <Button variant="outline" size="sm" className="mt-4">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Athlete
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {needsAttention.map((athlete) => {
                    const riskConfig = getRiskConfig(athlete.riskLevel);
                    const PrimaryIcon = athlete.primaryFlag 
                      ? getRiskFlagIcon(athlete.primaryFlag.type) 
                      : AlertTriangle;
                    
                    // Determine sparkline color based on risk
                    const sparklineColor = athlete.riskLevel === "high" 
                      ? "destructive" 
                      : athlete.riskLevel === "moderate" 
                        ? "warning" 
                        : "primary";
                    
                    return (
                      <div 
                        key={athlete.athleteId}
                        className="flex items-center gap-4 px-4 lg:px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        {/* Avatar with status dot */}
                        <div className="relative flex-shrink-0">
                          <Avatar className={cn(
                            "h-10 w-10 border-2",
                            riskConfig.borderClass
                          )}>
                            <AvatarImage src={athlete.avatarUrl || undefined} />
                            <AvatarFallback className={cn(
                              "text-xs font-semibold",
                              riskConfig.bgClass,
                              riskConfig.textClass
                            )}>
                              {athlete.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                            riskConfig.dotClass
                          )} />
                        </div>
                        
                        {/* Name & Primary Flag */}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{athlete.athleteName}</p>
                          {athlete.primaryFlag && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge 
                                variant="secondary"
                                className={cn(
                                  "text-[10px] font-medium px-2 py-0.5 gap-1 border-0",
                                  riskConfig.bgClass,
                                  riskConfig.textClass
                                )}
                              >
                                <PrimaryIcon className="h-3 w-3" />
                                {athlete.primaryFlag.value}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {/* 28-Day Load Sparkline */}
                        <div className="hidden sm:block w-24 flex-shrink-0">
                          <Sparkline 
                            data={athlete.dailyLoadHistory} 
                            color={sparklineColor}
                          />
                          <p className="text-[9px] text-muted-foreground text-center mt-0.5">28d Load</p>
                        </div>
                        
                        {/* ACWR Badge */}
                        <div className="hidden md:flex flex-col items-center flex-shrink-0 w-16">
                          <span className={cn(
                            "text-lg font-bold tabular-nums",
                            riskConfig.textClass
                          )}>
                            {athlete.acwr?.toFixed(2) ?? "—"}
                          </span>
                          <span className="text-[9px] text-muted-foreground">ACWR</span>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Send message"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8"
                            title="View profile"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== HEALTHY ATHLETES SUMMARY ===== */}
          {healthyAthletes.length > 0 && (
            <Card className="col-span-12 lg:col-span-4 border-0 shadow-sm bg-card">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <CardTitle className="text-sm font-semibold">Optimal Zone</CardTitle>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {healthyAthletes.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex flex-wrap gap-2">
                  {healthyAthletes.slice(0, 8).map(athlete => (
                    <Avatar 
                      key={athlete.athleteId} 
                      className="h-8 w-8 border-2 border-success/30"
                      title={`${athlete.athleteName} - ACWR: ${athlete.acwr?.toFixed(2) ?? "N/A"}`}
                    >
                      <AvatarImage src={athlete.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px] bg-success/10 text-success font-medium">
                        {athlete.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {healthyAthletes.length > 8 && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                      +{healthyAthletes.length - 8}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== BUSINESS METRICS with Sparklines ===== */}
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-3 gap-4",
            healthyAthletes.length > 0 ? "col-span-12 lg:col-span-8" : "col-span-12"
          )}>
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
                      <p className="text-[10px] text-muted-foreground mt-1">Last 14 days</p>
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
                      No recent activity
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

          {/* ===== ACWR DISTRIBUTION (when we have athletes) ===== */}
          {allAthletes.length > 0 && (
            <Card className="col-span-12 lg:col-span-8 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">ACWR Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 min-w-0">
                    {/* High Risk */}
                    <div className="text-center p-2 sm:p-3 rounded-lg bg-destructive/5">
                      <div className="text-xl sm:text-2xl font-bold text-destructive tabular-nums">
                        {allAthletes.filter(a => (a.acwr ?? 0) > 1.5).length}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 truncate">
                        ACWR &gt; 1.5
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-destructive font-medium">High Risk</div>
                    </div>
                    
                    {/* Elevated */}
                    <div className="text-center p-2 sm:p-3 rounded-lg bg-warning/5">
                      <div className="text-xl sm:text-2xl font-bold text-warning tabular-nums">
                        {allAthletes.filter(a => (a.acwr ?? 0) > 1.3 && (a.acwr ?? 0) <= 1.5).length}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 truncate">
                        1.3 - 1.5
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-warning font-medium">Elevated</div>
                    </div>
                    
                    {/* Optimal */}
                    <div className="text-center p-2 sm:p-3 rounded-lg bg-success/5">
                      <div className="text-xl sm:text-2xl font-bold text-success tabular-nums">
                        {allAthletes.filter(a => (a.acwr ?? 0) >= 0.8 && (a.acwr ?? 0) <= 1.3).length}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 truncate">
                        0.8 - 1.3
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-success font-medium">Optimal</div>
                    </div>
                    
                    {/* Detraining */}
                    <div className="text-center p-2 sm:p-3 rounded-lg bg-muted">
                      <div className="text-xl sm:text-2xl font-bold text-muted-foreground tabular-nums">
                        {allAthletes.filter(a => a.acwr !== null && (a.acwr ?? 0) < 0.8).length}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 truncate">
                        ACWR &lt; 0.8
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-muted-foreground font-medium">Detraining</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </CoachLayout>
  );
}
