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
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <ul className="flex items-stretch justify-around max-w-md mx-auto">
        {ATHLETE_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-1 text-xs transition-colors",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn("h-5 w-5", isActive && "stroke-[2.5]")}
                    aria-hidden="true"
                  />
                  <span className="leading-none">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
