import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Button,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Storage as StorageIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import StatCard from '../components/StatCard';
import ModernPageLayout from '../components/ModernPageLayout';
import ModernCard from '../components/ModernCard';
import { apiService } from '../services/api';

const AdminPanel = () => {
  const [databaseStats, setDatabaseStats] = useState(null);
  const [apiInfo, setApiInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dbStats, apiData] = await Promise.all([
        apiService.getDatabaseStats(),
        apiService.getApiInfo()
      ]);

      setDatabaseStats(dbStats);
      setApiInfo(apiData);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('Failed to load admin data. Please check if the API is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
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

  return (
    <ModernPageLayout>
      {/* Header */}
      <Box textAlign="center" mb={6}>
        <Box
          sx={{
            display: 'inline-block',
            p: 3,
            borderRadius: '50%',
            background: `linear-gradient(135deg, #f44336 0%, #ff7043 100%)`,
            mb: 3,
            boxShadow: '0 8px 32px rgba(244, 67, 54, 0.3)',
          }}
        >
          <AdminIcon 
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
          Admin Panel
        </Typography>
        
        <Typography 
          variant="h6" 
          sx={{ 
            color: alpha('#ffffff', 0.8),
            fontWeight: 400,
            mb: 3
          }}
        >
          System Management & Monitoring
        </Typography>

        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
          sx={{
            background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
            boxShadow: '0 4px 15px rgba(88, 101, 242, 0.4)',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 3,
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #4752c4 0%, #5865f2 100%)',
              boxShadow: '0 6px 20px rgba(88, 101, 242, 0.5)',
              transform: 'translateY(-2px)',
            },
            '&:disabled': {
              background: alpha('#666666', 0.3),
              color: alpha('#ffffff', 0.5),
            }
          }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4,
            background: alpha('#f44336', 0.1),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#f44336', 0.3)}`,
            color: isDark ? '#ffffff' : 'inherit',
            borderRadius: 3
          }}
        >
          {error}
        </Alert>
      )}

      {/* Database Statistics */}
      <ModernCard sx={{ mb: 4 }}>
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            color: alpha('#ffffff', 0.9),
            fontWeight: 600,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          📊 Database Statistics
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Total Users"
              value={databaseStats?.user_count}
              icon={<StorageIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Username Changes"
              value={databaseStats?.username_changes}
              icon={<StorageIcon />}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Nickname Changes"
              value={databaseStats?.nickname_changes}
              icon={<StorageIcon />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Role Changes"
              value={databaseStats?.role_changes}
              icon={<StorageIcon />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Join/Leave Events"
              value={databaseStats?.join_leave_events}
              icon={<StorageIcon />}
              color="success"
            />
          </Grid>
        </Grid>
      </ModernCard>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* API Information */}
        <Grid item xs={12} md={6}>
          <ModernCard>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: alpha('#ffffff', 0.9),
                fontWeight: 600,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              🔧 API Information
            </Typography>
            
            {apiInfo ? (
              <Box>
                <Box 
                  sx={{ 
                    p: 2, 
                    mb: 2,
                    borderRadius: 2,
                    background: alpha('#ffffff', 0.05),
                    border: `1px solid ${alpha('#ffffff', 0.1)}`
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 1, 
                      color: alpha('#ffffff', 0.8),
                      fontFamily: 'monospace'
                    }}
                  >
                    <strong>📦 Version:</strong> {apiInfo.version}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 1, 
                      color: alpha('#ffffff', 0.8)
                    }}
                  >
                    <strong>💬 Message:</strong> {apiInfo.message}
                  </Typography>
                </Box>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 2, 
                    color: alpha('#ffffff', 0.9),
                    fontWeight: 600
                  }}
                >
                  🌐 Available Endpoints:
                </Typography>
                
                <Box 
                  sx={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    background: alpha('#000000', 0.2),
                    borderRadius: 2,
                    p: 2
                  }}
                >
                  {apiInfo.endpoints && Object.entries(apiInfo.endpoints).map(([name, endpoint]) => (
                    <Box 
                      key={name} 
                      sx={{ 
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        background: alpha('#ffffff', 0.05),
                        '&:hover': {
                          background: alpha('#ffffff', 0.1),
                        }
                      }}
                    >
                      <Typography 
                        variant="body2"
                        sx={{ color: alpha('#ffffff', 0.9) }}
                      >
                        <strong>{name}:</strong> 
                        <Box 
                          component="code" 
                          sx={{ 
                            ml: 1,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            background: alpha('#5865f2', 0.2),
                            color: '#ffffff',
                            fontSize: '0.8rem'
                          }}
                        >
                          {endpoint}
                        </Box>
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography 
                sx={{ 
                  color: alpha('#ffffff', 0.6),
                  fontStyle: 'italic',
                  textAlign: 'center',
                  py: 4
                }}
              >
                API information not available 📡
              </Typography>
            )}
          </ModernCard>
        </Grid>

        {/* System Status */}
        <Grid item xs={12} md={6}>
          <ModernCard>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: alpha('#ffffff', 0.9),
                fontWeight: 600,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              ⚡ System Status
            </Typography>
            
            <Box>
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={2}
                sx={{
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
                    fontWeight: 500
                  }}
                >
                  🗄️ Database Connection
                </Typography>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: databaseStats ? '#4caf50' : '#f44336',
                    boxShadow: `0 0 10px ${databaseStats ? '#4caf50' : '#f44336'}`,
                    animation: databaseStats ? 'pulse 2s infinite' : 'none'
                  }}
                />
              </Box>
              
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={2}
                sx={{
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
                    fontWeight: 500
                  }}
                >
                  🌐 API Status
                </Typography>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: apiInfo ? '#4caf50' : '#f44336',
                    boxShadow: `0 0 10px ${apiInfo ? '#4caf50' : '#f44336'}`,
                    animation: apiInfo ? 'pulse 2s infinite' : 'none'
                  }}
                />
              </Box>

              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={3}
                sx={{
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
                    fontWeight: 500
                  }}
                >
                  📊 Data Collection
                </Typography>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: (databaseStats?.user_count || 0) > 0 ? '#4caf50' : '#ff9800',
                    boxShadow: `0 0 10px ${(databaseStats?.user_count || 0) > 0 ? '#4caf50' : '#ff9800'}`,
                    animation: (databaseStats?.user_count || 0) > 0 ? 'pulse 2s infinite' : 'none'
                  }}
                />
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: alpha('#000000', 0.2),
                  textAlign: 'center'
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: alpha('#ffffff', 0.6),
                    fontFamily: 'monospace'
                  }}
                >
                  ⏰ Last updated: {new Date().toLocaleString()}
                </Typography>
              </Box>

              <Box mt={3}>
                <Button 
                  fullWidth
                  variant="contained"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{
                    background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                    '&:disabled': {
                      background: alpha('#666666', 0.3),
                      color: alpha('#ffffff', 0.5),
                    }
                  }}
                >
                  🔍 Check Status
                </Button>
              </Box>
            </Box>
          </ModernCard>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <ModernCard sx={{ mt: 4 }}>
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            color: alpha('#ffffff', 0.9),
            fontWeight: 600,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          🚀 Quick Actions
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Button 
              variant="outlined" 
              disabled
              fullWidth
              sx={{
                py: 2,
                borderColor: alpha('#ffffff', 0.3),
                color: alpha('#ffffff', 0.5),
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  borderColor: alpha('#ffffff', 0.5),
                  background: alpha('#ffffff', 0.05),
                }
              }}
            >
              📦 Export Data (Coming Soon)
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              variant="outlined" 
              disabled
              fullWidth
              sx={{
                py: 2,
                borderColor: alpha('#ffffff', 0.3),
                color: alpha('#ffffff', 0.5),
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  borderColor: alpha('#ffffff', 0.5),
                  background: alpha('#ffffff', 0.05),
                }
              }}
            >
              🧹 Cleanup Old Records (Coming Soon)
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              variant="outlined" 
              disabled
              fullWidth
              sx={{
                py: 2,
                borderColor: alpha('#ffffff', 0.3),
                color: alpha('#ffffff', 0.5),
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  borderColor: alpha('#ffffff', 0.5),
                  background: alpha('#ffffff', 0.05),
                }
              }}
            >
              📊 Generate Report (Coming Soon)
            </Button>
          </Grid>
        </Grid>
      </ModernCard>

      <Alert 
        severity="info" 
        sx={{ 
          mt: 4,
          background: alpha('#2196f3', 0.1),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#2196f3', 0.3)}`,
          color: isDark ? '#ffffff' : 'inherit',
          borderRadius: 3
        }}
      >
        <Typography variant="body2">
          🛡️ This is the admin panel for the Requiem Tracking system. 
          Here you can monitor system health, view database statistics, and perform administrative tasks.
        </Typography>
      </Alert>
    </ModernPageLayout>
  );
};

export default AdminPanel;
