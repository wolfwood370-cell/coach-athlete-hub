import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SunThemeSync } from "@/components/logic/SunThemeSync";
import { OfflineSyncProvider } from "@/providers/OfflineSyncProvider";
import { MaterialYouProvider } from "@/providers/MaterialYouProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CoachHome from "./pages/coach/CoachHome";
import CoachAthletes from "./pages/coach/CoachAthletes";
import AthleteDetail from "./pages/coach/AthleteDetail";
import CoachCalendar from "./pages/coach/CoachCalendar";
import CoachMessages from "./pages/coach/CoachMessages";
import CoachAnalytics from "./pages/coach/CoachAnalytics";
import CoachSettings from "./pages/coach/CoachSettings";
import CoachBusiness from "./pages/coach/CoachBusiness";
import ProgramBuilder from "./pages/coach/ProgramBuilder";
import CoachLibrary from "./pages/coach/CoachLibrary";
import AthleteDashboard from "./pages/athlete/AthleteDashboard";
import AthleteTraining from "./pages/athlete/AthleteTraining";
import AthleteNutrition from "./pages/athlete/AthleteNutrition";
import AthleteHealth from "./pages/athlete/AthleteHealth";
import AthleteProfile from "./pages/athlete/AthleteProfile";
import WorkoutPlayer from "./pages/athlete/WorkoutPlayer";
import FocusDashboard from "./pages/athlete/FocusDashboard";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
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
          
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Coach Routes */}
              <Route path="/coach" element={<CoachHome />} />
              <Route path="/coach/athletes" element={<CoachAthletes />} />
              <Route path="/coach/athlete/:id" element={<AthleteDetail />} />
              <Route path="/coach/programs" element={<ProgramBuilder />} />
              <Route path="/coach/calendar" element={<CoachCalendar />} />
              <Route path="/coach/messages" element={<CoachMessages />} />
              <Route path="/coach/library" element={<CoachLibrary />} />
              <Route path="/coach/analytics" element={<CoachAnalytics />} />
              <Route path="/coach/business" element={<CoachBusiness />} />
              <Route path="/coach/settings" element={<CoachSettings />} />
              
              {/* Athlete Routes - Wrapped with MaterialYouProvider */}
              <Route path="/athlete" element={<MaterialYouProvider><AthleteDashboard /></MaterialYouProvider>} />
              <Route path="/athlete/focus" element={<MaterialYouProvider><FocusDashboard /></MaterialYouProvider>} />
              <Route path="/athlete/workout" element={<MaterialYouProvider><AthleteTraining /></MaterialYouProvider>} />
              <Route path="/athlete/workout/:id" element={<MaterialYouProvider><WorkoutPlayer /></MaterialYouProvider>} />
              <Route path="/athlete/nutrition" element={<MaterialYouProvider><AthleteNutrition /></MaterialYouProvider>} />
              <Route path="/athlete/health" element={<MaterialYouProvider><AthleteHealth /></MaterialYouProvider>} />
              <Route path="/athlete/profile" element={<MaterialYouProvider><AthleteProfile /></MaterialYouProvider>} />
              
              {/* Onboarding */}
              <Route path="/onboarding" element={<OnboardingWizard />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </OfflineSyncProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
