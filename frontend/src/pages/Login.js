import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  alpha,
} from '@mui/material';
import {
  ManageAccounts as ManageAccountsIcon,
  Timeline as TimelineIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Groups as GroupsIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Requiem brand palette
const CR    = '#c0392b';
const CR_LT = '#e74c3c';
const CINZEL = '"Cinzel", "Palatino Linotype", serif';

const FEATURES = [
  {
    icon: ManageAccountsIcon,
    title: 'Role Tracking',
    description: 'Every role change — who, when, by whom — documented without gaps.',
  },
  {
    icon: TimelineIcon,
    title: 'Activity Feed',
    description: 'Real-time overview of all server events at a single glance.',
  },
  {
    icon: AdminPanelSettingsIcon,
    title: 'Command Controls',
    description: 'Manage permissions and access centrally — directly from the hub.',
  },
  {
    icon: GroupsIcon,
    title: 'Guild Overview',
    description: 'Full member roster with role history and detailed individual profiles.',
  },
];

const Login = () => {
  const { startDiscordLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
        display: 'flex',
        bgcolor: '#080810',
      }}
    >
      {/* ── Left branding panel ─────────────────────────────── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '0 0 58%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 6, lg: 8 },
          position: 'relative',
          overflow: 'hidden',
          // Dot-grid background
          backgroundImage: `radial-gradient(circle, ${alpha(CR, 0.22)} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 80% 60% at 30% 40%, ${alpha(CR, 0.18)} 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 70% 80%, ${alpha(CR, 0.10)} 0%, transparent 70%)`,
            pointerEvents: 'none',
            animation: 'requiemGlowPulse 4s ease-in-out infinite',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '1px',
            height: '100%',
            background: `linear-gradient(to bottom, transparent, ${alpha(CR, 0.45)}, transparent)`,
          },
        }}
      >
        {/* Ember particles */}
        {[
          { id: 0, left: '10%', size: 3, delay: 0.0, duration: 7.0, drift: 15 },
          { id: 1, left: '25%', size: 2, delay: 1.8, duration: 6.2, drift: -12 },
          { id: 2, left: '40%', size: 3, delay: 3.5, duration: 8.0, drift: 20 },
          { id: 3, left: '55%', size: 2, delay: 0.7, duration: 5.8, drift: -18 },
          { id: 4, left: '70%', size: 4, delay: 2.2, duration: 7.5, drift: 10 },
          { id: 5, left: '85%', size: 2, delay: 4.8, duration: 6.8, drift: -22 },
          { id: 6, left: '18%', size: 3, delay: 5.5, duration: 9.0, drift: 14 },
          { id: 7, left: '62%', size: 2, delay: 1.2, duration: 7.2, drift: -8 },
          { id: 8, left: '78%', size: 3, delay: 3.0, duration: 6.5, drift: 18 },
          { id: 9, left: '33%', size: 2, delay: 6.2, duration: 8.5, drift: -16 },
        ].map((e) => (
          <Box
            key={e.id}
            style={{ '--ember-drift': `${e.drift}px` }}
            sx={{
              position: 'absolute',
              bottom: '5%',
              left: e.left,
              width: e.size,
              height: e.size,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${e.id % 2 === 0 ? '#e74c3c' : '#c0392b'} 0%, transparent 100%)`,
              boxShadow: `0 0 ${e.size * 2}px #c0392b`,
              animation: `requiemEmberFloat ${e.duration}s ease-in ${e.delay}s infinite`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ))}

        {/* Top: Logo + wordmark */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6 }}>
            <Box
              component="img"
              src="/icons/Requiem-logo.png"
              alt="Requiem"
              sx={{ width: 48, height: 48, objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <Typography
              variant="h6"
            sx={{ color: '#fff', fontWeight: 700, letterSpacing: '0.04em', fontFamily: CINZEL }}
          >
            REQUIEM
          </Typography>
          </Box>

          {/* Brand headline */}
          <Typography
            variant="h2"
            sx={{
              fontFamily: CINZEL,
              fontWeight: 800,
              letterSpacing: '0.02em',
              lineHeight: 1.1,
              color: '#fff',
              mb: 2,
              maxWidth: 520,
              textTransform: 'uppercase',
            }}
          >
            Dark in style.
            <br />
            <Box
              component="span"
              sx={{
                background: `linear-gradient(90deg, ${CR} 0%, ${CR_LT} 60%, #ff6b6b 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Loyal at heart.
            </Box>
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: alpha('#fff', 0.48),
              maxWidth: 440,
              lineHeight: 1.7,
              fontSize: '1.05rem',
            }}
          >
            Requiem gives your guild full transparency over roles,
            members and activity — built for veterans who demand more.
          </Typography>
        </Box>

        {/* Middle: Feature list */}
        <Stack spacing={3} sx={{ position: 'relative', zIndex: 1, my: 6 }}>
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Box
              key={title}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  bgcolor: alpha(CR, 0.12),
                  border: `1px solid ${alpha(CR, 0.30)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon sx={{ fontSize: 20, color: CR_LT }} />
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: '#fff', fontWeight: 600, mb: 0.25 }}
                >
                  {title}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha('#fff', 0.45), lineHeight: 1.5 }}>
                  {description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>

        {/* Bottom: Status badge */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.75,
              borderRadius: 99,
              bgcolor: alpha('#22c55e', 0.1),
              border: `1px solid ${alpha('#22c55e', 0.25)}`,
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
            <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 500 }}>
              All systems operational
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Right login panel ───────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 5 },
          position: 'relative',
          bgcolor: '#100a0a',
        }}
      >
        {/* Back to landing page */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            left: 20,
          }}
        >
          <Button
            size="small"
            onClick={() => navigate('/')}
            sx={{
              color: alpha('#fff', 0.4),
              textTransform: 'none',
              fontSize: '0.8rem',
              gap: 0.5,
              '&:hover': { color: alpha('#fff', 0.8) },
            }}
          >
            ← Home
          </Button>
        </Box>

        {/* Mobile logo (only visible on small screens) */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            gap: 1.5,
            mb: 5,
          }}
        >
          <Box
            component="img"
            src="/icons/Requiem-logo.png"
            alt="Requiem"
            sx={{ width: 36, height: 36, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontFamily: CINZEL, letterSpacing: '0.04em' }}>
            REQUIEM
          </Typography>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 360 }}>
          {/* Heading */}
          <Typography
            variant="h5"
            sx={{ color: '#fff', fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}
          >
            Welcome back
          </Typography>
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.45), mb: 4, lineHeight: 1.6 }}>
          Sign in with your Discord account.
                <br />
                Access restricted to authorized guild members.
          </Typography>

          {/* Divider */}
          <Box
            sx={{
              height: '1px',
              bgcolor: alpha('#fff', 0.07),
              mb: 4,
            }}
          />

          {/* Discord login button */}
          <Button
            fullWidth
            size="large"
            onClick={startDiscordLogin}
            startIcon={
              <Box
                component="img"
                src="/icons/discord.svg"
                alt="Discord"
                sx={{
                  width: 22,
                  height: 22,
                  filter: 'brightness(0) invert(1)',
                }}
              />
            }
            endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
            sx={{
              py: 1.75,
              px: 3,
            bgcolor: CR,
            color: '#fff',
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            justifyContent: 'space-between',
            transition: 'background 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              bgcolor: CR_LT,
              boxShadow: `0 0 0 4px ${alpha(CR, 0.30)}`,
            },
            '&:active': {
              bgcolor: '#8b0000',
            },
            }}
          >
            Sign in with Discord
          </Button>

          {/* Trust note */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: alpha('#fff', 0.3),
              mt: 3,
              lineHeight: 1.6,
            }}
          >
            You'll be redirected to Discord to authorize access.
            <br />
            No passwords or sensitive data are stored.
          </Typography>
        </Box>

        {/* Bottom footer */}
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 24,
            color: alpha('#fff', 0.2),
            textAlign: 'center',
          }}
        >
          Having trouble? Contact your server administrator.
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
