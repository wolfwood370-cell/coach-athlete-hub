import { NavLink } from "react-router-dom";
import { LayoutDashboard, Dumbbell, Utensils, Sparkles, type LucideIcon } from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  activeColor: string; // hex
};

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, activeColor: "#FFFFFF" },
  { to: "/training", label: "Training", icon: Dumbbell, activeColor: "#FFFFFF" },
  { to: "/nutrition", label: "Nutrition", icon: Utensils, activeColor: "#FFFFFF" },
  { to: "/copilot", label: "Copilot", icon: Sparkles, activeColor: "#8B5CF6" },
];

const INACTIVE = "#64748B";
const BG = "#1E293B";

export function BottomNavigation() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: BG,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around h-16 max-w-md mx-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, activeColor }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className="flex flex-col items-center justify-center h-full gap-1 transition-opacity active:opacity-70"
            >
              {({ isActive }) => {
                const color = isActive ? activeColor : INACTIVE;
                return (
                  <>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} style={{ color }} />
                    <span
                      className="text-[11px] font-medium"
                      style={{ color }}
                    >
                      {label}
                    </span>
                  </>
                );
              }}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
