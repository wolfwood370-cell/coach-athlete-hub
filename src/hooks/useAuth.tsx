import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  role: "coach" | "athlete";
  full_name: string | null;
  coach_id: string | null;
  avatar_url: string | null;
  one_rm_data: Record<string, number>;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({ ...prev, session, user: session?.user ?? null }));
        
        if (session?.user) {
          // Fetch profile - use setTimeout to avoid race condition
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle();
            
            setState(prev => ({ 
              ...prev, 
              profile: profile as Profile | null,
              loading: false 
            }));
          }, 0);
        } else {
          setState(prev => ({ ...prev, profile: null, loading: false }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: "coach" | "athlete") => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // Update the profile with role
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role, full_name: fullName })
        .eq("id", data.user.id);
      
      if (profileError) throw profileError;
    }

    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    isCoach: state.profile?.role === "coach",
    isAthlete: state.profile?.role === "athlete",
  };
}
