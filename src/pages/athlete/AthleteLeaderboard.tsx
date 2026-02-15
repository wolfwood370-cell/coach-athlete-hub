import { useState } from "react";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLeaderboard } from "@/hooks/useBadges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Trophy, Flame, Dumbbell, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const rankColors: Record<number, string> = {
  1: "from-amber-400 to-yellow-500",
  2: "from-slate-300 to-slate-400",
  3: "from-amber-600 to-amber-700",
};

const rankEmoji: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export default function AthleteLeaderboard() {
  const { user, profile } = useAuth();
  const coachId = profile?.coach_id;
  const { data: leaderboard = [], isLoading } = useLeaderboard(coachId || undefined);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const toggleAnonymous = async (checked: boolean) => {
    setIsAnonymous(checked);
    if (!user?.id) return;
    const { error } = await supabase
      .from("profiles")
      .update({ leaderboard_anonymous: checked } as any)
      .eq("id", user.id);
    if (error) {
      toast.error("Errore nell'aggiornamento privacy");
    } else {
      toast.success(checked ? "Sei ora anonimo nella classifica" : "Il tuo nome è ora visibile");
    }
  };

  const sortedByVolume = [...leaderboard].sort((a, b) => b.week_volume - a.week_volume);
  const sortedByWorkouts = [...leaderboard].sort((a, b) => b.workout_count - a.workout_count);
  const sortedByLoad = [...leaderboard].sort((a, b) => b.max_load_kg - a.max_load_kg);

  const renderRow = (
    entry: (typeof leaderboard)[0],
    rank: number,
    metric: string,
    unit: string
  ) => {
    const isMe = entry.user_id === user?.id;
    const initials = entry.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "?";

    return (
      <div
        key={entry.user_id}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl transition-colors",
          isMe && "bg-primary/5 border border-primary/20",
          rank <= 3 && "relative overflow-hidden"
        )}
      >
        {/* Rank */}
        <div className="w-8 text-center shrink-0">
          {rank <= 3 ? (
            <span className="text-lg">{rankEmoji[rank]}</span>
          ) : (
            <span className="text-sm font-bold text-muted-foreground">
              {rank}
            </span>
          )}
        </div>

        {/* Avatar */}
        <Avatar className="h-10 w-10 border-2 border-border">
          <AvatarImage src={entry.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {entry.is_anonymous ? "?" : initials}
          </AvatarFallback>
        </Avatar>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium text-sm truncate",
            isMe && "text-primary"
          )}>
            {entry.full_name}
            {isMe && " (Tu)"}
          </p>
        </div>

        {/* Metric */}
        <div className="text-right shrink-0">
          <p className="font-bold text-sm tabular-nums">{metric}</p>
          <p className="text-[10px] text-muted-foreground">{unit}</p>
        </div>
      </div>
    );
  };

  return (
    <AthleteLayout title="Classifica">
      <div className="flex-1 overflow-auto pb-24">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Classifica Team</h1>
            <p className="text-sm text-muted-foreground">
              Confrontati con gli altri atleti del tuo coach
            </p>
          </div>

          {/* Privacy Toggle */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isAnonymous ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <Label className="font-medium">Modalità Anonima</Label>
                    <p className="text-xs text-muted-foreground">
                      Nascondi il tuo nome in classifica
                    </p>
                  </div>
                </div>
                <Switch checked={isAnonymous} onCheckedChange={toggleAnonymous} />
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Tabs */}
          <Tabs defaultValue="volume" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="volume" className="gap-1.5 text-xs">
                <Dumbbell className="h-3.5 w-3.5" />
                Volume
              </TabsTrigger>
              <TabsTrigger value="consistency" className="gap-1.5 text-xs">
                <Flame className="h-3.5 w-3.5" />
                Costanza
              </TabsTrigger>
              <TabsTrigger value="strength" className="gap-1.5 text-xs">
                <Trophy className="h-3.5 w-3.5" />
                Carichi
              </TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="space-y-3 mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <Card className="mt-4 border-dashed border-2 border-border bg-muted/10">
                <CardContent className="p-8 text-center">
                  <Trophy className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nessun dato disponibile ancora. Completa un allenamento per entrare in classifica!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <TabsContent value="volume" className="space-y-2">
                  {/* Podium top 3 */}
                  {sortedByVolume.length >= 3 && (
                    <div className="flex items-end justify-center gap-2 py-4">
                      {[1, 0, 2].map((idx) => {
                        const entry = sortedByVolume[idx];
                        if (!entry) return null;
                        const rank = idx === 0 ? 1 : idx === 1 ? 2 : 3;
                        const heights = { 1: "h-24", 2: "h-20", 3: "h-16" };
                        return (
                          <div key={entry.user_id} className="flex flex-col items-center gap-1">
                            <Avatar className="h-10 w-10 border-2 border-border">
                              <AvatarImage src={entry.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {entry.full_name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-medium truncate max-w-[70px] text-center">
                              {entry.full_name}
                            </span>
                            <div
                              className={cn(
                                "w-20 rounded-t-xl flex items-center justify-center",
                                heights[rank as 1 | 2 | 3],
                                `bg-gradient-to-t ${rankColors[rank]}`
                              )}
                            >
                              <span className="text-white font-bold text-lg">
                                {rankEmoji[rank]}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {sortedByVolume.map((entry, i) =>
                    renderRow(
                      entry,
                      i + 1,
                      entry.week_volume >= 1000
                        ? `${(entry.week_volume / 1000).toFixed(1)}k`
                        : `${entry.week_volume}`,
                      "kg/sett."
                    )
                  )}
                </TabsContent>

                <TabsContent value="consistency" className="space-y-2">
                  {sortedByWorkouts.map((entry, i) =>
                    renderRow(entry, i + 1, `${entry.workout_count}`, "allenamenti")
                  )}
                </TabsContent>

                <TabsContent value="strength" className="space-y-2">
                  {sortedByLoad.map((entry, i) =>
                    renderRow(
                      entry,
                      i + 1,
                      `${entry.max_load_kg}`,
                      "kg max"
                    )
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </AthleteLayout>
  );
}
