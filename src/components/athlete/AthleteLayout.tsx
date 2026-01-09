import { AthleteBottomNav } from "./AthleteBottomNav";

interface AthleteLayoutProps {
  children: React.ReactNode;
}

export function AthleteLayout({ children }: AthleteLayoutProps) {
  return (
    <div className="athlete-theme min-h-screen bg-background">
      <main className="pb-24">
        {children}
      </main>
      <AthleteBottomNav />
    </div>
  );
}
