import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  alpha,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Event as EventIcon,
  AccessTime as TimeIcon,
  Groups as GroupsIcon,
  SportsEsports as GameIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api';

const formatEventDate = (timestamp) => {
  if (!timestamp) return 'TBD';
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
  return date.toLocaleString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const getDaysUntil = (timestamp) => {
  if (!timestamp) return null;
  const eventDate = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
  const diff = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
};

const EventCard = ({ event }) => {
  const startTime = event.startTime || event.start_time || event.date;
  const daysUntil = getDaysUntil(startTime);
  const isToday = daysUntil === 'Today';
  const isTomorrow = daysUntil === 'Tomorrow';
  const signups = event.signUps || event.signups || event.participants || [];
  const signupCount = Array.isArray(signups) ? signups.length : (signups || 0);
  const maxSize = event.advancedSettings?.limit || event.maxSize || event.limit || null;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '14px',
        bgcolor: alpha('#fff', 0.03),
        border: `1px solid ${isToday ? alpha('#22c55e', 0.4) : isTomorrow ? alpha('#f59e0b', 0.3) : alpha('#5865f2', 0.18)}`,
        transition: 'border-color 0.2s, background 0.2s',
        '&:hover': {
          bgcolor: alpha('#5865f2', 0.05),
          borderColor: isToday ? alpha('#22c55e', 0.6) : alpha('#5865f2', 0.35),
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
            {daysUntil && (
              <Chip
                label={daysUntil}
                size="small"
                sx={{
                  bgcolor: isToday ? alpha('#22c55e', 0.15) : isTomorrow ? alpha('#f59e0b', 0.15) : alpha('#5865f2', 0.15),
                  color: isToday ? '#22c55e' : isTomorrow ? '#f59e0b' : '#7289da',
                  border: `1px solid ${isToday ? alpha('#22c55e', 0.3) : isTomorrow ? alpha('#f59e0b', 0.3) : alpha('#5865f2', 0.3)}`,
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                }}
              />
            )}
            {event.softReserveId && (
              <Chip label="Raid-Helper" size="small" sx={{ bgcolor: alpha('#5865f2', 0.1), color: alpha('#7289da', 0.8), height: 20, fontSize: '0.65rem' }} />
            )}
          </Box>
          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.3, mb: 0.5 }}>
            {event.title || event.name || 'Untitled Event'}
          </Typography>
          {event.description && (
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.45), lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {event.description}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flexShrink: 0 }}>
          {startTime && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimeIcon sx={{ fontSize: 13, color: alpha('#fff', 0.35) }} />
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.5), fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {formatEventDate(startTime)}
              </Typography>
            </Box>
          )}
          {(signupCount > 0 || maxSize) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <GroupsIcon sx={{ fontSize: 13, color: alpha('#7289da', 0.6) }} />
              <Typography variant="caption" sx={{ color: alpha('#7289da', 0.8), fontWeight: 600, fontSize: '0.75rem' }}>
                {signupCount}{maxSize ? ` / ${maxSize}` : ''}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiService.getEvents()
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(e => setError(e.response?.data?.detail || 'Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box
      sx={{
        bgcolor: '#08080f', minHeight: '100%', px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 },
        backgroundImage: `radial-gradient(circle, ${alpha('#5865f2', 0.1)} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }}
    >
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha('#5865f2', 0.15), border: `1px solid ${alpha('#5865f2', 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EventIcon sx={{ fontSize: 20, color: '#7289da' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              Events
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.4) }}>
              Upcoming Raid-Helper events
            </Typography>
          </Box>
        </Box>

        {loading && (
          <Stack spacing={1.5}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: '14px', bgcolor: alpha('#5865f2', 0.1) }} />
            ))}
          </Stack>
        )}

        {error && (
          <Alert severity="info" sx={{ bgcolor: alpha('#5865f2', 0.1), color: alpha('#fff', 0.7), border: `1px solid ${alpha('#5865f2', 0.2)}`, borderRadius: '12px', '& .MuiAlert-icon': { color: '#7289da' } }}>
            {error === 'Failed to load events' ? 'Could not load events from Raid-Helper. Make sure RAIDHELPER_API_KEY is configured.' : error}
          </Alert>
        )}

        {!loading && !error && events.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <EventIcon sx={{ fontSize: 48, color: alpha('#5865f2', 0.25), mb: 2 }} />
            <Typography variant="body1" sx={{ color: alpha('#fff', 0.4), fontWeight: 600 }}>No upcoming events</Typography>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.25), mt: 0.5 }}>Events will appear here once they are scheduled in Raid-Helper.</Typography>
          </Box>
        )}

        {!loading && !error && events.length > 0 && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <GameIcon sx={{ fontSize: 15, color: alpha('#5865f2', 0.6) }} />
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.4), textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
                {events.length} event{events.length !== 1 ? 's' : ''} scheduled
              </Typography>
            </Box>
            <Stack spacing={1.5}>
              {events.map((event, i) => (
                <EventCard key={event.id || i} event={event} />
              ))}
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Events;
