import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="textSecondary">
          Authenticating...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated()) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
