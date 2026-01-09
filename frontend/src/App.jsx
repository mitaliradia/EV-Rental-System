// client/src/App.jsx

// --- IMPORTANT: Only import Routes and Route, NOT BrowserRouter ---
import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import UserRoute from './components/UserRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import StationMasterDashboard from './pages/StationMasterDashboard';
import VehiclesPage from './pages/VehiclesPage';
import SuperAdminRoute from './components/superAdminRoute';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import StationDetailPage from './pages/StationDetailPage';
import StationMasterRoute from './components/StationMasterRoute';

function App() {
  return (
    // --- NO <Router> TAGS HERE ---
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Your routes go here */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route element={<UserRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route element={<StationMasterRoute />}>
            <Route path="/dashboard" element={<StationMasterDashboard />} />
          </Route>
          <Route element={<SuperAdminRoute />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/station/:id" element={<StationDetailPage />} />
          </Route>
          <Route path="*" element={<h1>404 - Not Found</h1>} />
        </Routes>
      </main>
    </div>
    // --- NO <Router> TAGS HERE ---
  );
}

export default App;