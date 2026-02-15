import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Redirect authenticated users to their role-based home page.
 * Renders nothing; used as an element in the "/" route.
 */
export function RoleRedirect({ fallback }: { fallback: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) return;

    if (profile.role === "athlete") {
      if (!profile.onboarding_completed) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/athlete", { replace: true });
      }
    } else if (profile.role === "coach") {
      navigate("/coach", { replace: true });
    }
  }, [user, profile, loading, navigate]);

  // While loading or if not logged in, show the landing page
  if (loading || !user || !profile) {
    return <>{fallback}</>;
  }

  return null;
}
