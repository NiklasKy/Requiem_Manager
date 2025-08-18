import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  People as PeopleIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Security as SecurityIcon,
  Today as TodayIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import StatCard from '../components/StatCard';
import ModernPageLayout from '../components/ModernPageLayout';
import ModernCard from '../components/ModernCard';
import { apiService } from '../services/api';

const Dashboard = () => {
  const [serverStats, setServerStats] = useState(null);
  const [recentChanges, setRecentChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default guild ID - in a real app, this would come from user selection or environment
  const defaultGuildId = process.env.REACT_APP_DEFAULT_GUILD_ID || '123456789012345678';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, changesData] = await Promise.all([
        apiService.getServerStats(defaultGuildId),
        apiService.getRecentChanges(defaultGuildId, 10)
      ]);

      setServerStats(statsData);
      setRecentChanges(changesData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please check if the API is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getChangeTypeColor = (type) => {
    switch (type) {
      case 'username':
        return 'primary';
      case 'nickname':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (loading) {
    return (
      <ModernPageLayout>
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress 
            size={60} 
            sx={{ 
              color: isDark ? '#ffffff' : '#5865f2'
            }}
          />
        </Box>
      </ModernPageLayout>
    );
  }

  if (error) {
    return (
      <ModernPageLayout>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            background: alpha('#f44336', 0.1),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#f44336', 0.3)}`,
            color: isDark ? '#ffffff' : 'inherit'
          }}
        >
          {error}
        </Alert>
      </ModernPageLayout>
    );
  }

  // Sample chart data for demonstration
  const chartData = [
    { name: 'Mon', changes: 12 },
    { name: 'Tue', changes: 19 },
    { name: 'Wed', changes: 8 },
    { name: 'Thu', changes: 15 },
    { name: 'Fri', changes: 22 },
    { name: 'Sat', changes: 18 },
    { name: 'Sun', changes: 14 },
  ];

  return (
    <ModernPageLayout>
      {/* Header */}
      <Box textAlign="center" mb={6}>
        <Box
          sx={{
            display: 'inline-block',
            p: 3,
            borderRadius: '50%',
            background: `linear-gradient(135deg, #5865f2 0%, #7289da 100%)`,
            mb: 3,
            boxShadow: '0 8px 32px rgba(88, 101, 242, 0.3)',
          }}
        >
          <DashboardIcon 
            sx={{ 
              fontSize: 50, 
              color: 'white'
            }} 
          />
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
          Server Dashboard
        </Typography>
        
        <Typography 
          variant="h6" 
          sx={{ 
            color: alpha('#ffffff', 0.8),
            fontWeight: 400
          }}
        >
          Real-time Analytics & User Tracking
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={serverStats?.total_users}
            icon={<PeopleIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Username Changes"
            value={serverStats?.total_username_changes}
            icon={<EditIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Nickname Changes"
            value={serverStats?.total_nickname_changes}
            icon={<EditIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Role Changes"
            value={serverStats?.total_role_changes}
            icon={<SecurityIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* 24h Activity */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="New Members (24h)"
            value={serverStats?.new_members_24h}
            icon={<PersonAddIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Members Left (24h)"
            value={serverStats?.left_members_24h}
            icon={<PersonRemoveIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Name Changes (24h)"
            value={serverStats?.name_changes_24h}
            icon={<TodayIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Activity Chart */}
        <Grid item xs={12} md={8}>
          <ModernCard>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: alpha('#ffffff', 0.9),
                fontWeight: 600,
                mb: 3
              }}
            >
              📊 Weekly Activity
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha('#ffffff', 0.1)} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: alpha('#ffffff', 0.7) }}
                  axisLine={{ stroke: alpha('#ffffff', 0.3) }}
                />
                <YAxis 
                  tick={{ fill: alpha('#ffffff', 0.7) }}
                  axisLine={{ stroke: alpha('#ffffff', 0.3) }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: alpha('#000000', 0.8),
                    border: `1px solid ${alpha('#ffffff', 0.2)}`,
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
                <Bar 
                  dataKey="changes" 
                  fill="url(#barGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
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
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: alpha('#ffffff', 0.9),
                fontWeight: 600,
                mb: 3
              }}
            >
              🕐 Recent Changes
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {recentChanges.length === 0 ? (
                <Typography 
                  sx={{ 
                    textAlign: 'center', 
                    py: 2,
                    color: alpha('#ffffff', 0.6),
                    fontStyle: 'italic'
                  }}
                >
                  No recent changes
                </Typography>
              ) : (
                recentChanges.map((change, index) => (
                  <Box
                    key={index}
                    sx={{
                      py: 2,
                      px: 2,
                      mb: 1,
                      borderRadius: 2,
                      background: alpha('#ffffff', 0.05),
                      border: `1px solid ${alpha('#ffffff', 0.1)}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: alpha('#ffffff', 0.1),
                        transform: 'translateX(4px)',
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip
                        label={change.type}
                        size="small"
                        color={getChangeTypeColor(change.type)}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ color: alpha('#ffffff', 0.7) }}
                      >
                        User {change.user_id}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      noWrap
                      sx={{ 
                        color: alpha('#ffffff', 0.9),
                        fontWeight: 500
                      }}
                    >
                      {change.old_value} → {change.new_value}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ color: alpha('#ffffff', 0.6) }}
                    >
                      {formatTimestamp(change.timestamp)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </ModernCard>
        </Grid>
      </Grid>
    </ModernPageLayout>
  );
};

export default Dashboard;
