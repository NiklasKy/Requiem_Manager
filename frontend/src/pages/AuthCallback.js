import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { handleDiscordCallback } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const processedRef = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // Prevent multiple calls (React StrictMode)
      if (processedRef.current) {
        return;
      }
      processedRef.current = true;

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
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

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Card elevation={4}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>
                Authenticating with Discord...
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Please wait while we verify your credentials.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Typography
              variant="body2"
              component="a"
              href="/login"
              sx={{ 
                color: 'inherit',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Try Again
            </Typography>
          }
        >
          <Typography variant="h6" gutterBottom>
            Authentication Failed
          </Typography>
          {error}
        </Alert>
      </Container>
    );
  }

  return null;
};

export default AuthCallback;
