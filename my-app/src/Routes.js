import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Homepage from "./Homepage";
import MedicationsPage from './pages/MedicationsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import TasksPage from './pages/TasksPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<Homepage />} />
      <Route path="/medications" element={<MedicationsPage />} />
      <Route path="/appointments" element={<AppointmentsPage />} />
      <Route path="/tasks" element={<TasksPage />} />
    </Routes>
  );
}



// export default function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/" element={<LoginPage />} />
//       <Route path="/home" element={<Homepage />} />
//       <Route path="/medications" element={<MedicationsPage />} />
//       <Route path="/appointments" element={<AppointmentsPage />} />
//       <Route path="/tasks" element={<TasksPage />} />
//     </Routes>
//   );
// }
