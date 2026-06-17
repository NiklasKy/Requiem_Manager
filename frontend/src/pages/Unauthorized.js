import React from 'react';
import { Box, Typography, Button, Stack, alpha } from '@mui/material';
import { LockOutlined as LockIcon, ArrowBack as ArrowBackIcon, LogoutOutlined as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#080810',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `radial-gradient(circle, ${alpha('#5865f2', 0.12)} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
        px: 3,
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 420 }}>
        {/* Icon */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '18px',
            bgcolor: alpha('#ef4444', 0.1),
            border: `1px solid ${alpha('#ef4444', 0.3)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <LockIcon sx={{ fontSize: 34, color: '#f87171' }} />
        </Box>

        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.04em', mb: 1 }}>
          Access Denied
        </Typography>
        <Typography variant="body2" sx={{ color: alpha('#fff', 0.45), lineHeight: 1.7, mb: 4 }}>
          You don't have permission to view this page.
          {user && (
            <>
              {' '}Signed in as <Box component="span" sx={{ color: alpha('#fff', 0.7), fontWeight: 600 }}>{user.username}</Box>.
            </>
          )}
          <br />
          Contact an administrator if you believe this is an error.
        </Typography>

        {/* Divider */}
        <Box sx={{ height: '1px', bgcolor: alpha('#5865f2', 0.15), mb: 4 }} />

        <Stack direction="row" spacing={1.5} justifyContent="center">
          <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: alpha('#fff', 0.7),
              bgcolor: alpha('#fff', 0.06),
              border: `1px solid ${alpha('#fff', 0.1)}`,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
              '&:hover': { bgcolor: alpha('#fff', 0.1), color: '#fff' },
            }}
          >
            Go Back
          </Button>
          <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: '#f87171',
              bgcolor: alpha('#ef4444', 0.08),
              border: `1px solid ${alpha('#ef4444', 0.2)}`,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
              '&:hover': { bgcolor: alpha('#ef4444', 0.15) },
            }}
          >
            Sign Out
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default Unauthorized;
