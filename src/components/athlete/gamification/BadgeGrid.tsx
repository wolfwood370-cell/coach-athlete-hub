import {
  Trophy,
  Flame,
  Dumbbell,
  Shield,
  Crown,
  Sunrise,
  Zap,
  Footprints,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBadges, type BadgeDef } from "@/hooks/useBadges";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const iconMap: Record<string, React.ElementType> = {
  footprints: Footprints,
  flame: Flame,
  dumbbell: Dumbbell,
  shield: Shield,
  crown: Crown,
  sunrise: Sunrise,
  trophy: Trophy,
  zap: Zap,
};

function BadgeItem({
  badge,
  earned,
  isNew,
}: {
  badge: BadgeDef;
  earned: boolean;
  isNew: boolean;
}) {
  const Icon = iconMap[badge.icon_key] || Trophy;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300",
            earned
              ? "bg-primary/10 border border-primary/30"
              : "bg-muted/30 border border-border/30 grayscale opacity-50"
          )}
        >
          {/* Glow effect for new badges */}
          {isNew && (
            <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-pulse" />
          )}

          <div
            className={cn(
              "relative h-12 w-12 rounded-xl flex items-center justify-center",
              earned
                ? "bg-gradient-to-br from-primary/30 to-primary/10"
                : "bg-muted/50"
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6",
                earned ? "text-primary" : "text-muted-foreground"
              )}
            />
            {isNew && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-ping" />
            )}
          </div>

          <span
            className={cn(
              "text-[10px] font-medium text-center leading-tight max-w-[72px]",
              earned ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {badge.name}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <p className="font-medium">{badge.name}</p>
        <p className="text-xs text-muted-foreground">{badge.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function BadgeGrid({ userId }: { userId?: string }) {
  const { allBadges, userBadges, earnedIds, isLoading } = useBadges(userId);

  // Badges earned in the last 24 hours are "new"
  const recentThreshold = Date.now() - 24 * 60 * 60 * 1000;
  const newBadgeIds = new Set(
    userBadges
      .filter((ub) => new Date(ub.awarded_at).getTime() > recentThreshold)
      .map((ub) => ub.badge_id)
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  // Sort: earned first, then by category
  const sorted = [...allBadges].sort((a, b) => {
    const aEarned = earnedIds.has(a.id) ? 0 : 1;
    const bEarned = earnedIds.has(b.id) ? 0 : 1;
    if (aEarned !== bEarned) return aEarned - bEarned;
    return a.category.localeCompare(b.category);
  });

  return (
    <div className="grid grid-cols-4 gap-3">
      {sorted.map((badge) => (
        <BadgeItem
          key={badge.id}
          badge={badge}
          earned={earnedIds.has(badge.id)}
          isNew={newBadgeIds.has(badge.id)}
        />
      ))}
    </div>
  );
}
