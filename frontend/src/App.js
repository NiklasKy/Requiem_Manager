import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Unauthorized from './pages/Unauthorized';
import LandingPage from './pages/LandingPage';
import MemberHome from './pages/MemberHome';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import RecentChanges from './pages/RecentChanges';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Events from './pages/Events';
import Leaderboard from './pages/Leaderboard';
import News from './pages/News';

/**
 * Layout wrapper for all authenticated pages.
 * Navbar takes its natural height; content area fills the rest
 * with overflow-y: auto so pages can scroll when needed.
 */
const AuthLayout = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
    <Navbar />
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', bgcolor: '#08080f' }}>
      {children}
    </Box>
  </Box>
);

// Root route: public landing page or member home depending on auth state
const RootRoute = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated()) {
    return (
      <ProtectedRoute>
        <AuthLayout>
          <MemberHome />
        </AuthLayout>
      </ProtectedRoute>
    );
  }
  return <LandingPage />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected routes — all wrapped in AuthLayout */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AuthLayout>
                      <Routes>
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/news" element={<News />} />
                        <Route path="/changes" element={<RecentChanges />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/users/:userId" element={<UserDetail />} />
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute requireAdmin={true}>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute requireAdmin={true}>
                              <AdminPanel />
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </AuthLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
