import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AthleteBiometrics {
  weightKg: number | null;
  heightCm: number | null;
  ageYears: number | null;
  gender: "male" | "female" | "other" | null;
}

interface OnboardingDataShape {
  biometrics?: {
    gender?: "male" | "female" | "other" | null;
    dateOfBirth?: string | null;
    heightCm?: number | null;
    weightKg?: number | null;
  };
}

function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

/**
 * Reads the athlete's current biometrics. Source priority:
 *  1. Latest body weight from `daily_metrics`
 *  2. Profile `onboarding_data.biometrics`
 */
export function useAthleteBiometrics() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["athlete-biometrics", userId],
    queryFn: async (): Promise<AthleteBiometrics> => {
      if (!userId) {
        return { weightKg: null, heightCm: null, ageYears: null, gender: null };
      }

      const [profileRes, weightRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("onboarding_data")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("daily_metrics")
          .select("body_weight_kg, weight_kg, date")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const onboarding =
        (profileRes.data?.onboarding_data as OnboardingDataShape | null) ?? null;
      const bio = onboarding?.biometrics ?? {};

      const latestWeight =
        weightRes.data?.body_weight_kg ??
        weightRes.data?.weight_kg ??
        bio.weightKg ??
        null;

      return {
        weightKg: latestWeight ? Number(latestWeight) : null,
        heightCm: bio.heightCm ?? null,
        ageYears: ageFromDob(bio.dateOfBirth),
        gender: bio.gender ?? null,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
