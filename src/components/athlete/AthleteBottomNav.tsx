import { NavLink } from "react-router-dom";
import { Home, Dumbbell, Utensils, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const ATHLETE_NAV_ITEMS: NavItem[] = [
  { to: "/athlete/dashboard", label: "Home", icon: Home },
  { to: "/athlete/training", label: "Allenamento", icon: Dumbbell },
  { to: "/athlete/nutrition", label: "Nutrizione", icon: Utensils },
  { to: "/athlete/copilot", label: "Nico-bot", icon: Sparkles },
];

export function AthleteBottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex justify-around items-center px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)] bg-white/90 backdrop-blur-md rounded-t-[32px] border-t border-surface-variant shadow-[0_-4px_20px_-8px_rgba(0,30,45,0.08)]"
      aria-label="Navigazione principale"
    >
      {ATHLETE_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 min-w-[56px] py-1.5 transition-colors",
              isActive ? "text-on-primary" : "text-on-surface-variant"
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  "flex items-center justify-center transition-all duration-200",
                  isActive
                    ? "bg-brand-container text-white px-4 py-1.5 rounded-full shadow-sm"
                    : "p-1.5"
                )}
              >
                <Icon
                  className={cn("h-5 w-5", isActive && "stroke-[2.5]")}
                  aria-hidden="true"
                />
              </span>
              <span
                className={cn(
                  "font-display text-[10px] font-semibold leading-none",
                  isActive ? "text-brand" : "text-on-surface-variant"
                )}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
