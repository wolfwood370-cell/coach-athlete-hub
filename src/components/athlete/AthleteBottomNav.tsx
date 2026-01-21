import { Home, Dumbbell, Apple, HeartPulse, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Home", url: "/athlete", icon: Home },
  { title: "Workout", url: "/athlete/workout", icon: Dumbbell },
  { title: "Nutrition", url: "/athlete/nutrition", icon: Apple },
  { title: "Salute", url: "/athlete/health", icon: HeartPulse },
  { title: "Profile", url: "/athlete/profile", icon: User },
];

export function AthleteBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphic nav with enhanced blur - OLED friendly */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.3)]" />
      
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
              <>
                <div 
                  className={cn(
                    "relative p-2 rounded-2xl transition-all duration-300 ease-out",
                    isActive && "bg-primary/15"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} 
                  />
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </div>
                <span 
                  className={cn(
                    "text-[10px] font-medium transition-all duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.title}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
