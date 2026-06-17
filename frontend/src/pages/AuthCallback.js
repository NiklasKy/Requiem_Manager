import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, CircularProgress, Button, alpha } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { handleDiscordCallback } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const processedRef = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      if (processedRef.current) return;
      processedRef.current = true;

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const authError = searchParams.get('error');

      if (authError) {
        setError('Authorization was denied or cancelled.');
        setLoading(false);
        return;
      }

      if (!code) {
        setError('No authorization code received.');
        setLoading(false);
        return;
      }

      try {
        const success = await handleDiscordCallback(code, state);
        if (success) {
          navigate('/', { replace: true });
        } else {
          setError('Authentication failed. Please try again.');
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [searchParams, handleDiscordCallback, navigate]);

  const bgSx = {
    minHeight: '100vh',
    bgcolor: '#080810',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: `radial-gradient(circle, ${alpha('#5865f2', 0.12)} 1px, transparent 1px)`,
    backgroundSize: '28px 28px',
  };

  if (loading) {
    return (
      <Box sx={bgSx}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress
            size={48}
            thickness={3}
            sx={{ color: '#5865f2', mb: 3 }}
          />
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Authenticating…
          </Typography>
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.4) }}>
            Verifying your Discord credentials
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={bgSx}>
        <Box sx={{ textAlign: 'center', maxWidth: 380, px: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              bgcolor: alpha('#ef4444', 0.1),
              border: `1px solid ${alpha('#ef4444', 0.3)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <ErrorIcon sx={{ fontSize: 30, color: '#f87171' }} />
          </Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Authentication Failed
          </Typography>
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.45), mb: 4, lineHeight: 1.7 }}>
            {error}
          </Typography>
          <Button
            onClick={() => navigate('/login')}
            sx={{
              bgcolor: '#5865f2',
              color: '#fff',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': { bgcolor: '#4752c4' },
            }}
          >
            Try Again
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
};

export default AuthCallback;
