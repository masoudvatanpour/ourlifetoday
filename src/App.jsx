import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import KidPicker from './pages/KidPicker';
import PinEntry from './pages/PinEntry';
import Today from './pages/Today';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import Rewards from './pages/Rewards';
import Game from './pages/Game';
import ParentLogin from './pages/ParentLogin';
import ParentHome from './pages/ParentHome';
import ParentKids from './pages/ParentKids';
import ParentGoals from './pages/ParentGoals';
import ParentReport from './pages/ParentReport';

function Spinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="text-6xl animate-spin">⭐</div>
      <p className="mt-4 text-lg font-semibold text-purple-600">Loading...</p>
    </div>
  );
}

function RequireSupabaseAuth({ children }) {
  const { supabaseUser, loading, dataReady } = useAuth();
  if (loading) return <Spinner />;
  if (!supabaseUser) return <Navigate to="/login" replace />;
  if (!dataReady) return <Spinner />;
  return children;
}

function RequireKid({ children }) {
  const { currentKid } = useAuth();
  return currentKid ? children : <Navigate to="/" replace />;
}

function RequireParent({ children }) {
  const { isParent } = useAuth();
  return isParent ? children : <Navigate to="/parent/login" replace />;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<RequireSupabaseAuth><KidPicker /></RequireSupabaseAuth>} />
        <Route path="/pin/:kidId" element={<RequireSupabaseAuth><PinEntry /></RequireSupabaseAuth>} />

        <Route path="/today" element={<RequireKid><Today /></RequireKid>} />
        <Route path="/history" element={<RequireKid><History /></RequireKid>} />
        <Route path="/dashboard" element={<RequireKid><Dashboard /></RequireKid>} />
        <Route path="/report" element={<RequireKid><Report /></RequireKid>} />
        <Route path="/rewards" element={<RequireKid><Rewards /></RequireKid>} />
        <Route path="/game" element={<RequireKid><Game /></RequireKid>} />

        <Route path="/parent/login" element={<RequireSupabaseAuth><ParentLogin /></RequireSupabaseAuth>} />
        <Route path="/parent" element={<RequireParent><ParentHome /></RequireParent>} />
        <Route path="/parent/kids" element={<RequireParent><ParentKids /></RequireParent>} />
        <Route path="/parent/goals" element={<RequireParent><ParentGoals /></RequireParent>} />
        <Route path="/parent/report" element={<RequireParent><ParentReport /></RequireParent>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <NavBar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
