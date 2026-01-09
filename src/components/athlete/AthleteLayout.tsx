import { AthleteBottomNav } from "./AthleteBottomNav";

interface AthleteLayoutProps {
  children: React.ReactNode;
  title?: string;
  hideBottomNav?: boolean;
}

export function AthleteLayout({ children, title, hideBottomNav = false }: AthleteLayoutProps) {
  return (
    <div className="athlete-theme min-h-screen bg-background text-foreground">
      {/* Status bar safe area */}
      <div className="safe-top" />
      
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 glass px-4 py-3 border-b border-border/30">
          <h1 className="text-lg font-semibold text-center">{title}</h1>
        </header>
      )}
      
      {/* Main content with bottom nav spacing */}
      <main className={hideBottomNav ? "safe-bottom" : "pb-24 safe-bottom"}>
        {children}
      </main>
      
      {!hideBottomNav && <AthleteBottomNav />}
    </div>
  );
}
