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
    <div className="theme-athlete h-[100dvh] flex flex-col bg-white dark:bg-black text-foreground">
      {/* Status bar safe area */}
      <div className="safe-top flex-shrink-0" />
      
      {/* Header */}
      {title && (
        <header className="flex-shrink-0 sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md px-4 py-3 border-b border-border/20">
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
      
      {/* Main content with bottom nav spacing - scrollable */}
      <main className="flex-1 overflow-y-auto pb-24 safe-bottom bg-white dark:bg-black">
        {children}
      </main>
      
      <AthleteBottomNav />
    </div>
  );
}
