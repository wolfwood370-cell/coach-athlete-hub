import { Home, Dumbbell, Utensils, HeartPulse, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { title: "Home", url: "/athlete", icon: Home },
  { title: "Workout", url: "/athlete/workout", icon: Dumbbell },
  { title: "Nutrition", url: "/athlete/nutrition", icon: Utensils },
  { title: "Health", url: "/athlete/health", icon: HeartPulse },
  { title: "Profile", url: "/athlete/profile", icon: User },
];

export function AthleteBottomNav() {
  // Fetch coach brand color for active state
  const { data: brandColor } = useQuery({
    queryKey: ['athlete-brand-color'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('coach_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.coach_id) return null;
      
      const { data: coach } = await supabase
        .from('profiles')
        .select('brand_color')
        .eq('id', profile.coach_id)
        .single();
      
      return coach?.brand_color || null;
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-50">
      {/* Glassmorphic nav with enhanced blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />
      
      <div className="relative flex items-center justify-around h-16 max-w-md mx-auto safe-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/athlete"}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-muted-foreground transition-all active:scale-95"
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <div className="relative flex flex-col items-center">
                {/* Active indicator line at top */}
                {isActive && (
                  <div 
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                    style={{ backgroundColor: brandColor || 'hsl(var(--primary))' }}
                  />
                )}
                
                <div 
                  className={cn(
                    "relative p-2 rounded-2xl transition-all duration-300 ease-out",
                    isActive && "bg-primary/10"
                  )}
                  style={isActive ? { backgroundColor: brandColor ? `${brandColor}15` : undefined } : undefined}
                >
                  <item.icon 
                    className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                    )}
                    style={isActive ? { color: brandColor || undefined } : undefined}
                  />
                </div>
                
                <span 
                  className={cn(
                    "text-[10px] font-medium transition-all duration-300",
                    isActive && "font-semibold"
                  )}
                  style={isActive ? { color: brandColor || undefined } : undefined}
                >
                  {item.title}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
