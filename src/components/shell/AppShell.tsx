import { Outlet } from "react-router-dom";
import { BottomNavigation } from "./BottomNavigation";

export function AppShell() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <main
        className="flex-1"
        style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}
