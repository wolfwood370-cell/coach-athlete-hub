import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Training from "@/pages/Training";
import Nutrition from "@/pages/Nutrition";
import Copilot from "@/pages/Copilot";
import Notifications from "@/pages/Notifications";

/**
 * App — root del progetto Lumina.
 *
 * Routing flat senza layout shared: ogni page renderizza il proprio Header
 * e BottomNav, quindi non serve un AppLayout di livello superiore.
 *
 * `/` redirige al Dashboard come home di default.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/training" element={<Training />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/copilot" element={<Copilot />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
