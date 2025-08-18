import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import RecentChanges from './pages/RecentChanges';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/users/:userId" element={<UserDetail />} />
                      <Route path="/changes" element={<RecentChanges />} />
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedRoute requireAdmin={true}>
                            <AdminPanel />
                          </ProtectedRoute>
                        } 
                      />
                    </Routes>
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
