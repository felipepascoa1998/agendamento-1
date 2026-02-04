import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminAgenda from "./pages/admin/Agenda";
import AdminServicos from "./pages/admin/Servicos";
import AdminFuncionarios from "./pages/admin/Funcionarios";
import AdminBloqueios from "./pages/admin/Bloqueios";
import AdminRelatorios from "./pages/admin/Relatorios";
import ClienteAgendar from "./pages/cliente/Agendar";
import ClienteAgendamentos from "./pages/cliente/MeusAgendamentos";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
import { createContext, useContext } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Auth Callback Component
const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        
        try {
          const response = await axios.post(
            `${API}/auth/session`,
            { session_id: sessionId },
            { withCredentials: true }
          );
          
          const user = response.data;
          
          // Clear hash and redirect based on role
          window.history.replaceState(null, "", window.location.pathname);
          
          if (user.role === "admin") {
            navigate("/admin", { state: { user } });
          } else {
            navigate("/agendar", { state: { user } });
          }
        } catch (error) {
          console.error("Auth error:", error);
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-primary">
        <svg className="w-12 h-12 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(location.state?.user ? true : null);
  const [user, setUser] = useState(location.state?.user || null);

  useEffect(() => {
    if (location.state?.user) return;

    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, {
          withCredentials: true
        });
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate("/login");
      }
    };

    checkAuth();
  }, [location.state, navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">
          <svg className="w-12 h-12 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/agendar"} />;
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// App Router
function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id - must be synchronous
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/agenda"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminAgenda />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/servicos"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminServicos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/funcionarios"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminFuncionarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bloqueios"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminBloqueios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/relatorios"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminRelatorios />
          </ProtectedRoute>
        }
      />
      
      {/* Client Routes */}
      <Route
        path="/agendar"
        element={
          <ProtectedRoute>
            <ClienteAgendar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meus-agendamentos"
        element={
          <ProtectedRoute>
            <ClienteAgendamentos />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
