import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Skeleton,
  useTheme,
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';
import { useParams, useSearchParams } from 'react-router-dom';
import StatCard from '../components/StatCard';
import ModernPageLayout from '../components/ModernPageLayout';
import ModernCard from '../components/ModernCard';
import { apiService } from '../services/api';

const UserDetail = () => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const guildId = searchParams.get('guild') || process.env.REACT_APP_DEFAULT_GUILD_ID || '123456789012345678';

  const [userStats, setUserStats] = useState(null);
  const [roleHistory, setRoleHistory] = useState([]);
  const [currentRoles, setCurrentRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserData();
  }, [userId, guildId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setLoadingRoles(true);
      setError(null);

      const [statsData, historyData, rolesData] = await Promise.all([
        apiService.getUserStats(userId),
        apiService.getRoleHistory(userId, guildId),
        apiService.getUserCurrentRoles(userId, guildId)
      ]);

      setUserStats(statsData);
      setRoleHistory(historyData);
      setCurrentRoles(rolesData);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data. Please check if the user exists.');
    } finally {
      setLoading(false);
      setLoadingRoles(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action) => {
    return action === 'added' ? 'success' : 'error';
  };

  const getActionIcon = (action) => {
    return action === 'added' ? '+' : '-';
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
          <AccountIcon 
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
          User Profile
        </Typography>
        
        <Typography 
          variant="h6" 
          sx={{ 
            color: alpha('#ffffff', 0.8),
            fontWeight: 400
          }}
        >
          Activity & Role History
        </Typography>
      </Box>

      {/* User Header */}
      <ModernCard sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar 
            src={userStats?.avatar_url}
            sx={{ 
              width: 100, 
              height: 100, 
              mr: 4, 
              boxShadow: '0 8px 32px rgba(88, 101, 242, 0.3)',
              border: `3px solid ${alpha('#ffffff', 0.2)}`,
              fontSize: '2.5rem'
            }}
          >
            {userStats?.username?.charAt(0)?.toUpperCase() || '?'}
          </Avatar>
          <Box flex={1}>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{
                color: alpha('#ffffff', 0.95),
                fontWeight: 700,
                mb: 1
              }}
            >
              {userStats?.display_name || userStats?.username || 'Unknown User'}
            </Typography>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: alpha('#ffffff', 0.7),
                fontWeight: 400
              }}
            >
              @{userStats?.username || 'unknown'}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: alpha('#ffffff', 0.6),
                fontFamily: 'monospace'
              }}
            >
              🆔 User ID: {userId}
            </Typography>
          </Box>
        </Box>
        
        {userStats?.last_activity && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              background: alpha('#ffffff', 0.05),
              border: `1px solid ${alpha('#ffffff', 0.1)}`
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: alpha('#ffffff', 0.8),
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              ⏰ Last Activity: {formatTimestamp(userStats.last_activity)}
            </Typography>
          </Box>
        )}
      </ModernCard>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Username Changes"
            value={userStats?.username_changes}
            icon={<EditIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Nickname Changes"
            value={userStats?.nickname_changes}
            icon={<EditIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Role Changes"
            value={userStats?.role_changes}
            icon={<SecurityIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Events"
            value={(userStats?.username_changes || 0) + (userStats?.nickname_changes || 0) + (userStats?.role_changes || 0)}
            icon={<HistoryIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Current Roles */}
      <ModernCard sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: alpha('#ffffff', 0.9),
            fontWeight: 600,
            mb: 3
          }}
        >
          🛡️ Current Roles 
          <Chip 
            label={currentRoles.length} 
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
              color: 'white',
              fontWeight: 600
            }}
          />
        </Typography>
        
        {loadingRoles ? (
          <Box display="flex" gap={1} flexWrap="wrap">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton 
                key={i} 
                variant="rectangular" 
                width={80} 
                height={36} 
                sx={{ 
                  borderRadius: 2,
                  bgcolor: alpha('#ffffff', 0.1) 
                }} 
              />
            ))}
          </Box>
        ) : (
          <Box display="flex" gap={2} flexWrap="wrap">
            {currentRoles.length > 0 ? (
              currentRoles.map((role) => (
                <Chip
                  key={role.role_id}
                  label={role.role_name}
                  sx={{
                    backgroundColor: role.color,
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    height: '36px',
                    px: 1,
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                    },
                    '& .MuiChip-label': {
                      textShadow: '0 1px 2px rgba(0,0,0,0.7)',
                      px: 1
                    },
                    // Better contrast for light colors
                    ...(role.color === '#99aab5' && {
                      color: '#2c2f33',
                      '& .MuiChip-label': {
                        textShadow: 'none',
                      },
                    }),
                  }}
                />
              ))
            ) : (
              <Typography 
                sx={{ 
                  color: alpha('#ffffff', 0.6),
                  fontStyle: 'italic',
                  textAlign: 'center',
                  py: 2
                }}
              >
                No roles assigned 🚫
              </Typography>
            )}
          </Box>
        )}
      </ModernCard>

      {/* Role History */}
      <ModernCard>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: alpha('#ffffff', 0.9),
            fontWeight: 600,
            mb: 3
          }}
        >
          📜 Role History
        </Typography>
        
        {roleHistory.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography 
              sx={{ 
                color: alpha('#ffffff', 0.6),
                fontStyle: 'italic',
                fontSize: '1.1rem'
              }}
            >
              No role changes found for this user 📭
            </Typography>
          </Box>
        ) : (
          <TableContainer 
            sx={{
              background: alpha('#ffffff', 0.03),
              borderRadius: 2,
              border: `1px solid ${alpha('#ffffff', 0.1)}`,
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background: alpha('#ffffff', 0.05),
                    '& .MuiTableCell-head': {
                      color: alpha('#ffffff', 0.9),
                      fontWeight: 600,
                      borderBottom: `1px solid ${alpha('#ffffff', 0.2)}`,
                      fontSize: '1rem'
                    }
                  }}
                >
                  <TableCell>Action</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roleHistory.map((change, index) => (
                  <TableRow 
                    key={index} 
                    sx={{
                      '&:hover': {
                        background: alpha('#ffffff', 0.05)
                      },
                      '& .MuiTableCell-body': {
                        color: alpha('#ffffff', 0.8),
                        borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
                        py: 2
                      }
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={`${getActionIcon(change.action)} ${change.action}`}
                        color={getActionColor(change.action)}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          minWidth: '100px'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography 
                          variant="body2"
                          sx={{ 
                            color: alpha('#ffffff', 0.9),
                            fontWeight: 500
                          }}
                        >
                          {change.role_name || `Role ${change.role_id}`}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ color: alpha('#ffffff', 0.5) }}
                        >
                          (ID: {change.role_id})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: alpha('#ffffff', 0.7),
                          fontFamily: 'monospace'
                        }}
                      >
                        {formatTimestamp(change.timestamp)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </ModernCard>
    </ModernPageLayout>
  );
};

export default UserDetail;
