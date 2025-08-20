import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Grid,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  IconButton,
  Skeleton,
  useTheme,
  alpha,
  InputAdornment,
  Card,
  CardContent
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Visibility as VisibilityIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import ModernPageLayout from '../components/ModernPageLayout';
import ModernCard from '../components/ModernCard';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [bulkRoles, setBulkRoles] = useState({});
  const [loadingRoles, setLoadingRoles] = useState(false);
  const navigate = useNavigate();

  // Default guild ID - in a real app, this would come from user selection
  const defaultGuildId = process.env.REACT_APP_DEFAULT_GUILD_ID || '123456789012345678';

  // Debounce search query to avoid API spam (500ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getGuildUsers(defaultGuildId);
      setUsers(data);
      
      // Load roles for all users in bulk
      await loadBulkRoles(data);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please check if the API is running.');
    } finally {
      setLoading(false);
    }
  }, [defaultGuildId]);

  const loadBulkRoles = useCallback(async (usersData) => {
    try {
      setLoadingRoles(true);
      const userIds = usersData.map(user => user.user_id);
      
      // Split into chunks to avoid URL length limits
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < userIds.length; i += chunkSize) {
        chunks.push(userIds.slice(i, i + chunkSize));
      }
      
      const allRoles = {};
      for (const chunk of chunks) {
        const rolesData = await apiService.getBulkUserRoles(chunk, defaultGuildId);
        Object.assign(allRoles, rolesData);
      }
      
      setBulkRoles(allRoles);
    } catch (err) {
      console.error('Error loading bulk roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  }, [defaultGuildId]);

  const searchUsers = useCallback(async () => {
    try {
      setSearching(true);
      const data = await apiService.searchUsers(debouncedSearchQuery, defaultGuildId);
      setSearchResults(data);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  }, [debouncedSearchQuery, defaultGuildId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, searchUsers]);

  const handleUserClick = (userId) => {
    // Ensure userId is treated as string to prevent precision loss
    const userIdStr = String(userId);
    navigate(`/users/${userIdStr}?guild=${defaultGuildId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const UserCardWithRoles = ({ user, showGuildInfo = true }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Get roles from bulk data instead of individual API calls
    const roles = showGuildInfo ? (bulkRoles[user.user_id] || []) : [];
    const isLoadingRoles = loadingRoles;

    return (
      <Box
        sx={{
          height: '100%',
          position: 'relative',
          background: isDark
            ? alpha('#1a1a1a', 0.8)
            : alpha('#ffffff', 0.25),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(isDark ? '#ffffff' : '#ffffff', 0.2)}`,
          borderRadius: 4,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 12px 40px rgba(88, 101, 242, 0.4)',
            border: `1px solid ${alpha('#5865f2', 0.4)}`,
            '& .user-avatar': {
              boxShadow: '0 8px 25px rgba(88, 101, 242, 0.5)',
              transform: 'scale(1.05)',
            },
            '& .view-icon': {
              color: '#5865f2',
              transform: 'scale(1.1)',
            }
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.1)}, transparent)`,
            transition: 'left 0.5s',
          },
          '&:hover::before': {
            left: '100%',
          }
        }}
        onClick={() => handleUserClick(user.user_id)}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header with Avatar and User Info */}
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar 
              src={user.avatar_url} 
              className="user-avatar"
              sx={{ 
                width: 60, 
                height: 60, 
                mr: 3,
                background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
                border: `3px solid ${alpha('#ffffff', 0.2)}`,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(88, 101, 242, 0.3)',
              }}
            >
              {user.username?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
            <Box flex={1} sx={{ minWidth: 0 }}>
              <Typography 
                variant="h6" 
                noWrap
                sx={{
                  color: alpha('#ffffff', 0.95),
                  fontWeight: 700,
                  mb: 0.5,
                  fontSize: '1.1rem'
                }}
              >
                {user.display_name || user.username}
              </Typography>
              <Typography 
                variant="body2" 
                noWrap
                sx={{ 
                  color: alpha('#ffffff', 0.7),
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}
              >
                @{user.username}
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              className="view-icon"
              sx={{
                color: alpha('#ffffff', 0.7),
                transition: 'all 0.3s ease',
                p: 1
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Box>

          {/* Nickname Badge */}
          {showGuildInfo && user.nickname && (
            <Box mb={2}>
              <Chip 
                label={`🏷️ ${user.nickname}`} 
                size="small" 
                sx={{
                  background: alpha('#9c27b0', 0.2),
                  border: `1px solid ${alpha('#9c27b0', 0.4)}`,
                  color: alpha('#ffffff', 0.9),
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  '&:hover': {
                    background: alpha('#9c27b0', 0.3),
                  }
                }}
              />
            </Box>
          )}

          {/* Roles Section */}
          {showGuildInfo && (
            <Box mb={3} flex={1}>
                                      <Typography 
                          variant="caption" 
                          sx={{ 
                            mb: 1.5, 
                            display: 'block',
                            color: alpha('#ffffff', 0.8),
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          🛡️ Roles ({roles.length})
                        </Typography>
                        {isLoadingRoles ? (
                <Box display="flex" gap={1} flexWrap="wrap">
                  {[1, 2, 3].map((i) => (
                    <Skeleton 
                      key={i} 
                      variant="rectangular" 
                      width={70} 
                      height={28} 
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: alpha('#ffffff', 0.1)
                      }} 
                    />
                  ))}
                </Box>
              ) : (
                <Box display="flex" gap={1} flexWrap="wrap" sx={{ maxHeight: 80, overflow: 'hidden' }}>
                  {roles.length > 0 ? (
                    roles.slice(0, 4).map((role) => (
                      <Chip
                        key={role.role_id}
                        label={role.role_name}
                        size="small"
                        sx={{ 
                          fontSize: '0.75rem', 
                          height: '28px',
                          px: 1,
                          backgroundColor: role.color || '#99aab5',
                          color: role.color === '#99aab5' ? '#2c2f33' : '#ffffff',
                          fontWeight: 'bold',
                          borderRadius: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          },
                          '& .MuiChip-label': {
                            textShadow: role.color === '#99aab5' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                            px: 1
                          },
                        }}
                      />
                    ))
                  ) : (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: alpha('#ffffff', 0.6),
                        fontStyle: 'italic'
                      }}
                    >
                      No roles assigned
                    </Typography>
                  )}
                  {roles.length > 4 && (
                    <Chip
                      label={`+${roles.length - 4}`}
                      size="small"
                      sx={{ 
                        fontSize: '0.75rem', 
                        height: '28px',
                        backgroundColor: alpha('#ffffff', 0.1),
                        border: `1px solid ${alpha('#ffffff', 0.3)}`,
                        color: alpha('#ffffff', 0.8),
                        fontWeight: 600,
                        borderRadius: 2,
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* Footer with Join Date */}
          <Box
            sx={{
              pt: 2,
              borderTop: `1px solid ${alpha('#ffffff', 0.1)}`,
              mt: 'auto'
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: alpha('#ffffff', 0.7),
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              {showGuildInfo ? '📅 Joined' : '👁️ Last seen'}: {formatDate(showGuildInfo ? user.joined_at : user.last_seen)}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
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
            background: `linear-gradient(135deg, #5865f2 0%, #7289da 100%)`,
            mb: 3,
            boxShadow: '0 8px 32px rgba(88, 101, 242, 0.3)',
          }}
        >
          <PeopleIcon 
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
          User Directory
        </Typography>
        
        <Typography 
          variant="h6" 
          sx={{ 
            color: alpha('#ffffff', 0.8),
            fontWeight: 400
          }}
        >
          Explore guild members & their activity
        </Typography>
      </Box>

      {/* Search Box */}
      <ModernCard sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="🔍 Search users by username, display name, nickname, or role name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: alpha('#ffffff', 0.05),
              border: `1px solid ${alpha('#ffffff', 0.2)}`,
              borderRadius: 2,
              color: alpha('#ffffff', 0.9),
              '&:hover': {
                backgroundColor: alpha('#ffffff', 0.08),
              },
              '&.Mui-focused': {
                backgroundColor: alpha('#ffffff', 0.1),
                borderColor: '#5865f2',
                boxShadow: '0 0 20px rgba(88, 101, 242, 0.3)',
              }
            },
            '& .MuiOutlinedInput-input': {
              color: alpha('#ffffff', 0.9),
              fontSize: '1.1rem',
              '&::placeholder': {
                color: alpha('#ffffff', 0.6),
                opacity: 1,
              }
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: alpha('#ffffff', 0.6) }} />
              </InputAdornment>
            ),
            endAdornment: searching && (
              <InputAdornment position="end">
                <CircularProgress size={20} sx={{ color: '#5865f2' }} />
              </InputAdornment>
            )
          }}
        />
      </ModernCard>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4,
            background: alpha('#f44336', 0.1),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#f44336', 0.3)}`,
            color: isDark ? '#ffffff' : 'inherit',
            borderRadius: 2
          }}
        >
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {searchQuery.length >= 2 && (
        <Box sx={{ mb: 4 }}>
          <ModernCard sx={{ mb: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: alpha('#ffffff', 0.9),
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              🔎 Search Results 
              <Chip 
                label={searchResults.length} 
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Typography>
          </ModernCard>
          
          <Grid container spacing={3}>
            {searchResults.map((user) => (
              <Grid item xs={12} sm={6} md={4} key={user.user_id}>
                <UserCardWithRoles user={user} showGuildInfo={true} />
              </Grid>
            ))}
          </Grid>
          
          {searchResults.length === 0 && !searching && (
            <ModernCard>
              <Box textAlign="center" py={4}>
                <Typography 
                  sx={{ 
                    color: alpha('#ffffff', 0.6),
                    fontStyle: 'italic',
                    fontSize: '1.1rem'
                  }}
                >
                  No users found matching "{searchQuery}" 🤷‍♂️
                </Typography>
              </Box>
            </ModernCard>
          )}
        </Box>
      )}

      {/* All Users */}
      {searchQuery.length < 2 && (
        <Box>
          <ModernCard sx={{ mb: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: alpha('#ffffff', 0.9),
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              👥 Guild Members 
              <Chip 
                label={users.length} 
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Typography>
          </ModernCard>
          
          <Grid container spacing={3}>
            {users.map((user) => (
              <Grid item xs={12} sm={6} md={4} key={user.user_id}>
                <UserCardWithRoles user={user} showGuildInfo={true} />
              </Grid>
            ))}
          </Grid>
          
          {users.length === 0 && (
            <ModernCard>
              <Box textAlign="center" py={4}>
                <Typography 
                  sx={{ 
                    color: alpha('#ffffff', 0.6),
                    fontStyle: 'italic',
                    fontSize: '1.1rem'
                  }}
                >
                  No users found in this guild 👻
                </Typography>
              </Box>
            </ModernCard>
          )}
        </Box>
      )}
    </ModernPageLayout>
  );
};

export default Users;
