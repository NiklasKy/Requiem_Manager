import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Skeleton,
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
  Tooltip,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  History as HistoryIcon,
  Security as SecurityIcon,
  Label as LabelIcon,
  AlternateEmail as UsernameIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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

const TableSkeleton = ({ colors }) => (
  <Box>
    {[1,2,3,4,5,6].map(i => (
      <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: 1, borderRadius: 1, bgcolor: colors.skeletonBg }} />
    ))}
  </Box>
);

const RecentChanges = () => {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(50);
  const [filterType, setFilterType] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const navigate = useNavigate();
  const colors = useThemeColors();

  const defaultGuildId = process.env.REACT_APP_DEFAULT_GUILD_ID || '123456789012345678';

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadChanges(); }, [limit]);

  const loadChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getRecentChanges(defaultGuildId, limit);
      setChanges(data);
    } catch {
      setError('Failed to load recent changes. Please check if the API is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => navigate(`/users/${String(userId)}?guild=${defaultGuildId}`);

  const filteredChanges = changes.filter(change => {
    const typeMatch = filterType === 'all' || change.type === filterType;
    const userMatch =
      userFilter === '' ||
      change.username?.toLowerCase().includes(userFilter.toLowerCase()) ||
      change.display_name?.toLowerCase().includes(userFilter.toLowerCase()) ||
      change.user_id?.toString().includes(userFilter);
    return typeMatch && userMatch;
  });

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      background: colors.inputBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 2,
      color: colors.textPrimary,
      '& fieldset': { border: 'none' },
      '&:hover': { background: colors.inputHoverBg },
      '&.Mui-focused': { background: colors.inputFocusBg, border: `1px solid rgba(88,101,242,0.5)` },
    },
    '& .MuiInputLabel-root': { color: colors.textSecondary, '&.Mui-focused': { color: '#5865f2' } },
    '& .MuiSelect-icon': { color: colors.textMuted },
    '& input, & .MuiSelect-select': { color: colors.textPrimary },
  };

  return (
    <ModernPageLayout>
      {/* Page header — timeline-first, no generic icon circle */}
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Box sx={{ p: 1.5, borderRadius: 2, background: 'linear-gradient(135deg,#ff9800,#ffb74d)', display: 'flex', alignItems: 'center', boxShadow: '0 4px 16px rgba(255,152,0,0.3)' }}>
          <HistoryIcon sx={{ color: 'white', fontSize: '1.4rem' }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ color: colors.textPrimary, fontWeight: 700, lineHeight: 1.2 }}>
            Recent Changes
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textMuted }}>
            User activity timeline
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <ModernCard sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <FilterIcon sx={{ color: colors.textSecondary, fontSize: '1rem' }} />
          <Typography variant="subtitle1" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
            Filters
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth label="Change Type" value={filterType} onChange={e => setFilterType(e.target.value)} sx={inputSx}>
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="username">Username Changes</MenuItem>
              <MenuItem value="nickname">Nickname Changes</MenuItem>
              <MenuItem value="role">Role Changes</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth label="Limit" value={limit} onChange={e => setLimit(parseInt(e.target.value))} sx={inputSx}>
              <MenuItem value={25}>25 entries</MenuItem>
              <MenuItem value={50}>50 entries</MenuItem>
              <MenuItem value={100}>100 entries</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Filter by User"
              placeholder="Username, display name, or user ID"
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              sx={inputSx}
            />
          </Grid>
        </Grid>
      </ModernCard>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Table */}
      <ModernCard>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle1" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
            Change History
          </Typography>
          {!loading && (
            <Typography variant="caption" sx={{ color: colors.textMuted }}>
              {filteredChanges.length} of {changes.length} entries
            </Typography>
          )}
        </Box>

        {loading ? (
          <TableSkeleton colors={colors} />
        ) : (
          <TableContainer sx={{ background: colors.subtleBg, borderRadius: 2, border: `1px solid ${colors.subtleBorder}`, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{
                  background: colors.cardHoverBg,
                  '& .MuiTableCell-head': {
                    color: colors.textSecondary,
                    fontWeight: 600,
                    borderBottom: `1px solid ${colors.cardBorder}`,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    py: 1.5,
                  },
                }}>
                  <TableCell>Type</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Change</TableCell>
                  <TableCell>When</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredChanges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ borderBottom: 'none', py: 6 }}>
                      <Typography sx={{ color: colors.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
                        No changes match the current filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChanges.map((change, index) => (
                    <TableRow key={index} sx={{ '&:hover': { background: colors.cardHoverBg }, '& .MuiTableCell-body': { color: colors.textSecondary, borderBottom: `1px solid ${colors.subtleBorder}`, py: 1.5 } }}>
                      <TableCell>
                        <Chip
                          label={change.type}
                          size="small"
                          icon={CHANGE_TYPE_ICONS[change.type]}
                          sx={{ ...getChangeTypeChipSx(change.type), minWidth: 100 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            src={change.avatar_url}
                            sx={{ width: 30, height: 30, fontSize: '0.75rem', background: 'linear-gradient(135deg,#5865f2,#7289da)' }}
                          >
                            {!change.avatar_url && (change.display_name?.charAt(0)?.toUpperCase() || '?')}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              onClick={() => handleUserClick(change.user_id)}
                              sx={{ color: colors.textPrimary, fontWeight: 600, cursor: 'pointer', lineHeight: 1.2, '&:hover': { color: '#5865f2', textDecoration: 'underline' } }}
                            >
                              {change.display_name || change.username || `User ${change.user_id}`}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.textMuted, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                              @{change.username || change.user_id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        {change.type === 'role' ? (
                          <Box display="flex" alignItems="center" gap={0.75}>
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
                                fontSize: '0.72rem',
                              }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                            <Box component="span" sx={{ textDecoration: 'line-through', color: colors.textMuted, mr: 0.5 }}>{change.old_value || '(none)'}</Box>
                            {'→ '}
                            <Box component="span" sx={{ fontWeight: 600, color: colors.textPrimary }}>{change.new_value || '(none)'}</Box>
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Tooltip title={formatAbsoluteTime(change.timestamp)} placement="top" arrow>
                          <Typography variant="body2" sx={{ color: colors.textMuted, fontFamily: 'monospace', cursor: 'default', whiteSpace: 'nowrap' }}>
                            {formatRelativeTime(change.timestamp)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </ModernCard>
    </ModernPageLayout>
  );
};

export default RecentChanges;
