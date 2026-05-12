import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Homepage from "./Homepage";
import MedicationsPage from './pages/MedicationsPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<Homepage />} />
      <Route path="/medications" element={<MedicationsPage />} />
    </Routes>
  );
}// import { Routes, Route } from 'react-router-dom';
// import Homepage from './Homepage';
// import AppointmentsPage from './pages/AppointmentsPage';
// import TasksPage from './pages/TasksPage';
// import LoginPage from "./pages/LoginPage";


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
