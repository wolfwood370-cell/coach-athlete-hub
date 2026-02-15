import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon_key: string;
  category: string;
  threshold_value: number;
}

export interface UserBadge {
  badge_id: string;
  awarded_at: string;
}

export function useBadges(userId?: string) {
  const { data: allBadges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ["badges-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("category");
      if (error) throw error;
      return data as BadgeDef[];
    },
    staleTime: Infinity,
  });

  const { data: userBadges = [], isLoading: userBadgesLoading } = useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("badge_id, awarded_at")
        .eq("user_id", userId);
      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const earnedIds = new Set(userBadges.map((ub) => ub.badge_id));

  return {
    allBadges,
    userBadges,
    earnedIds,
    isLoading: badgesLoading || userBadgesLoading,
  };
}

export function useLeaderboard(coachId?: string) {
  return useQuery({
    queryKey: ["leaderboard", coachId],
    queryFn: async () => {
      if (!coachId) return [];
      const { data, error } = await supabase
        .from("leaderboard_cache")
        .select("user_id, week_volume, workout_count, streak_weeks, max_load_kg, updated_at")
        .eq("coach_id", coachId)
        .order("week_volume", { ascending: false });
      if (error) throw error;

      // Fetch profile names
      const userIds = (data || []).map((d) => d.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, leaderboard_anonymous")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      return (data || []).map((entry, index) => {
        const profile = profileMap.get(entry.user_id);
        return {
          ...entry,
          rank: index + 1,
          full_name: profile?.leaderboard_anonymous
            ? "Atleta Anonimo"
            : profile?.full_name || "Atleta",
          avatar_url: profile?.leaderboard_anonymous ? null : profile?.avatar_url,
          is_anonymous: profile?.leaderboard_anonymous || false,
        };
      });
    },
    enabled: !!coachId,
    staleTime: 5 * 60_000,
  });
}
