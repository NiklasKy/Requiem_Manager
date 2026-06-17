import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CalendarMonth as DaysIcon,
  Shield as RoleIcon,
  TrendingUp as ChangesIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_LABELS = ['1st', '2nd', '3rd'];

const RankBadge = ({ rank }) => {
  if (rank <= 3) {
    return (
      <Box
        sx={{
          width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
          bgcolor: alpha(MEDAL_COLORS[rank - 1], 0.15),
          border: `1px solid ${alpha(MEDAL_COLORS[rank - 1], 0.45)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Typography sx={{ color: MEDAL_COLORS[rank - 1], fontWeight: 800, fontSize: '0.75rem' }}>
          {MEDAL_LABELS[rank - 1]}
        </Typography>
      </Box>
    );
  }
  return (
    <Box
      sx={{
        width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
        bgcolor: alpha('#fff', 0.05),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Typography sx={{ color: alpha('#fff', 0.4), fontWeight: 700, fontSize: '0.75rem' }}>
        #{rank}
      </Typography>
    </Box>
  );
};

const LeaderboardRow = ({ entry, isMe }) => (
  <Box
    sx={{
      p: '12px 16px',
      borderRadius: '12px',
      bgcolor: isMe ? alpha('#5865f2', 0.12) : alpha('#fff', 0.025),
      border: `1px solid ${isMe ? alpha('#5865f2', 0.45) : alpha('#5865f2', 0.12)}`,
      display: 'flex', alignItems: 'center', gap: 1.5,
      transition: 'border-color 0.2s',
      '&:hover': { borderColor: isMe ? alpha('#5865f2', 0.6) : alpha('#5865f2', 0.25) },
    }}
  >
    <RankBadge rank={entry.rank} />

    <Avatar
      src={entry.avatar_url}
      sx={{ width: 36, height: 36, fontSize: '0.85rem', bgcolor: alpha('#5865f2', 0.4), flexShrink: 0 }}
    >
      {(entry.display_name || entry.username)?.charAt(0)?.toUpperCase()}
    </Avatar>

    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.display_name || entry.username}
        </Typography>
        {isMe && (
          <Chip label="You" size="small" sx={{ bgcolor: alpha('#5865f2', 0.25), color: '#7289da', height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 0.25, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35 }}>
          <DaysIcon sx={{ fontSize: 11, color: alpha('#fff', 0.3) }} />
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.35), fontSize: '0.68rem' }}>{entry.days_active}d</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35 }}>
          <RoleIcon sx={{ fontSize: 11, color: alpha('#7289da', 0.5) }} />
          <Typography variant="caption" sx={{ color: alpha('#7289da', 0.6), fontSize: '0.68rem' }}>{entry.role_count} roles</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35 }}>
          <ChangesIcon sx={{ fontSize: 11, color: alpha('#fff', 0.25) }} />
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.3), fontSize: '0.68rem' }}>{entry.role_changes} changes</Typography>
        </Box>
      </Box>
    </Box>

    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
      <Typography variant="body2" sx={{ color: entry.rank <= 3 ? MEDAL_COLORS[entry.rank - 1] : '#7289da', fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem' }}>
        {entry.score.toLocaleString()}
      </Typography>
      <Typography variant="caption" sx={{ color: alpha('#fff', 0.25), fontSize: '0.65rem' }}>pts</Typography>
    </Box>
  </Box>
);

const Leaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getLeaderboard(50)
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myEntry = entries.find(e => e.user_id === String(user?.user_id));

  return (
    <Box
      sx={{
        bgcolor: '#08080f', minHeight: '100%', px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 },
        backgroundImage: `radial-gradient(circle, ${alpha('#5865f2', 0.1)} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }}
    >
      <Box sx={{ maxWidth: 680, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha('#f59e0b', 0.15), border: `1px solid ${alpha('#f59e0b', 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrophyIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              Leaderboard
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.4) }}>
              Top members by activity score
            </Typography>
          </Box>
          {myEntry && (
            <Box sx={{ ml: 'auto', textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.4), fontSize: '0.7rem' }}>Your rank</Typography>
              <Typography variant="body1" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>
                #{myEntry.rank}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Score formula legend */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {[
            { label: 'Days × 2', icon: <DaysIcon sx={{ fontSize: 12 }} />, color: alpha('#fff', 0.3) },
            { label: 'Roles × 50', icon: <RoleIcon sx={{ fontSize: 12 }} />, color: '#7289da' },
            { label: 'Changes × 5', icon: <ChangesIcon sx={{ fontSize: 12 }} />, color: alpha('#fff', 0.3) },
          ].map(s => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Box sx={{ color: s.color }}>{s.icon}</Box>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.35), fontSize: '0.7rem' }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {loading && (
          <Stack spacing={1}>
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={72} sx={{ borderRadius: '12px', bgcolor: alpha('#5865f2', 0.08) }} />
            ))}
          </Stack>
        )}

        {!loading && entries.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <TrophyIcon sx={{ fontSize: 48, color: alpha('#f59e0b', 0.2), mb: 2 }} />
            <Typography variant="body1" sx={{ color: alpha('#fff', 0.4), fontWeight: 600 }}>No data yet</Typography>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.25), mt: 0.5 }}>The leaderboard will populate as members are tracked.</Typography>
          </Box>
        )}

        {!loading && entries.length > 0 && (
          <Stack spacing={1}>
            {entries.map(entry => (
              <LeaderboardRow key={entry.user_id} entry={entry} isMe={entry.user_id === String(user?.user_id)} />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default Leaderboard;
