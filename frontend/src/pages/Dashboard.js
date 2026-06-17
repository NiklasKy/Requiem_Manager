import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Grid,
  Box,
  Skeleton,
  Alert,
  Chip,
  Button,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Security as SecurityIcon,
  Today as TodayIcon,
  BarChart as BarChartIcon,
  AccessTime as AccessTimeIcon,
  Label as LabelIcon,
  AlternateEmail as UsernameIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import StatCard from '../components/StatCard';
import ModernPageLayout from '../components/ModernPageLayout';
import ModernCard from '../components/ModernCard';
import { apiService } from '../services/api';
import useThemeColors from '../hooks/useThemeColors';
import { getContrastTextColor, getChangeTypeChipSx, roleColorToHex } from '../utils/colors';
import { formatRelativeTime, formatAbsoluteTime } from '../utils/time';

const CHANGE_TYPE_ICONS = {
  username: <UsernameIcon sx={{ fontSize: '0.9rem' }} />,
  nickname: <LabelIcon sx={{ fontSize: '0.9rem' }} />,
  role:     <SecurityIcon sx={{ fontSize: '0.9rem' }} />,
};

const DashboardSkeleton = ({ colors }) => (
  <>
    <Box mb={4}>
      <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, bgcolor: colors.skeletonBg, mb: 3 }} />
    </Box>
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {[1,2,3,4].map(i => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 4, bgcolor: colors.skeletonBg }} />
        </Grid>
      ))}
    </Grid>
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Skeleton variant="rectangular" height={340} sx={{ borderRadius: 3, bgcolor: colors.skeletonBg }} />
      </Grid>
      <Grid item xs={12} md={4}>
        <Skeleton variant="rectangular" height={340} sx={{ borderRadius: 3, bgcolor: colors.skeletonBg }} />
      </Grid>
    </Grid>
  </>
);

const Dashboard = () => {
  const [serverStats, setServerStats] = useState(null);
  const [recentChanges, setRecentChanges] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const colors = useThemeColors();

  const defaultGuildId = process.env.REACT_APP_DEFAULT_GUILD_ID || '123456789012345678';

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, changesData, weeklyData] = await Promise.all([
        apiService.getServerStats(defaultGuildId),
        apiService.getRecentChanges(defaultGuildId, 10),
        apiService.getWeeklyActivity(defaultGuildId),
      ]);
      setServerStats(statsData);
      setRecentChanges(changesData);
      setWeeklyActivity(weeklyData);
    } catch (err) {
      setError('Failed to load dashboard data. Please check if the API is running.');
    } finally {
      setLoading(false);
    }
  }, [defaultGuildId]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const handleUserClick = (userId) => navigate(`/users/${String(userId)}?guild=${defaultGuildId}`);
  const handleViewOwnProfile = () => { if (user?.user_id) navigate(`/users/${user.user_id}?guild=${defaultGuildId}`); };

  const chartData = weeklyActivity.length > 0 ? weeklyActivity : [
    { name: 'Sun', changes: 0 }, { name: 'Mon', changes: 0 }, { name: 'Tue', changes: 0 },
    { name: 'Wed', changes: 0 }, { name: 'Thu', changes: 0 }, { name: 'Fri', changes: 0 },
    { name: 'Sat', changes: 0 },
  ];

  return (
    <ModernPageLayout>
      {loading ? (
        <DashboardSkeleton colors={colors} />
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
      ) : (
        <>
          {/* Welcome strip — replaces generic centered hero */}
          {user && (
            <ModernCard sx={{ mb: 4 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    src={user.avatar_url}
                    sx={{ width: 52, height: 52, border: `2px solid rgba(88,101,242,0.4)` }}
                  >
                    {user.username?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
                      Welcome back, {user.username}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textMuted }}>
                      Server Dashboard · Real-time analytics
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  onClick={handleViewOwnProfile}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(88,101,242,0.3)',
                    '&:hover': { background: 'linear-gradient(135deg, #4752c4 0%, #5b6bb0 100%)' },
                  }}
                >
                  My Profile
                </Button>
              </Box>
            </ModernCard>
          )}

          {/* Primary stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Total Users" value={serverStats?.total_users} icon={<PeopleIcon />} color="primary" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Username Changes" value={serverStats?.total_username_changes} icon={<EditIcon />} color="secondary" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Nickname Changes" value={serverStats?.total_nickname_changes} icon={<EditIcon />} color="info" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Role Changes" value={serverStats?.total_role_changes} icon={<SecurityIcon />} color="warning" />
            </Grid>
          </Grid>

          {/* 24h stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <StatCard title="New Members (24h)" value={serverStats?.new_members_24h} icon={<PersonAddIcon />} color="success" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard title="Members Left (24h)" value={serverStats?.left_members_24h} icon={<PersonRemoveIcon />} color="error" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard title="Name Changes (24h)" value={serverStats?.name_changes_24h} icon={<TodayIcon />} color="info" />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Weekly Activity Chart */}
            <Grid item xs={12} md={8}>
              <ModernCard>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <BarChartIcon sx={{ color: '#5865f2', fontSize: '1.2rem' }} />
                  <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
                    Weekly Activity
                  </Typography>
                </Box>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.subtleBorder} />
                    <XAxis dataKey="name" tick={{ fill: colors.textMuted, fontSize: 12 }} axisLine={{ stroke: colors.cardBorder }} />
                    <YAxis tick={{ fill: colors.textMuted, fontSize: 12 }} axisLine={{ stroke: colors.cardBorder }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: colors.isDark ? 'rgba(26,26,26,0.95)' : '#ffffff',
                        border: `1px solid ${colors.cardBorder}`,
                        borderRadius: 8,
                        color: colors.textPrimary,
                      }}
                    />
                    <Bar dataKey="changes" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5865f2" />
                        <stop offset="100%" stopColor="#7289da" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </ModernCard>
            </Grid>

            {/* Recent Changes */}
            <Grid item xs={12} md={4}>
              <ModernCard>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <AccessTimeIcon sx={{ color: '#5865f2', fontSize: '1.2rem' }} />
                  <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
                    Recent Changes
                  </Typography>
                </Box>
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {recentChanges.length === 0 ? (
                    <Typography sx={{ color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                      No recent changes
                    </Typography>
                  ) : (
                    recentChanges.map((change, index) => (
                      <Box
                        key={index}
                        sx={{
                          py: 1.5,
                          px: 1.5,
                          mb: 1,
                          borderRadius: 2,
                          background: colors.subtleBg,
                          border: `1px solid ${colors.subtleBorder}`,
                          transition: 'background 0.2s',
                          '&:hover': { background: colors.cardHoverBg },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Chip
                            label={change.type}
                            size="small"
                            icon={CHANGE_TYPE_ICONS[change.type]}
                            sx={getChangeTypeChipSx(change.type)}
                          />
                          <Typography
                            variant="body2"
                            onClick={() => handleUserClick(change.user_id)}
                            sx={{ color: colors.textPrimary, fontWeight: 600, cursor: 'pointer', '&:hover': { color: '#5865f2', textDecoration: 'underline' } }}
                          >
                            {change.display_name || change.username || `User ${change.user_id}`}
                          </Typography>
                        </Box>

                        {change.type === 'role' ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ fontWeight: 'bold', color: change.action === 'added' ? '#4caf50' : '#f44336', fontSize: '1rem' }}>
                              {change.action === 'added' ? '+' : '−'}
                            </Typography>
                            <Chip
                              label={change.role_name}
                              size="small"
                              sx={{
                                backgroundColor: roleColorToHex(change.role_color),
                                color: getContrastTextColor(roleColorToHex(change.role_color)),
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Box component="span" sx={{ textDecoration: 'line-through', color: colors.textMuted, mr: 0.5 }}>{change.old_value || '(none)'}</Box>
                            {'→ '}
                            <Box component="span" sx={{ fontWeight: 600, color: colors.textPrimary }}>{change.new_value || '(none)'}</Box>
                          </Typography>
                        )}

                        <Tooltip title={formatAbsoluteTime(change.timestamp)} placement="top" arrow>
                          <Typography variant="caption" sx={{ color: colors.textMuted, display: 'block', mt: 0.5, cursor: 'default' }}>
                            {formatRelativeTime(change.timestamp)}
                          </Typography>
                        </Tooltip>
                      </Box>
                    ))
                  )}
                </Box>
              </ModernCard>
            </Grid>
          </Grid>
        </>
      )}
    </ModernPageLayout>
  );
};

export default Dashboard;
