import { Outlet } from "react-router-dom";
import { AthleteBottomNav } from "./AthleteBottomNav";

export function AthleteLayout() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <main className="max-w-md mx-auto">
        <Outlet />
      </main>
      <AthleteBottomNav />
    </div>
  );
}

export default AthleteLayout;
