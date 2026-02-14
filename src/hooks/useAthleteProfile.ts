import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CoachBranding {
  coachId: string | null;
  coachName: string | null;
  logoUrl: string | null;
  brandColor: string | null;
}

export function useAthleteProfile() {
  const { user, profile } = useAuth();
  const athleteId = user?.id ?? null;

  const { data: coachData, isLoading: coachLoading } = useQuery({
    queryKey: ["athlete-coach-branding", athleteId],
    queryFn: async (): Promise<CoachBranding> => {
      if (!athleteId) {
        return { coachId: null, coachName: null, logoUrl: null, brandColor: null };
      }

      const { data: athleteProfile } = await supabase
        .from("profiles")
        .select("coach_id")
        .eq("id", athleteId)
        .single();

      if (!athleteProfile?.coach_id) {
        return { coachId: null, coachName: null, logoUrl: null, brandColor: null };
      }

      const { data: coach } = await supabase
        .from("profiles")
        .select("id, full_name, logo_url, brand_color")
        .eq("id", athleteProfile.coach_id)
        .single();

      return {
        coachId: coach?.id ?? null,
        coachName: coach?.full_name ?? null,
        logoUrl: coach?.logo_url ?? null,
        brandColor: coach?.brand_color ?? null,
      };
    },
    enabled: !!athleteId,
    staleTime: Infinity,
  });

  return {
    athleteId,
    athleteName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    coach: coachData ?? { coachId: null, coachName: null, logoUrl: null, brandColor: null },
    isLoading: coachLoading,
  };
}
