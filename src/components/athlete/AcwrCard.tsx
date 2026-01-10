import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcwrData } from "@/hooks/useAcwrData";
import { TrendingUp, AlertTriangle, AlertOctagon, HelpCircle } from "lucide-react";
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

  if (error || !data) {
    return (
      <Card className="border-0">
        <CardContent className="p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Carico ACWR</span>
          </div>
          <p className="text-xl font-bold tabular-nums text-muted-foreground">—</p>
          <p className="text-[10px] text-muted-foreground">{error ? "Errore" : "Dati insufficienti"}</p>
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
