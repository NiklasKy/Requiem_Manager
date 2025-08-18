import React from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  keyframes,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Login as LoginIcon, 
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Animations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 20px rgba(88, 101, 242, 0.3); }
  50% { box-shadow: 0 0 40px rgba(88, 101, 242, 0.6); }
  100% { box-shadow: 0 0 20px rgba(88, 101, 242, 0.3); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const Login = () => {
  const { startDiscordLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  React.useEffect(() => {
    if (isAuthenticated()) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDark 
          ? 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 50%, #2d1b69 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDark
            ? 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 200, 255, 0.3) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
          pointerEvents: 'none',
        }
      }}
    >
      <Container maxWidth="sm">
        {/* Main Login Card */}
        <Card
          elevation={0}
          sx={{
            background: isDark
              ? alpha('#1a1a1a', 0.8)
              : alpha('#ffffff', 0.25),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(isDark ? '#ffffff' : '#ffffff', 0.2)}`,
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.1)}, transparent)`,
              animation: `${shimmer} 3s infinite`,
            }
          }}
        >
          <CardContent sx={{ p: 6 }}>
            {/* Header */}
            <Box textAlign="center" mb={4}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 4,
                  position: 'relative',
                }}
              >
                <img
                  src="/icons/requiem-logo.png"
                  alt="Requiem Logo"
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
                    transition: 'all 0.3s ease',
                  }}
                  onError={(e) => {
                    // Fallback to Login icon with circle if logo doesn't load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <Box
                  sx={{
                    display: 'none', // Hidden by default, shown if image fails
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, #5865f2 0%, #7289da 100%)`,
                    animation: `${glow} 3s ease-in-out infinite`,
                    boxShadow: '0 8px 32px rgba(88, 101, 242, 0.4)',
                    position: 'absolute'
                  }}
                >
                  <LoginIcon 
                    sx={{ 
                      fontSize: 50, 
                      color: 'white'
                    }} 
                  />
                </Box>
              </Box>
              
              <Typography 
                variant="h3" 
                gutterBottom 
                fontWeight="bold"
                sx={{
                  background: isDark
                    ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Requiem Tracking
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  color: alpha(isDark ? '#ffffff' : '#ffffff', 0.8),
                  fontWeight: 400
                }}
              >
                Management Dashboard
              </Typography>
            </Box>

            {/* Features */}
            <Box 
              display="flex" 
              justifyContent="center" 
              gap={4} 
              mb={4}
              sx={{
                flexWrap: 'wrap'
              }}
            >
              {[
                { icon: SecurityIcon, text: 'Secure' },
                { icon: SpeedIcon, text: 'Fast' },
                { icon: AnalyticsIcon, text: 'Analytics' }
              ].map(({ icon: Icon, text }, index) => (
                <Box
                  key={text}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity: 0.8,
                    animation: `${float} 4s ease-in-out infinite`,
                    animationDelay: `${index * 0.5}s`
                  }}
                >
                  <Icon sx={{ fontSize: 24, mb: 1, color: alpha('#ffffff', 0.7) }} />
                  <Typography variant="caption" sx={{ color: alpha('#ffffff', 0.7) }}>
                    {text}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 4, bgcolor: alpha('#ffffff', 0.2) }} />

            {/* Login Section */}
            <Box textAlign="center">
              <Typography 
                variant="body1" 
                sx={{ 
                  color: alpha('#ffffff', 0.8),
                  mb: 4,
                  fontSize: '1.1rem',
                  lineHeight: 1.6
                }}
              >
                Sign in with your Discord account to access the dashboard.
                <br />
                Only authorized guild members can access this application.
              </Typography>

              <Button
                variant="contained"
                size="large"
                onClick={startDiscordLogin}
                sx={{
                  py: 2,
                  px: 6,
                  fontSize: '1.2rem',
                  background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
                  border: 'none',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 8px 32px rgba(88, 101, 242, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(88, 101, 242, 0.4)',
                    background: 'linear-gradient(135deg, #4752c4 0%, #5865f2 100%)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transition: 'left 0.5s',
                  },
                  '&:hover::before': {
                    left: '100%',
                  }
                }}
                startIcon={
                  <Box
                    component="img"
                    src="/icons/discord.svg"
                    alt="Discord"
                    sx={{ 
                      width: 28, 
                      height: 28,
                      filter: 'brightness(0) invert(1)' // Makes it white
                    }}
                  />
                }
              >
                Sign in with Discord
              </Button>

              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  color: alpha('#ffffff', 0.6),
                  mt: 3,
                  fontSize: '0.9rem'
                }}
              >
                🔒 You'll be redirected to Discord to authorize access.
                <br />
                No sensitive information is stored or shared.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box textAlign="center" mt={4}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: alpha('#ffffff', 0.7),
              fontSize: '0.9rem'
            }}
          >
            Having trouble? Contact your server administrator.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
