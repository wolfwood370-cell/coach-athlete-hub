import { Home, Dumbbell, Calendar, Trophy, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Home", url: "/athlete", icon: Home },
  { title: "Workout", url: "/athlete/workout", icon: Dumbbell },
  { title: "Plan", url: "/athlete/plan", icon: Calendar },
  { title: "Progress", url: "/athlete/progress", icon: Trophy },
  { title: "Profile", url: "/athlete/profile", icon: User },
];

export function AthleteBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass safe-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/athlete"}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary/20' : ''}`}>
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>
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
