import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface AthleteCardProps {
  athleteId: string;
  athleteName: string;
  avatarUrl: string | null;
  avatarInitials: string;
  lastActivityDate: string | null;
  programName: string | null;
  isActive: boolean; // Active in last 3 days
}

export function AthleteCard({
  athleteId,
  athleteName,
  avatarUrl,
  avatarInitials,
  lastActivityDate,
  programName,
  isActive,
}: AthleteCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/coach/athlete/${athleteId}`);
  };

  const getLastActiveText = () => {
    if (!lastActivityDate) return "Mai attivo";
    try {
      return formatDistanceToNow(new Date(lastActivityDate), {
        addSuffix: true,
        locale: it,
      });
    } catch {
      return "Data sconosciuta";
    }
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "group cursor-pointer transition-all duration-200",
        "bg-card border border-border/50",
        "hover:border-primary/50 hover:shadow-md hover:scale-[1.02]",
        "active:scale-[0.98]"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12 border-2 border-border">
            <AvatarImage src={avatarUrl || undefined} alt={athleteName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
          {/* Status Dot */}
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card",
              isActive ? "bg-success" : "bg-muted-foreground/50"
            )}
          />
        </div>

        {/* Name & Status */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {athleteName}
          </h3>
          <p className={cn(
            "text-xs mt-0.5",
            isActive ? "text-success" : "text-muted-foreground"
          )}>
            {isActive ? "Attivo" : "Inattivo"}
          </p>
        </div>
      </div>

      {/* Body - Metrics Row */}
      <div className="px-4 pb-4 pt-0 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Ultima attività</span>
          <span className="text-foreground font-medium tabular-nums">
            {getLastActiveText()}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Programma</span>
          <span className="text-foreground font-medium truncate max-w-[120px]">
            {programName || "Nessun programma"}
          </span>
        </div>
      </div>
    </Card>
  );
}
