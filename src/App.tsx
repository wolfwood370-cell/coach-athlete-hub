import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CoachDashboard from "./pages/coach/CoachDashboard";
import ProgramBuilder from "./pages/coach/ProgramBuilder";
import AthleteDashboard from "./pages/athlete/AthleteDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Coach Routes */}
          <Route path="/coach" element={<CoachDashboard />} />
          <Route path="/coach/athletes" element={<CoachDashboard />} />
          <Route path="/coach/programs" element={<ProgramBuilder />} />
          <Route path="/coach/calendar" element={<CoachDashboard />} />
          <Route path="/coach/messages" element={<CoachDashboard />} />
          <Route path="/coach/analytics" element={<CoachDashboard />} />
          <Route path="/coach/settings" element={<CoachDashboard />} />
          
          {/* Athlete Routes */}
          <Route path="/athlete" element={<AthleteDashboard />} />
          <Route path="/athlete/workout" element={<AthleteDashboard />} />
          <Route path="/athlete/nutrition" element={<AthleteDashboard />} />
          <Route path="/athlete/profile" element={<AthleteDashboard />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
