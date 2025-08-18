import React from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { Lock as LockIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Card elevation={4} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={4}>
            <LockIcon 
              sx={{ 
                fontSize: 80, 
                color: 'error.main',
                mb: 2
              }} 
            />
            <Typography variant="h4" gutterBottom fontWeight="bold" color="error">
              Access Denied
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Insufficient Permissions
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>You don't have permission to access this resource.</strong>
            </Typography>
            <Typography variant="body2">
              This area requires administrator privileges. If you believe this is an error, 
              please contact your server administrator.
            </Typography>
          </Alert>

          {user && (
            <Box mb={3} p={2} sx={{ backgroundColor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Signed in as: <strong>{user.username}#{user.discriminator}</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Your roles: {user.roles?.map(role => role.name).join(', ') || 'None'}
              </Typography>
            </Box>
          )}

          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{ minWidth: 120 }}
            >
              Go Home
            </Button>
            <Button
              variant="outlined"
              onClick={logout}
              sx={{ minWidth: 120 }}
            >
              Sign Out
            </Button>
          </Box>

          <Typography variant="caption" display="block" textAlign="center" color="textSecondary" mt={3}>
            Need help? Contact your server administrator for access.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Unauthorized;
