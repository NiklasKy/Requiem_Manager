import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  alpha,
  Grid,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Groups as GroupsIcon,
  Shield as ShieldIcon,
  EmojiEvents as TrophyIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

// Brand palette
const CR    = '#c0392b';
const CR_LT = '#e74c3c';

// ── Ember particles (pre-computed so they don't change on re-render) ────
const EMBERS = [
  { id:  0, left:  '8%',  size: 3, delay: 0.0, duration: 7.2, drift:  15 },
  { id:  1, left: '15%',  size: 2, delay: 1.3, duration: 6.0, drift: -20 },
  { id:  2, left: '22%',  size: 4, delay: 2.7, duration: 8.5, drift:  10 },
  { id:  3, left: '30%',  size: 2, delay: 0.8, duration: 5.8, drift:  25 },
  { id:  4, left: '38%',  size: 3, delay: 3.4, duration: 7.0, drift: -12 },
  { id:  5, left: '45%',  size: 2, delay: 1.0, duration: 6.5, drift:  18 },
  { id:  6, left: '52%',  size: 4, delay: 4.2, duration: 9.0, drift: -22 },
  { id:  7, left: '60%',  size: 2, delay: 0.5, duration: 6.2, drift:  14 },
  { id:  8, left: '67%',  size: 3, delay: 2.1, duration: 7.8, drift: -8  },
  { id:  9, left: '74%',  size: 2, delay: 5.0, duration: 5.5, drift:  20 },
  { id: 10, left: '80%',  size: 3, delay: 1.8, duration: 8.0, drift: -16 },
  { id: 11, left: '88%',  size: 2, delay: 3.0, duration: 6.8, drift:  12 },
  { id: 12, left: '12%',  size: 2, delay: 6.0, duration: 7.5, drift:  22 },
  { id: 13, left: '28%',  size: 3, delay: 4.5, duration: 6.3, drift: -18 },
  { id: 14, left: '42%',  size: 2, delay: 2.3, duration: 5.9, drift:  16 },
  { id: 15, left: '56%',  size: 4, delay: 7.0, duration: 8.8, drift: -24 },
  { id: 16, left: '70%',  size: 2, delay: 1.5, duration: 7.1, drift:  11 },
  { id: 17, left: '84%',  size: 3, delay: 3.8, duration: 6.6, drift: -14 },
  { id: 18, left: '93%',  size: 2, delay: 5.5, duration: 5.7, drift:  19 },
  { id: 19, left: '35%',  size: 3, delay: 0.3, duration: 8.2, drift: -10 },
];

// ── Dummy data ─────────────────────────────────────────────────────────────
const GAMES = [
  {
    id: 'wwm',
    name: 'Where Winds Meet',
    genre: 'Action RPG',
    status: 'active',
    achievements: [
      { title: 'Top 10 Guild Ranking', date: 'Jan 2026' },
      { title: 'First Clear — Tomb of Eternity', date: 'Dec 2025' },
      { title: '500 Member Milestone', date: 'Nov 2025' },
    ],
    color: CR,
  },
  {
    id: 'aion2',
    name: 'AION 2',
    genre: 'MMORPG',
    status: 'preparing',
    achievements: [
      { title: 'Beta Access Secured', date: '2026' },
      { title: 'Recruiting Phase Active', date: 'Jan 2026' },
    ],
    color: '#b45309',
  },
  {
    id: 'tba',
    name: 'Next Title',
    genre: 'TBA',
    status: 'upcoming',
    achievements: [],
    color: alpha('#fff', 0.2),
  },
];

const STATS = [
  { label: 'Members',      value: '240+', icon: GroupsIcon  },
  { label: 'Roles Tracked', value: '1.8k', icon: ShieldIcon  },
  { label: 'Titles Cleared', value: '12',   icon: TrophyIcon  },
  { label: 'Active Since',   value: '2021', icon: CalendarIcon },
];

const STATUS_LABEL = {
  active:    { label: 'Active',      color: '#22c55e' },
  preparing: { label: 'Preparing',   color: '#f59e0b' },
  upcoming:  { label: 'Coming Soon', color: alpha('#fff', 0.3) },
};
// ──────────────────────────────────────────────────────────────────────────

const CINZEL = '"Cinzel", "Palatino Linotype", serif';

const LandingPage = () => {
  const navigate = useNavigate();
  const [landingStats, setLandingStats] = useState(null);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    apiService.getLandingStats().then(setLandingStats).catch(() => {});
    apiService.getAchievements().then(setAchievements).catch(() => {});
  }, []);

  return (
    <Box sx={{ bgcolor: '#08080f', minHeight: '100vh', color: '#fff' }}>

      {/* ── Top navigation bar ──────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 3, md: 6 },
          py: 2,
          borderBottom: `1px solid ${alpha(CR, 0.18)}`,
          position: 'sticky',
          top: 0,
          bgcolor: alpha('#08080f', 0.92),
          backdropFilter: 'blur(16px)',
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/icons/Requiem-logo.png"
            alt="Requiem"
            sx={{ width: 34, height: 34, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Typography
            variant="body1"
            sx={{ fontWeight: 700, fontFamily: CINZEL, letterSpacing: '0.04em', fontSize: '1rem' }}
          >
            REQUIEM
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/login')}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          sx={{
            color: '#fff',
            borderColor: alpha(CR, 0.5),
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            px: 2,
            '&:hover': { borderColor: CR_LT, bgcolor: alpha(CR, 0.12) },
          }}
        >
          Member Login
        </Button>
      </Box>

      {/* ── Hero ────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 3, md: 6 },
          pt: { xs: 12, md: 18 },
          pb: { xs: 12, md: 16 },
          textAlign: 'center',
          // Dot grid
          backgroundImage: `radial-gradient(circle, ${alpha(CR, 0.14)} 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          // Glow orb with pulse animation
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 65% 55% at 50% 0%, ${alpha(CR, 0.24)} 0%, transparent 70%)`,
            pointerEvents: 'none',
            animation: 'requiemGlowPulse 4s ease-in-out infinite',
          },
        }}
      >
        {/* ── Ember particles ───────────────────────────────── */}
        {EMBERS.map((e) => (
          <Box
            key={e.id}
            style={{ '--ember-drift': `${e.drift}px` }}
            sx={{
              position: 'absolute',
              bottom: '10%',
              left: e.left,
              width:  e.size,
              height: e.size,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${e.id % 3 === 0 ? '#ff6b35' : e.id % 3 === 1 ? CR_LT : CR} 0%, transparent 100%)`,
              boxShadow: `0 0 ${e.size * 2}px ${e.id % 2 === 0 ? CR_LT : CR}`,
              animation: `requiemEmberFloat ${e.duration}s ease-in ${e.delay}s infinite`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ))}

        {/* ── Content (above particles) ─────────────────────── */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>

          {/* Recruiting badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.75,
              borderRadius: 99,
              bgcolor: alpha('#22c55e', 0.08),
              border: `1px solid ${alpha('#22c55e', 0.28)}`,
              mb: 5,
              animation: 'requiemWordReveal 0.7s ease-out backwards, requiemBadgePulse 3s ease-in-out 1s infinite',
              animationDelay: '0s, 1s',
            }}
          >
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 600, letterSpacing: '0.06em' }}>
              Recruiting — Join the ranks
            </Typography>
          </Box>

          {/* Main headline — line 1 */}
          <Typography
            variant="h1"
            sx={{
              fontFamily: CINZEL,
              fontWeight: 900,
              letterSpacing: '0.02em',
              fontSize: { xs: '2.4rem', md: '4.5rem', lg: '5.5rem' },
              lineHeight: 1.05,
              mb: 0.5,
              textTransform: 'uppercase',
              animation: 'requiemWordReveal 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s backwards',
            }}
          >
            Where Worlds Fall
          </Typography>

          {/* Main headline — line 2 (crimson gradient, slightly delayed) */}
          <Typography
            variant="h1"
            sx={{
              fontFamily: CINZEL,
              fontWeight: 900,
              letterSpacing: '0.02em',
              fontSize: { xs: '2.4rem', md: '4.5rem', lg: '5.5rem' },
              lineHeight: 1.05,
              mb: 4,
              textTransform: 'uppercase',
              animation: 'requiemWordReveal 0.9s cubic-bezier(0.16,1,0.3,1) 0.45s backwards',
            }}
          >
            <Box
              component="span"
              sx={{
                background: `linear-gradient(90deg, ${CR} 0%, ${CR_LT} 50%, #ff6b6b 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Legends Remain.
            </Box>
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h6"
            sx={{
              color: alpha('#fff', 0.45),
              maxWidth: 560,
              mx: 'auto',
              mb: 7,
              fontWeight: 400,
              lineHeight: 1.7,
              fontSize: { xs: '1rem', md: '1.1rem' },
              animation: 'requiemWordReveal 0.9s cubic-bezier(0.16,1,0.3,1) 0.7s backwards',
            }}
          >
            A multi-gaming guild for veterans, fighters and tacticians.
            Dark in style. Loyal at heart. Decisive in battle.
          </Typography>

          {/* CTA buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ animation: 'requiemWordReveal 0.9s cubic-bezier(0.16,1,0.3,1) 0.95s backwards' }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: CR,
                color: '#fff',
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                boxShadow: `0 4px 24px ${alpha(CR, 0.40)}`,
                '&:hover': { bgcolor: CR_LT, boxShadow: `0 4px 32px ${alpha(CR_LT, 0.50)}` },
              }}
            >
              Enter the Hub
            </Button>
            <Button
              variant="outlined"
              size="large"
              component="a"
              href="https://discord.gg/requiem-community"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: alpha('#fff', 0.7),
                borderColor: alpha('#fff', 0.18),
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                '&:hover': { borderColor: alpha(CR, 0.5), bgcolor: alpha(CR, 0.07) },
              }}
            >
              Join Discord
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <Box
        sx={{
          borderTop: `1px solid ${alpha(CR, 0.18)}`,
          borderBottom: `1px solid ${alpha(CR, 0.18)}`,
          px: { xs: 3, md: 6 },
          py: 4,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
        }}
      >
        {STATS.map(({ label, value: defaultValue, icon: Icon }) => {
          let value = defaultValue;
          if (label === 'Members'       && landingStats?.member_count) value = `${landingStats.member_count}+`;
          if (label === 'Roles Tracked'  && landingStats?.role_count)   value = landingStats.role_count > 999 ? `${(landingStats.role_count / 1000).toFixed(1)}k` : String(landingStats.role_count);
          if (label === 'Titles Cleared' && achievements.length > 0)    value = String(achievements.length);
          if (label === 'Active Since'   && landingStats?.days_active)   value = `${landingStats.days_active}d`;
          return (
            <Box key={label} sx={{ textAlign: 'center' }}>
              <Icon sx={{ fontSize: 22, color: alpha(CR, 0.75), mb: 0.5 }} />
              <Typography variant="h5" sx={{ fontFamily: CINZEL, fontWeight: 800, letterSpacing: '0.02em' }}>
                {value}
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.38), textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.68rem' }}>
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* ── Games section ───────────────────────────────────── */}
      <Box sx={{ px: { xs: 3, md: 6 }, py: { xs: 8, md: 12 } }}>
        <Typography
          variant="overline"
          sx={{ color: alpha(CR, 0.9), letterSpacing: '0.14em', fontSize: '0.72rem', fontFamily: CINZEL }}
        >
          Our Campaigns
        </Typography>
        <Typography
          variant="h3"
          sx={{ fontFamily: CINZEL, fontWeight: 800, letterSpacing: '0.02em', mt: 1, mb: 6, fontSize: { xs: '1.7rem', md: '2.3rem' }, textTransform: 'uppercase' }}
        >
          Where we conquer
        </Typography>

        <Grid container spacing={3}>
          {GAMES.map((game) => {
            const status = STATUS_LABEL[game.status];
            const realAchievements = achievements.filter(a => a.game_name.toLowerCase() === game.name.toLowerCase());
            const displayAchievements = realAchievements.length > 0
              ? realAchievements.map(a => ({ title: a.title, date: a.achieved_at || '' }))
              : game.achievements;
            return (
              <Grid item xs={12} md={4} key={game.id}>
                <Box
                  sx={{
                    height: '100%',
                    p: 3,
                    borderRadius: '16px',
                    bgcolor: alpha('#fff', 0.02),
                    border: `1px solid ${alpha(game.color, 0.22)}`,
                    transition: 'border-color 0.2s ease, background 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(game.color, 0.06),
                      borderColor: alpha(game.color, 0.45),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, fontFamily: CINZEL, letterSpacing: '0.02em' }}>
                        {game.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: alpha('#fff', 0.38) }}>
                        {game.genre}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.25,
                        py: 0.5,
                        borderRadius: 99,
                        bgcolor: alpha(status.color, 0.1),
                        border: `1px solid ${alpha(status.color, 0.3)}`,
                      }}
                    >
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: status.color }} />
                      <Typography variant="caption" sx={{ color: status.color, fontWeight: 600, fontSize: '0.7rem' }}>
                        {status.label}
                      </Typography>
                    </Box>
                  </Box>

                  {displayAchievements.length > 0 ? (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      {displayAchievements.map((ach) => (
                        <Box
                          key={ach.title}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            py: 0.75,
                            px: 1.25,
                            borderRadius: '8px',
                            bgcolor: alpha('#fff', 0.025),
                            border: `1px solid ${alpha('#fff', 0.05)}`,
                          }}
                        >
                          <TrophyIcon sx={{ fontSize: 14, color: alpha(game.color, 0.85), flexShrink: 0 }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" sx={{ color: alpha('#fff', 0.8), display: 'block', fontWeight: 500, lineHeight: 1.3 }}>
                              {ach.title}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: alpha('#fff', 0.28), whiteSpace: 'nowrap', fontSize: '0.68rem' }}>
                            {ach.date}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.28), mt: 2, display: 'block' }}>
                      Campaigns coming soon
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* ── CTA Banner ──────────────────────────────────────── */}
      <Box
        sx={{
          mx: { xs: 3, md: 6 },
          mb: { xs: 6, md: 10 },
          p: { xs: 4, md: 6 },
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${alpha(CR, 0.22)} 0%, ${alpha('#3d0000', 0.5)} 100%)`,
          border: `1px solid ${alpha(CR, 0.40)}`,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, ${alpha(CR, 0.1)} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          },
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontFamily: CINZEL, fontWeight: 800, letterSpacing: '0.03em', mb: 1.5, fontSize: { xs: '1.4rem', md: '1.9rem' }, textTransform: 'uppercase', position: 'relative' }}
        >
          Prove yourself.
        </Typography>
        <Typography variant="body1" sx={{ color: alpha('#fff', 0.48), mb: 4, position: 'relative' }}>
          Applications are open. We don't recruit players — we recruit legends.
        </Typography>
        <Button
          variant="contained"
          component="a"
          href="https://discord.gg/requiem-community"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            bgcolor: CR,
            color: '#fff',
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            px: 5,
            py: 1.4,
            position: 'relative',
            boxShadow: `0 4px 24px ${alpha(CR, 0.45)}`,
            '&:hover': { bgcolor: CR_LT },
          }}
        >
          Join our Discord
        </Button>
      </Box>

      {/* ── Footer ──────────────────────────────────────────── */}
      <Box
        sx={{
          borderTop: `1px solid ${alpha(CR, 0.10)}`,
          px: { xs: 3, md: 6 },
          py: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/icons/Requiem-logo.png"
            alt="Requiem"
            sx={{ width: 22, height: 22, objectFit: 'contain', opacity: 0.45 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.28), fontFamily: CINZEL, letterSpacing: '0.06em' }}>
            © {new Date().getFullYear()} Requiem Gaming Community
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={() => navigate('/login')}
          sx={{ color: alpha('#fff', 0.35), textTransform: 'none', fontSize: '0.8rem', '&:hover': { color: '#fff' } }}
        >
          Member Login
        </Button>
      </Box>
    </Box>
  );
};

export default LandingPage;
