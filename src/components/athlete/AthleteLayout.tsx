import { AthleteBottomNav } from "./AthleteBottomNav";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SunThemeToggle } from "@/components/SunThemeToggle";

interface AthleteLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AthleteLayout({ children, title }: AthleteLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Status bar safe area */}
      <div className="safe-top" />
      
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 glass-adaptive px-4 py-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="w-9" /> {/* Spacer for centering */}
            <h1 className="text-lg font-semibold text-center flex-1">{title}</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <SunThemeToggle />
              </PopoverContent>
            </Popover>
          </div>
        </header>
      )}
      
      {/* Main content with bottom nav spacing */}
      <main className="pb-24 safe-bottom">
        {children}
      </main>
      
      <AthleteBottomNav />
    </div>
  );
}
