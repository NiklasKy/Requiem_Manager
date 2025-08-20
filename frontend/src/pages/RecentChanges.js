import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  Grid,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import { 
  History as HistoryIcon,
  FilterList as FilterIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ModernPageLayout from '../components/ModernPageLayout';
import ModernCard from '../components/ModernCard';
import { apiService } from '../services/api';

const RecentChanges = () => {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(50);
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  // Default guild ID
  const defaultGuildId = process.env.REACT_APP_DEFAULT_GUILD_ID || '123456789012345678';

  useEffect(() => {
    loadChanges();
  }, [limit]);

  const loadChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getRecentChanges(defaultGuildId, limit);
      setChanges(data);
    } catch (err) {
      console.error('Error loading changes:', err);
      setError('Failed to load recent changes. Please check if the API is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    // Ensure userId is treated as string to prevent precision loss
    const userIdStr = String(userId);
    navigate(`/users/${userIdStr}?guild=${defaultGuildId}`);
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
      case 'role':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getChangeTypeIcon = (type) => {
    switch (type) {
      case 'username':
        return '@';
      case 'nickname':
        return '#';
      case 'role':
        return '🛡️';
      default:
        return '?';
    }
  };

  const filteredChanges = changes.filter(change => 
    filterType === 'all' || change.type === filterType
  );

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
            background: `linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)`,
            mb: 3,
            boxShadow: '0 8px 32px rgba(255, 152, 0, 0.3)',
          }}
        >
          <TimelineIcon 
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
          Recent Changes
        </Typography>
        
        <Typography 
          variant="h6" 
          sx={{ 
            color: alpha('#ffffff', 0.8),
            fontWeight: 400
          }}
        >
          User Activity Timeline
        </Typography>
      </Box>

      {/* Filters */}
      <ModernCard sx={{ mb: 4 }}>
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
          <FilterIcon /> Filters
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Change Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: alpha('#ffffff', 0.05),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha('#ffffff', 0.2)}`,
                  borderRadius: 2,
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover': {
                    background: alpha('#ffffff', 0.1),
                    border: `1px solid ${alpha('#ffffff', 0.3)}`,
                  },
                  '&.Mui-focused': {
                    background: alpha('#ffffff', 0.1),
                    border: `1px solid ${alpha('#5865f2', 0.5)}`,
                    boxShadow: `0 0 0 3px ${alpha('#5865f2', 0.1)}`,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: alpha('#ffffff', 0.7),
                  '&.Mui-focused': {
                    color: '#5865f2',
                  },
                },
                '& .MuiSelect-icon': {
                  color: alpha('#ffffff', 0.7),
                },
                '& input, & .MuiSelect-select': {
                  color: alpha('#ffffff', 0.9),
                },
              }}
            >
              <MenuItem value="all">🔍 All Types</MenuItem>
              <MenuItem value="username">👤 Username Changes</MenuItem>
              <MenuItem value="nickname">🏷️ Nickname Changes</MenuItem>
              <MenuItem value="role">🛡️ Role Changes</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Limit"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: alpha('#ffffff', 0.05),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha('#ffffff', 0.2)}`,
                  borderRadius: 2,
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover': {
                    background: alpha('#ffffff', 0.1),
                    border: `1px solid ${alpha('#ffffff', 0.3)}`,
                  },
                  '&.Mui-focused': {
                    background: alpha('#ffffff', 0.1),
                    border: `1px solid ${alpha('#5865f2', 0.5)}`,
                    boxShadow: `0 0 0 3px ${alpha('#5865f2', 0.1)}`,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: alpha('#ffffff', 0.7),
                  '&.Mui-focused': {
                    color: '#5865f2',
                  },
                },
                '& .MuiSelect-icon': {
                  color: alpha('#ffffff', 0.7),
                },
                '& input, & .MuiSelect-select': {
                  color: alpha('#ffffff', 0.9),
                },
              }}
            >
              <MenuItem value={25}>📄 25 Changes</MenuItem>
              <MenuItem value={50}>📋 50 Changes</MenuItem>
              <MenuItem value={100}>📊 100 Changes</MenuItem>
            </TextField>
          </Grid>
        </Grid>
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
            borderRadius: 3
          }}
        >
          {error}
        </Alert>
      )}

      {/* Changes Table */}
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
          📋 Change History
        </Typography>
        
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
                    fontSize: '1rem',
                    py: 2
                  }
                }}
              >
                <TableCell>🏷️ Type</TableCell>
                <TableCell>👤 User</TableCell>
                <TableCell>📝 Old Value</TableCell>
                <TableCell>✨ New Value</TableCell>
                <TableCell>⏰ Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredChanges.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={5}
                    sx={{
                      borderBottom: 'none',
                      py: 6
                    }}
                  >
                    <Box textAlign="center">
                      <Typography 
                        sx={{ 
                          color: alpha('#ffffff', 0.6),
                          fontStyle: 'italic',
                          fontSize: '1.1rem'
                        }}
                      >
                        No changes found matching the current filters 📭
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredChanges.map((change, index) => (
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
                        label={change.type}
                        color={getChangeTypeColor(change.type)}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          minWidth: '100px'
                        }}
                        icon={
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              width: 16,
                              height: 16,
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {getChangeTypeIcon(change.type)}
                          </Box>
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar 
                          src={change.avatar_url}
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            fontSize: '0.8rem',
                            background: change.avatar_url ? 'transparent' : 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        >
                          {!change.avatar_url && (change.display_name ? change.display_name.charAt(0).toUpperCase() : change.user_id.toString().slice(-2))}
                        </Avatar>
                        <Box>
                          <Typography 
                            variant="body2"
                            onClick={() => handleUserClick(change.user_id)}
                            sx={{ 
                              color: alpha('#ffffff', 0.95),
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                color: '#5865f2',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            {change.display_name || change.username || `User ${change.user_id}`}
                          </Typography>
                          <Typography 
                            variant="caption"
                            onClick={() => handleUserClick(change.user_id)}
                            sx={{ 
                              color: alpha('#ffffff', 0.6),
                              fontFamily: 'monospace',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                color: alpha('#5865f2', 0.8)
                              }
                            }}
                          >
                            @{change.username || change.user_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {change.type === 'role' ? (
                        // Special handling for role changes
                        change.action === 'removed' ? (
                          <Box
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              p: 1,
                              borderRadius: 1,
                              background: alpha('#f44336', 0.15),
                              border: `1px solid ${alpha('#f44336', 0.4)}`
                            }}
                          >
                            <Chip
                              label={change.role_name}
                              size="small"
                              sx={{
                                backgroundColor: change.role_color ? `#${change.role_color.toString(16).padStart(6, '0')}` : '#99aab5',
                                color: 'white',
                                fontWeight: 600,
                                '& .MuiChip-deleteIcon': {
                                  color: 'white'
                                }
                              }}
                              deleteIcon={<Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>❌</Typography>}
                              onDelete={() => {}} // Just for the icon
                            />
                          </Box>
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: alpha('#ffffff', 0.6),
                              fontStyle: 'italic'
                            }}
                          >
                            (none)
                          </Typography>
                        )
                      ) : (
                        // Regular handling for username/nickname changes
                        <Box
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            p: 1,
                            borderRadius: 1,
                            background: alpha('#f44336', 0.1),
                            border: `1px solid ${alpha('#f44336', 0.3)}`
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              textDecoration: 'line-through',
                              color: alpha('#ffffff', 0.7),
                              fontStyle: change.old_value ? 'normal' : 'italic'
                            }}
                          >
                            {change.old_value || '(none)'}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {change.type === 'role' ? (
                        // Special handling for role changes
                        change.action === 'added' ? (
                          <Box
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              p: 1,
                              borderRadius: 1,
                              background: alpha('#4caf50', 0.15),
                              border: `1px solid ${alpha('#4caf50', 0.4)}`
                            }}
                          >
                            <Chip
                              label={change.role_name}
                              size="small"
                              sx={{
                                backgroundColor: change.role_color ? `#${change.role_color.toString(16).padStart(6, '0')}` : '#99aab5',
                                color: 'white',
                                fontWeight: 600,
                                '& .MuiChip-deleteIcon': {
                                  color: 'white'
                                }
                              }}
                              deleteIcon={<Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>✅</Typography>}
                              onDelete={() => {}} // Just for the icon
                            />
                          </Box>
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: alpha('#ffffff', 0.6),
                              fontStyle: 'italic'
                            }}
                          >
                            (none)
                          </Typography>
                        )
                      ) : (
                        // Regular handling for username/nickname changes
                        <Box
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            p: 1,
                            borderRadius: 1,
                            background: alpha('#4caf50', 0.1),
                            border: `1px solid ${alpha('#4caf50', 0.3)}`
                          }}
                        >
                          <Typography 
                            variant="body2"
                            sx={{ 
                              fontWeight: 600,
                              color: alpha('#ffffff', 0.9),
                              fontStyle: change.new_value ? 'normal' : 'italic'
                            }}
                          >
                            {change.new_value || '(none)'}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: alpha('#ffffff', 0.7),
                          fontFamily: 'monospace',
                          fontSize: '0.85rem'
                        }}
                      >
                        {formatTimestamp(change.timestamp)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary */}
        <Box 
          mt={3}
          sx={{
            p: 2,
            borderRadius: 2,
            background: alpha('#000000', 0.2),
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: alpha('#ffffff', 0.7),
              fontFamily: 'monospace'
            }}
          >
            📊 Showing {filteredChanges.length} of {changes.length} total changes
          </Typography>
        </Box>
      </ModernCard>
    </ModernPageLayout>
  );
};

export default RecentChanges;
