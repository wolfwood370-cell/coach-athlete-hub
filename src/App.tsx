import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SunThemeSync } from "@/components/logic/SunThemeSync";
import { OfflineSyncProvider } from "@/providers/OfflineSyncProvider";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { NetworkBadge } from "@/components/ui/NetworkBadge";
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
import FocusDashboard from "./pages/athlete/FocusDashboard";
import AthleteTraining from "./pages/athlete/AthleteTraining";
import AthleteNutrition from "./pages/athlete/AthleteNutrition";
import AthleteHealth from "./pages/athlete/AthleteHealth";
import AthleteProfile from "./pages/athlete/AthleteProfile";
import WorkoutPlayer from "./pages/athlete/WorkoutPlayer";
import WorkoutSummary from "./pages/athlete/WorkoutSummary";
import AthleteDashboard from "./pages/athlete/AthleteDashboard";
import AthleteMessages from "./pages/athlete/AthleteMessages";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
import NotFound from "./pages/NotFound";
import { RoleRedirect } from "./components/RoleRedirect";

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <OfflineSyncProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SunThemeSync />
        <NetworkBadge />
        <InstallPrompt />
        
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RoleRedirect fallback={<Index />} />} />
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
            
            {/* Athlete Routes */}
            <Route path="/athlete" element={<FocusDashboard />} />
            <Route path="/athlete/dashboard" element={<AthleteDashboard />} />
            <Route path="/athlete/focus" element={<FocusDashboard />} />
            <Route path="/athlete/workout" element={<AthleteTraining />} />
            <Route path="/athlete/workout/:id" element={<WorkoutPlayer />} />
            <Route path="/athlete/workout/summary/:sessionId" element={<WorkoutSummary />} />
            <Route path="/athlete/messages" element={<AthleteMessages />} />
            <Route path="/athlete/nutrition" element={<AthleteNutrition />} />
            <Route path="/athlete/health" element={<AthleteHealth />} />
            <Route path="/athlete/profile" element={<AthleteProfile />} />
            
            {/* Onboarding */}
            <Route path="/onboarding" element={<OnboardingWizard />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </OfflineSyncProvider>
  </ThemeProvider>
);

export default App;
