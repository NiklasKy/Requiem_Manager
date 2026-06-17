import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Stack,
  Avatar,
  Chip,
  alpha,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  EmojiEvents as TrophyIcon,
  Newspaper as NewsIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

// ── Placeholder data (replaced in Phase 3) ─────────────────────────────
const PLACEHOLDER_EVENTS = [
  { id: 1, title: 'Raid Night — Tomb of Eternity', game: 'Where Winds Meet', date: 'Tomorrow, 20:00', spots: '12 / 20' },
  { id: 2, title: 'PvP Tournament', game: 'Where Winds Meet', date: 'Sat, 18:00', spots: '8 / 16' },
  { id: 3, title: 'AION 2 Beta Prep Session', game: 'AION 2', date: 'Sun, 19:00', spots: '5 / 10' },
];

const PLACEHOLDER_LEADERBOARD = [
  { rank: 1, name: 'Arathorn', score: 2840, roles: 7 },
  { rank: 2, name: 'Sylvara', score: 2610, roles: 6 },
  { rank: 3, name: 'Kazimir', score: 2490, roles: 6 },
  { rank: 4, name: 'Veloris', score: 2310, roles: 5 },
  { rank: 5, name: 'Thornwood', score: 2150, roles: 5 },
];

const PLACEHOLDER_NEWS = [
  { id: 1, title: 'AION 2 Beta Keys Secured!', summary: 'We managed to get 20 beta access keys for the upcoming AION 2 closed beta. More info in #announcements.', date: '2h ago' },
  { id: 2, title: 'Raid Roster Update', summary: 'New raid composition posted for the Tomb of Eternity progression team. Check #raid-roster for details.', date: '1d ago' },
];
// ───────────────────────────────────────────────────────────────────────

const CR    = '#c0392b';
const CR_LT = '#e74c3c';

const SectionHeader = ({ icon: Icon, title, linkTo, linkLabel }) => {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: alpha(CR, 0.14), border: `1px solid ${alpha(CR, 0.30)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon sx={{ fontSize: 17, color: CR_LT }} />
        </Box>
        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>
      {linkTo && (
        <Box
          onClick={() => navigate(linkTo)}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: alpha(CR_LT, 0.8), cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, '&:hover': { color: CR_LT } }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'inherit' }}>{linkLabel}</Typography>
          <ArrowForwardIcon sx={{ fontSize: 14 }} />
        </Box>
      )}
    </Box>
  );
};

const Card = ({ children, sx = {} }) => (
  <Box sx={{ bgcolor: alpha('#fff', 0.025), border: `1px solid ${alpha(CR, 0.18)}`, borderRadius: '14px', p: 2.5, height: '100%', ...sx }}>
    {children}
  </Box>
);

const MemberHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState(PLACEHOLDER_LEADERBOARD);
  const defaultGuildId = process.env.REACT_APP_DEFAULT_GUILD_ID || '';

  useEffect(() => {
    if (defaultGuildId) {
      apiService.getLeaderboard(defaultGuildId)
        .then(data => {
          if (data && data.length > 0) {
            setLeaderboard(
              data.slice(0, 5).map((entry, idx) => ({
                rank: idx + 1,
                name: entry.username || entry.user_id,
                score: entry.score || 0,
                roles: entry.role_count || 0,
              }))
            );
          }
        })
        .catch(() => {}); // Keep placeholder on error
    }
  }, [defaultGuildId]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Box sx={{ bgcolor: '#08080f', minHeight: '100%', px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>

      {/* Page greeting */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.03em' }}>
          {greeting()}, {user?.username ?? '...'}
        </Typography>
        <Typography variant="body2" sx={{ color: alpha('#fff', 0.4), mt: 0.5 }}>
          Here's what's happening in Requiem
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* ── Profile sneak ─────────────────────── */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <Box
              onClick={() => navigate('/profile')}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, cursor: 'pointer', textAlign: 'center' }}
            >
              <Avatar
                src={user?.avatar_url}
                sx={{ width: 64, height: 64, border: `2px solid ${alpha(CR, 0.45)}` }}
              >
                {user?.username?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 700 }}>
                  {user?.username}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha('#fff', 0.4) }}>
                  {user?.roles?.length ?? 0} roles assigned
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                {(user?.roles ?? []).slice(0, 4).map((role) => (
                  <Chip
                    key={role.role_id}
                    label={role.role_name}
                    size="small"
                    sx={{
                      bgcolor: alpha(role.color || CR, 0.18),
                      color: role.color || CR_LT,
                      border: `1px solid ${alpha(role.color || CR, 0.35)}`,
                      height: 20,
                      fontSize: '0.68rem',
                      fontWeight: 600,
                    }}
                  />
                ))}
                {(user?.roles?.length ?? 0) > 4 && (
                  <Chip label={`+${user.roles.length - 4}`} size="small" sx={{ bgcolor: alpha('#fff', 0.07), color: alpha('#fff', 0.4), height: 20, fontSize: '0.68rem' }} />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: alpha(CR_LT, 0.8), fontWeight: 600 }}>
                View profile →
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* ── Upcoming events ───────────────────── */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card>
            <SectionHeader icon={CalendarIcon} title="Upcoming Events" linkTo="/events" linkLabel="All events" />
            <Stack spacing={1.5}>
              {PLACEHOLDER_EVENTS.map((ev) => (
                <Box
                  key={ev.id}
                  sx={{ p: 1.5, borderRadius: '10px', bgcolor: alpha('#fff', 0.03), border: `1px solid ${alpha('#fff', 0.06)}` }}
                >
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.3, mb: 0.5 }}>
                    {ev.title}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.35) }}>
                      {ev.date}
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha(CR_LT, 0.85), fontWeight: 600 }}>
                      {ev.spots}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>

        {/* ── Top leaderboard ───────────────────── */}
        <Grid item xs={12} sm={6} lg={2}>
          <Card>
            <SectionHeader icon={TrophyIcon} title="Top Members" linkTo="/leaderboard" linkLabel="Full board" />
            <Stack spacing={1.25}>
              {leaderboard.map((entry) => (
                <Box key={entry.rank} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Typography
                    variant="caption"
                    sx={{ width: 18, color: entry.rank <= 3 ? '#f59e0b' : alpha('#fff', 0.3), fontWeight: 700, textAlign: 'center', flexShrink: 0 }}
                  >
                    {entry.rank}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.3), fontSize: '0.65rem' }}>
                      {entry.score} pts
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>

        {/* ── Latest news ───────────────────────── */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <SectionHeader icon={NewsIcon} title="Latest News" linkTo="/news" linkLabel="All news" />
            <Stack spacing={1.5}>
              {PLACEHOLDER_NEWS.map((post) => (
                <Box
                  key={post.id}
                  sx={{ p: 1.5, borderRadius: '10px', bgcolor: alpha('#fff', 0.025), border: `1px solid ${alpha('#fff', 0.05)}`, cursor: 'pointer', '&:hover': { borderColor: alpha(CR, 0.35) } }}
                  onClick={() => navigate('/news')}
                >
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.3, mb: 0.5 }}>
                    {post.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.4), lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.summary}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.25), display: 'block', mt: 0.75, fontSize: '0.68rem' }}>
                    {post.date}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default MemberHome;
