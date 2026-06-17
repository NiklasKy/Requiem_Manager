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

const CR    = '#c0392b';
const CR_LT = '#e74c3c';

/** Returns a human-readable relative time string from an ISO date string. */
function relativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  if (isNaN(diff)) return '';
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);
  if (minutes < 60)  return `${minutes}m ago`;
  if (hours   < 24)  return `${hours}h ago`;
  if (days    < 7)   return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Formats a Unix-seconds timestamp into a short weekday + time string. */
function formatEventDate(startTime) {
  if (!startTime || typeof startTime !== 'number') return '';
  try {
    return new Date(startTime * 1000).toLocaleString('en-GB', {
      weekday: 'short',
      hour:    '2-digit',
      minute:  '2-digit',
    });
  } catch {
    return '';
  }
}

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

const EmptyState = ({ message }) => (
  <Typography variant="caption" sx={{ color: alpha('#fff', 0.3), display: 'block', textAlign: 'center', py: 1 }}>
    {message}
  </Typography>
);

const LoadingState = () => (
  <Typography variant="caption" sx={{ color: alpha('#fff', 0.3), display: 'block', textAlign: 'center', py: 1 }}>
    Loading...
  </Typography>
);

const MemberHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading,     setLoading]     = useState(true);
  const [events,      setEvents]      = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [news,        setNews]        = useState([]);

  useEffect(() => {
    Promise.allSettled([
      apiService.getLeaderboard(5),
      apiService.getEvents(),
      apiService.getNews(3),
    ]).then(([lbResult, evResult, newsResult]) => {

      // ── Leaderboard ──────────────────────────────────────────────
      if (lbResult.status === 'fulfilled' && Array.isArray(lbResult.value)) {
        setLeaderboard(
          lbResult.value.slice(0, 5).map((entry, idx) => ({
            rank:  idx + 1,
            name:  entry.display_name || entry.username || entry.user_id,
            score: Math.round((entry.score ?? 0) * 10) / 10,
          }))
        );
      }

      // ── Events ───────────────────────────────────────────────────
      if (evResult.status === 'fulfilled' && Array.isArray(evResult.value)) {
        setEvents(
          evResult.value.slice(0, 3).map((ev) => {
            const signedUpCount = ev.signups?.signedUpCount ?? ev.signUpCount;
            const maxSize       = ev.signups?.maxSize       ?? ev.size;
            const spots = (signedUpCount != null && maxSize != null)
              ? `${signedUpCount} / ${maxSize}`
              : '';
            return {
              id:    ev.id,
              title: ev.title || 'Unnamed Event',
              date:  formatEventDate(ev.startTime),
              spots,
            };
          })
        );
      }

      // ── News ─────────────────────────────────────────────────────
      if (newsResult.status === 'fulfilled' && Array.isArray(newsResult.value)) {
        setNews(
          newsResult.value.map((post) => ({
            id:      post.id,
            title:   post.title || 'Untitled',
            summary: post.content ? post.content.slice(0, 140) : '',
            date:    relativeTime(post.posted_at),
          }))
        );
      }

      setLoading(false);
    });
  }, []);

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
            {loading ? (
              <LoadingState />
            ) : events.length === 0 ? (
              <EmptyState message="No upcoming events" />
            ) : (
              <Stack spacing={1.5}>
                {events.map((ev) => (
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
                      {ev.spots && (
                        <Typography variant="caption" sx={{ color: alpha(CR_LT, 0.85), fontWeight: 600 }}>
                          {ev.spots}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Card>
        </Grid>

        {/* ── Top leaderboard ───────────────────── */}
        <Grid item xs={12} sm={6} lg={2}>
          <Card>
            <SectionHeader icon={TrophyIcon} title="Top Members" linkTo="/leaderboard" linkLabel="Full board" />
            {loading ? (
              <LoadingState />
            ) : leaderboard.length === 0 ? (
              <EmptyState message="No data available" />
            ) : (
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
            )}
          </Card>
        </Grid>

        {/* ── Latest news ───────────────────────── */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <SectionHeader icon={NewsIcon} title="Latest News" linkTo="/news" linkLabel="All news" />
            {loading ? (
              <LoadingState />
            ) : news.length === 0 ? (
              <EmptyState message="No news yet" />
            ) : (
              <Stack spacing={1.5}>
                {news.map((post) => (
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
            )}
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default MemberHome;
