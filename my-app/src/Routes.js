import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import Homepage from "./Homepage";
import MedicationsPage from './pages/MedicationsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import SettingsPage from './pages/SettingsPage';
import { applyAccessibilitySettings } from "./accessibilitySettings";

export default function AppRoutes() {
  useEffect(() => {
    applyAccessibilitySettings();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<Homepage />} />
      <Route path="/medications" element={<MedicationsPage />} />
      <Route path="/appointments" element={<AppointmentsPage />} />
      <Route path="/tasks" element={<SettingsPage />} />
    </Routes>
  );
}
