import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcwrData } from "@/hooks/useAcwrData";
import { TrendingUp, AlertTriangle, AlertOctagon, HelpCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function AcwrCard() {
  const { data, isLoading, error } = useAcwrData();

  if (isLoading) {
    return (
      <Card className="border-0">
        <CardContent className="p-3.5">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20 mt-1" />
        </CardContent>
      </Card>
    );
  }

  // Enhanced empty state for insufficient data
  if (error || !data || data.status === "insufficient-data") {
    return (
      <Card className="border-0 bg-gradient-to-br from-muted/50 to-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <Activity className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Carico ACWR</p>
              <p className="text-lg font-bold text-muted-foreground/70">—</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {error ? "Errore nel caricamento" : "Completa 7+ giorni di allenamento per sbloccare le analytics ACWR"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusConfig = () => {
    switch (data?.status) {
      case "optimal":
        return {
          icon: TrendingUp,
          color: "text-success",
          bgColor: "bg-success/10",
          borderColor: "border-success/20",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          color: "text-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/20",
        };
      case "high-risk":
        return {
          icon: AlertOctagon,
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/20",
        };
      default:
        return {
          icon: HelpCircle,
          color: "text-muted-foreground",
          bgColor: "bg-secondary",
          borderColor: "border-border",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={cn("border-0 overflow-hidden", config.bgColor)}>
      <CardContent className="p-3.5">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn("h-4 w-4", config.color)} />
          <span className="text-xs text-muted-foreground">Carico ACWR</span>
        </div>
        <p className={cn("text-xl font-bold tabular-nums", config.color)}>
          {data?.ratio !== null ? data.ratio.toFixed(2) : "—"}
        </p>
        <p className={cn("text-[10px] font-medium", config.color)}>
          {data?.label}
        </p>
      </CardContent>
    </Card>
  );
}
