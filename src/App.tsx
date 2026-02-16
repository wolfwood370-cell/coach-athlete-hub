import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SunThemeSync } from "@/components/logic/SunThemeSync";
import { OfflineSyncProvider } from "@/providers/OfflineSyncProvider";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { NetworkBadge } from "@/components/ui/NetworkBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RoleRedirect } from "./components/RoleRedirect";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const CoachHome = lazy(() => import("./pages/coach/CoachHome"));
const CoachAthletes = lazy(() => import("./pages/coach/CoachAthletes"));
const AthleteDetail = lazy(() => import("./pages/coach/AthleteDetail"));
const CoachCalendar = lazy(() => import("./pages/coach/CoachCalendar"));
const CoachMessages = lazy(() => import("./pages/coach/CoachMessages"));
const CoachAnalytics = lazy(() => import("./pages/coach/CoachAnalytics"));
const CoachSettings = lazy(() => import("./pages/coach/CoachSettings"));
const CoachBusiness = lazy(() => import("./pages/coach/CoachBusiness"));
const ProgramBuilder = lazy(() => import("./pages/coach/ProgramBuilder"));
const CoachLibrary = lazy(() => import("./pages/coach/CoachLibrary"));
const CoachCheckinInbox = lazy(() => import("./pages/coach/CoachCheckinInbox"));
const FocusDashboard = lazy(() => import("./pages/athlete/FocusDashboard"));
const AthleteLeaderboard = lazy(() => import("./pages/athlete/AthleteLeaderboard"));
const AthleteTraining = lazy(() => import("./pages/athlete/AthleteTraining"));
const AthleteNutrition = lazy(() => import("./pages/athlete/AthleteNutrition"));
const AthleteHealth = lazy(() => import("./pages/athlete/AthleteHealth"));
const AthleteProfile = lazy(() => import("./pages/athlete/AthleteProfile"));
const WorkoutPlayer = lazy(() => import("./pages/athlete/WorkoutPlayer"));
const WorkoutSummary = lazy(() => import("./pages/athlete/WorkoutSummary"));
const AthleteDashboard = lazy(() => import("./pages/athlete/AthleteDashboard"));
const AthleteMessages = lazy(() => import("./pages/athlete/AthleteMessages"));
const OnboardingWizard = lazy(() => import("./pages/onboarding/OnboardingWizard"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
          <Suspense fallback={<LoadingSpinner />}>
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
              <Route path="/coach/inbox" element={<CoachCheckinInbox />} />
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
              <Route path="/athlete/leaderboard" element={<AthleteLeaderboard />} />
              <Route path="/athlete/profile" element={<AthleteProfile />} />
              
              {/* Onboarding */}
              <Route path="/onboarding" element={<OnboardingWizard />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </OfflineSyncProvider>
  </ThemeProvider>
);

export default App;
