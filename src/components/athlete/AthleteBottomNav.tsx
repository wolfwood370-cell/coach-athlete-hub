import { Home, Dumbbell, Apple, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Home", url: "/athlete", icon: Home },
  { title: "Workout", url: "/athlete/workout", icon: Dumbbell },
  { title: "Nutrition", url: "/athlete/nutrition", icon: Apple },
  { title: "Profile", url: "/athlete/profile", icon: User },
];

export function AthleteBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass safe-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/athlete"}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-muted-foreground transition-all"
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/20 scale-110' : ''}`}>
                  <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-primary' : ''}`} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : ''}`}>
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
