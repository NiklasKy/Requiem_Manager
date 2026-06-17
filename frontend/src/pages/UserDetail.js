import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Grid,
  Box,
  Alert,
  Avatar,
  Chip,
  Skeleton,
  Breadcrumbs,
  Button,
  Link,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  People as PeopleIcon,
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
  AccessTime as AccessTimeIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { useParams, useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import StatCard from '../components/StatCard';
import ModernPageLayout from '../components/ModernPageLayout';
import ModernCard from '../components/ModernCard';
import { apiService } from '../services/api';
import useThemeColors from '../hooks/useThemeColors';
import { getContrastTextColor, roleColorToHex } from '../utils/colors';
import { formatRelativeTime, formatAbsoluteTime } from '../utils/time';

const UserDetailSkeleton = ({ c }) => (
  <>
    <Box mb={3}><Skeleton variant="rectangular" height={40} width={300} sx={{ borderRadius: 2, bgcolor: c.skeletonBg }} /></Box>
    <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 3, mb: 3, bgcolor: c.skeletonBg }} />
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {[1,2,3,4].map(i => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 4, bgcolor: c.skeletonBg }} />
        </Grid>
      ))}
    </Grid>
    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 3, bgcolor: c.skeletonBg }} />
    <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3, bgcolor: c.skeletonBg }} />
  </>
);

const UserDetail = () => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const guildId = searchParams.get('guild') || process.env.REACT_APP_DEFAULT_GUILD_ID || '123456789012345678';

  const [userStats, setUserStats] = useState(null);
  const [roleHistory, setRoleHistory] = useState([]);
  const [currentRoles, setCurrentRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState(null);
  const c = useThemeColors();

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingRoles(true);
      setError(null);
      const [statsData, historyData, rolesData] = await Promise.all([
        apiService.getUserStats(userId),
        apiService.getRoleHistory(userId, guildId),
        apiService.getUserCurrentRoles(userId, guildId),
      ]);
      setUserStats(statsData);
      setRoleHistory(historyData);
      setCurrentRoles(rolesData);
    } catch (err) {
      setError('Failed to load user data. Please check if the user exists.');
    } finally {
      setLoading(false);
      setLoadingRoles(false);
    }
  }, [userId, guildId]);

  useEffect(() => { loadUserData(); }, [loadUserData]);

  const dname = (userStats && (userStats.display_name || userStats.username)) || ('User ' + userId);

  return (
    <ModernPageLayout>
      {loading ? <UserDetailSkeleton c={c} /> : (
        <>
          {/* Breadcrumbs + Back button */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
            <Breadcrumbs separator={<ChevronRightIcon sx={{ fontSize: '0.9rem', color: c.textMuted }} />}>
              <Link component={RouterLink} to="/users" underline="hover"
                sx={{ color: c.textMuted, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}>
                <PeopleIcon sx={{ fontSize: '0.9rem' }} />Users
              </Link>
              <Typography variant="body2" sx={{ color: c.textSecondary }}>{dname}</Typography>
            </Breadcrumbs>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')} size="small"
              sx={{ color: c.textSecondary, border: `1px solid ${c.cardBorder}`, borderRadius: 2, px: 2, textTransform: 'none', '&:hover': { background: c.cardHoverBg } }}>
              Back to Users
            </Button>
          </Box>

          {error ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
          ) : (
            <>
              {/* User header card */}
              <ModernCard sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
                  <Avatar src={userStats && userStats.avatar_url}
                    sx={{ width: 90, height: 90, background: 'linear-gradient(135deg,#5865f2,#7289da)', border: '3px solid rgba(88,101,242,0.35)', fontSize: '2.2rem', boxShadow: '0 6px 24px rgba(88,101,242,0.3)' }}>
                    {(userStats && userStats.username && userStats.username.charAt(0).toUpperCase()) || '?'}
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="h5" sx={{ color: c.textPrimary, fontWeight: 700, mb: 0.5 }}>{dname}</Typography>
                    <Typography variant="body2" sx={{ color: c.textSecondary, fontFamily: 'monospace', mb: 0.75 }}>
                      @{(userStats && userStats.username) || 'unknown'}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.75}>
                      <BadgeIcon sx={{ fontSize: '0.8rem', color: c.textMuted }} />
                      <Typography variant="caption" sx={{ color: c.textMuted, fontFamily: 'monospace' }}>{userId}</Typography>
                    </Box>
                  </Box>
                  {userStats && userStats.last_activity && (
                    <Box sx={{ p: 2, borderRadius: 2, background: c.subtleBg, border: `1px solid ${c.subtleBorder}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: '0.85rem', color: '#5865f2' }} />
                        <Typography variant="caption" sx={{ color: c.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Last Activity</Typography>
                      </Box>
                      <Tooltip title={formatAbsoluteTime(userStats.last_activity)} placement="bottom" arrow>
                        <Typography variant="body2" sx={{ color: c.textPrimary, fontWeight: 600, cursor: 'default' }}>
                          {formatRelativeTime(userStats.last_activity)}
                        </Typography>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </ModernCard>

              {/* Stats */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Username Changes" value={userStats && userStats.username_changes} icon={<EditIcon />} color="primary" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Nickname Changes" value={userStats && userStats.nickname_changes} icon={<EditIcon />} color="secondary" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Role Changes" value={userStats && userStats.role_changes} icon={<SecurityIcon />} color="warning" /></Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard title="Total Events" icon={<HistoryIcon />} color="info"
                    value={userStats ? ((userStats.username_changes || 0) + (userStats.nickname_changes || 0) + (userStats.role_changes || 0)) : 0} />
                </Grid>
              </Grid>

              {/* Current Roles */}
              <ModernCard sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                  <SecurityIcon sx={{ color: '#5865f2', fontSize: '1.1rem' }} />
                  <Typography variant="h6" sx={{ color: c.textPrimary, fontWeight: 600 }}>Current Roles</Typography>
                  <Chip label={currentRoles.length} size="small" sx={{ background: 'linear-gradient(135deg,#5865f2,#7289da)', color: 'white', fontWeight: 700 }} />
                </Box>
                {loadingRoles ? (
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {[1,2,3,4,5].map(i => <Skeleton key={i} variant="rectangular" width={80} height={32} sx={{ borderRadius: 2, bgcolor: c.skeletonBg }} />)}
                  </Box>
                ) : currentRoles.length === 0 ? (
                  <Typography sx={{ color: c.textMuted, fontStyle: 'italic' }}>No roles assigned</Typography>
                ) : (
                  <Box display="flex" gap={1.5} flexWrap="wrap">
                    {currentRoles.map(role => (
                      <Chip key={role.role_id} label={role.role_name}
                        sx={{ backgroundColor: role.color, color: getContrastTextColor(role.color), fontWeight: 700, fontSize: '0.85rem', height: 34, px: 0.5,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.25)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }} />
                    ))}
                  </Box>
                )}
              </ModernCard>

              {/* Role History */}
              <ModernCard>
                <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                  <HistoryIcon sx={{ color: '#ff9800', fontSize: '1.1rem' }} />
                  <Typography variant="h6" sx={{ color: c.textPrimary, fontWeight: 600 }}>Role History</Typography>
                </Box>
                {roleHistory.length === 0 ? (
                  <Box textAlign="center" py={5}>
                    <Typography sx={{ color: c.textMuted, fontStyle: 'italic' }}>No role changes found for this user</Typography>
                  </Box>
                ) : (
                  <Box>
                    {roleHistory.map((change, index) => {
                      const hex = roleColorToHex(change.role_color);
                      return (
                        <Box key={index} sx={{ py: 1.75, px: 2, mb: 1, borderRadius: 2, background: c.subtleBg, border: `1px solid ${c.subtleBorder}`,
                          transition: 'background 0.2s', '&:hover': { background: c.cardHoverBg },
                          display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1, color: change.action === 'added' ? '#4caf50' : '#f44336' }}>
                            {change.action === 'added' ? '+' : '\u2212'}
                          </Typography>
                          <Chip label={change.role_name || ('Role ' + change.role_id)} size="small"
                            sx={{ backgroundColor: hex, color: getContrastTextColor(hex), fontWeight: 600, fontSize: '0.78rem' }} />
                          <Box flex={1} />
                          <Tooltip title={formatAbsoluteTime(change.timestamp)} placement="top" arrow>
                            <Typography variant="caption" sx={{ color: c.textMuted, fontFamily: 'monospace', fontSize: '0.8rem', cursor: 'default', whiteSpace: 'nowrap' }}>
                              {formatRelativeTime(change.timestamp)}
                            </Typography>
                          </Tooltip>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </ModernCard>
            </>
          )}
        </>
      )}
    </ModernPageLayout>
  );
};

export default UserDetail;
