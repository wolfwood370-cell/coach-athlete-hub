import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SunThemeSync } from "@/components/logic/SunThemeSync";
import { OfflineSyncProvider, SyncStatusIndicator } from "@/providers/OfflineSyncProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CoachDashboard from "./pages/coach/CoachDashboard";
import ProgramBuilder from "./pages/coach/ProgramBuilder";
import Periodization from "./pages/coach/Periodization";
import AthleteDashboard from "./pages/athlete/AthleteDashboard";
import AthleteNutrition from "./pages/athlete/AthleteNutrition";
import AthleteHealth from "./pages/athlete/AthleteHealth";
import WorkoutPlayer from "./pages/athlete/WorkoutPlayer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      networkMode: 'offlineFirst', // Enable offline-first behavior
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <OfflineSyncProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SunThemeSync />
          <SyncStatusIndicator />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Coach Routes */}
              <Route path="/coach" element={<CoachDashboard />} />
              <Route path="/coach/athletes" element={<CoachDashboard />} />
              <Route path="/coach/programs" element={<ProgramBuilder />} />
              <Route path="/coach/builder" element={<ProgramBuilder />} />
              <Route path="/coach/periodization" element={<Periodization />} />
              <Route path="/coach/calendar" element={<CoachDashboard />} />
              <Route path="/coach/messages" element={<CoachDashboard />} />
              <Route path="/coach/analytics" element={<CoachDashboard />} />
              <Route path="/coach/settings" element={<CoachDashboard />} />
              
              {/* Athlete Routes */}
              <Route path="/athlete" element={<AthleteDashboard />} />
              <Route path="/athlete/workout" element={<AthleteDashboard />} />
              <Route path="/athlete/workout/:id" element={<WorkoutPlayer />} />
              <Route path="/athlete/nutrition" element={<AthleteNutrition />} />
              <Route path="/athlete/health" element={<AthleteHealth />} />
              <Route path="/athlete/profile" element={<AthleteDashboard />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </OfflineSyncProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
