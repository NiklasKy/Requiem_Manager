import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Grid,
  TextField,
  Box,
  Alert,
  Avatar,
  Chip,
  IconButton,
  Skeleton,
  InputAdornment,
  Pagination,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  CalendarToday as CalendarIcon,
  Label as LabelIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import ModernPageLayout from '../components/ModernPageLayout';
import ModernCard from '../components/ModernCard';
import useThemeColors from '../hooks/useThemeColors';
import { getContrastTextColor } from '../utils/colors';
import { formatAbsoluteTime } from '../utils/time';

const PAGE_SIZE = 24;

const UsersSkeleton = ({ colors }) => (
  <Grid container spacing={3}>
    {[1,2,3,4,5,6].map(i => (
      <Grid item xs={12} sm={6} md={4} key={i}>
        <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 4, bgcolor: colors.skeletonBg }} />
      </Grid>
    ))}
  </Grid>
);

const UserCard = ({ user, bulkRoles, loadingRoles, colors, onUserClick }) => {
  const roles = bulkRoles[user.user_id] || [];

  return (
    <Box
      onClick={() => onUserClick(user.user_id)}
      sx={{
        height: '100%',
        background: colors.cardBg,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 4,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 12px 36px rgba(88,101,242,0.22)',
          borderColor: 'rgba(88,101,242,0.45)',
          '& .user-avatar': { transform: 'scale(1.05)', boxShadow: '0 6px 20px rgba(88,101,242,0.4)' },
          '& .view-icon': { color: '#5865f2', opacity: 1 },
        },
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            src={user.avatar_url}
            className="user-avatar"
            sx={{
              width: 56, height: 56, mr: 2,
              background: 'linear-gradient(135deg,#5865f2,#7289da)',
              border: `2px solid rgba(88,101,242,0.35)`,
              fontSize: '1.4rem', fontWeight: 'bold',
              transition: 'all 0.25s ease',
              boxShadow: '0 3px 10px rgba(88,101,242,0.2)',
            }}
          >
            {!user.avatar_url && (user.username?.charAt(0)?.toUpperCase() || '?')}
          </Avatar>
          <Box flex={1} sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ color: colors.textPrimary, fontWeight: 700, lineHeight: 1.2 }}>
              {user.display_name || user.username}
            </Typography>
            <Typography variant="body2" noWrap sx={{ color: colors.textMuted, fontFamily: 'monospace', fontSize: '0.82rem' }}>
              @{user.username}
            </Typography>
          </Box>
          <IconButton className="view-icon" size="small" sx={{ color: colors.textMuted, opacity: 0.5, transition: 'all 0.2s', pointerEvents: 'none' }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Nickname badge */}
        {user.nickname && (
          <Box mb={1.5}>
            <Chip
              icon={<LabelIcon sx={{ fontSize: '0.85rem' }} />}
              label={user.nickname}
              size="small"
              sx={{
                background: 'rgba(156,39,176,0.15)',
                border: '1px solid rgba(156,39,176,0.35)',
                color: colors.textPrimary,
                fontWeight: 600,
                fontSize: '0.78rem',
                '& .MuiChip-icon': { color: '#ba68c8' },
              }}
            />
          </Box>
        )}

        {/* Roles */}
        <Box flex={1} mb={2}>
          <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <SecurityIcon sx={{ fontSize: '0.85rem' }} />
            Roles ({roles.length})
          </Typography>
          {loadingRoles ? (
            <Box display="flex" gap={1} flexWrap="wrap">
              {[1,2,3].map(i => <Skeleton key={i} variant="rectangular" width={64} height={26} sx={{ borderRadius: 2, bgcolor: colors.skeletonBg }} />)}
            </Box>
          ) : (
            <Box display="flex" gap={0.75} flexWrap="wrap" sx={{ maxHeight: 70, overflow: 'hidden' }}>
              {roles.length === 0 ? (
                <Typography variant="caption" sx={{ color: colors.textMuted, fontStyle: 'italic' }}>No roles</Typography>
              ) : (
                <>
                  {roles.slice(0, 4).map(role => (
                    <Chip
                      key={role.role_id}
                      label={role.role_name}
                      size="small"
                      sx={{
                        fontSize: '0.72rem', height: 26, px: 0.5,
                        backgroundColor: role.color || '#99aab5',
                        color: getContrastTextColor(role.color || '#99aab5'),
                        fontWeight: 600,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                    />
                  ))}
                  {roles.length > 4 && (
                    <Chip
                      label={`+${roles.length - 4}`}
                      size="small"
                      sx={{ fontSize: '0.72rem', height: 26, backgroundColor: colors.inputBg, border: `1px solid ${colors.cardBorder}`, color: colors.textMuted, fontWeight: 600 }}
                    />
                  )}
                </>
              )}
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ pt: 1.5, borderTop: `1px solid ${colors.subtleBorder}`, mt: 'auto', display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <CalendarIcon sx={{ fontSize: '0.82rem', color: colors.textMuted }} />
          <Tooltip title={user.joined_at ? formatAbsoluteTime(user.joined_at) : 'Unknown'} placement="bottom" arrow>
            <Typography variant="caption" sx={{ color: colors.textMuted, fontFamily: 'monospace', fontSize: '0.78rem', cursor: 'default' }}>
              {user.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'Unknown'}
            </Typography>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [bulkRoles, setBulkRoles] = useState({});
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roleFilters, setRoleFilters] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const colors = useThemeColors();

  const defaultGuildId = process.env.REACT_APP_DEFAULT_GUILD_ID || '123456789012345678';
  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  const isSearching = debouncedSearchQuery.length >= 2;
  const displayUsers = isSearching ? searchResults : users;
  const pageCount = Math.max(1, Math.ceil(displayUsers.length / PAGE_SIZE));
  const pagedUsers = displayUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const loadRoleFilters = useCallback(async () => {
    try {
      setLoadingFilters(true);
      const data = await apiService.getRoleFilters(defaultGuildId);
      if (data.filters) {
        setRoleFilters(data.filters);
        setSelectedFilter(data.default_filter || 'all');
      } else {
        setRoleFilters(data);
        setSelectedFilter('all');
      }
    } catch {
      setRoleFilters([{ role_id: 'all', role_name: 'All Users', role_color: '#5865f2' }]);
      setSelectedFilter('all');
    } finally {
      setLoadingFilters(false);
    }
  }, [defaultGuildId]);

  const loadUsers = useCallback(async () => {
    if (selectedFilter === null) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const filterToUse = selectedFilter === 'all' ? null : selectedFilter;
      const data = await apiService.getGuildUsers(defaultGuildId, true, filterToUse);
      setUsers(data);
      setPage(1);
      await loadBulkRoles(data);
    } catch {
      setError('Failed to load users. Please check if the API is running.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultGuildId, selectedFilter]);

  const loadBulkRoles = useCallback(async (usersData) => {
    try {
      setLoadingRoles(true);
      const userIds = usersData.map(u => u.user_id);
      const chunkSize = 100;
      const allRoles = {};
      for (let i = 0; i < userIds.length; i += chunkSize) {
        const rolesData = await apiService.getBulkUserRoles(userIds.slice(i, i + chunkSize), defaultGuildId);
        Object.assign(allRoles, rolesData);
      }
      setBulkRoles(allRoles);
    } catch {
      // Roles are optional — fail silently
    } finally {
      setLoadingRoles(false);
    }
  }, [defaultGuildId]);

  const searchUsers = useCallback(async () => {
    if (selectedFilter === null) return;
    try {
      setSearching(true);
      const filterToUse = selectedFilter === 'all' ? null : selectedFilter;
      const data = await apiService.searchUsers(debouncedSearchQuery, defaultGuildId, filterToUse);
      setSearchResults(data);
      setPage(1);
    } catch {
      // Search errors are non-critical
    } finally {
      setSearching(false);
    }
  }, [debouncedSearchQuery, defaultGuildId, selectedFilter]);

  useEffect(() => { loadRoleFilters(); }, [loadRoleFilters]);
  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => {
    if (isSearching) { searchUsers(); }
    else { setSearchResults([]); }
  }, [debouncedSearchQuery, isSearching, searchUsers]);

  const handleUserClick = (userId) => navigate(`/users/${String(userId)}?guild=${defaultGuildId}`);

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      background: colors.inputBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 2,
      '& fieldset': { border: 'none' },
      '&:hover': { background: colors.inputHoverBg },
      '&.Mui-focused': { background: colors.inputFocusBg, border: `1px solid rgba(88,101,242,0.5)`, boxShadow: '0 0 0 3px rgba(88,101,242,0.1)' },
    },
    '& input': { color: colors.textPrimary },
    '& .MuiInputLabel-root': { color: colors.textSecondary, '&.Mui-focused': { color: '#5865f2' } },
    '& .MuiInputAdornment-root svg': { color: colors.textMuted },
  };

  return (
    <ModernPageLayout>
      {/* Page header — search-first layout, not generic icon circle */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Box sx={{ p: 1.5, borderRadius: 2, background: 'linear-gradient(135deg,#5865f2,#7289da)', display: 'flex', alignItems: 'center', boxShadow: '0 4px 16px rgba(88,101,242,0.3)' }}>
          <PeopleIcon sx={{ color: 'white', fontSize: '1.4rem' }} />
        </Box>
        <Box flex={1}>
          <Typography variant="h5" sx={{ color: colors.textPrimary, fontWeight: 700, lineHeight: 1.2 }}>
            User Directory
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textMuted }}>
            {loading ? 'Loading members…' : `${users.length} member${users.length !== 1 ? 's' : ''}`}
          </Typography>
        </Box>
      </Box>

      {/* Search — hero element */}
      <ModernCard sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by username, display name, nickname, or role…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sx={inputSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {searching ? <CircularProgress size={18} sx={{ color: '#5865f2' }} /> : <SearchIcon />}
              </InputAdornment>
            ),
          }}
        />
        {searchQuery.length > 0 && searchQuery.length < 2 && (
          <Typography variant="caption" sx={{ color: colors.textMuted, display: 'block', mt: 1, ml: 0.5 }}>
            Type at least 2 characters to search
          </Typography>
        )}
      </ModernCard>

      {/* Role Filters */}
      <ModernCard sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <FilterIcon sx={{ color: colors.textSecondary, fontSize: '1rem' }} />
          <Typography variant="subtitle2" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Filter by Role
          </Typography>
        </Box>
        {loadingFilters ? (
          <Box display="flex" gap={1} flexWrap="wrap">
            {[1,2,3].map(i => <Skeleton key={i} variant="rectangular" width={100} height={36} sx={{ borderRadius: 2, bgcolor: colors.skeletonBg }} />)}
          </Box>
        ) : (
          <Box display="flex" gap={1.5} flexWrap="wrap">
            {roleFilters.map(filter => (
              <Chip
                key={filter.role_id}
                label={filter.role_name}
                onClick={() => { setSelectedFilter(filter.role_id); setPage(1); }}
                variant={selectedFilter === filter.role_id ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: selectedFilter === filter.role_id ? filter.role_color : 'transparent',
                  color: selectedFilter === filter.role_id ? getContrastTextColor(filter.role_color) : filter.role_color,
                  borderColor: filter.role_color,
                  boxShadow: selectedFilter === filter.role_id ? `0 3px 10px rgba(0,0,0,0.25)` : 'none',
                  '&:hover': { transform: 'translateY(-1px)', boxShadow: `0 4px 14px rgba(0,0,0,0.2)`, borderColor: filter.role_color },
                }}
              />
            ))}
          </Box>
        )}
      </ModernCard>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Users grid */}
      {loading ? (
        <UsersSkeleton colors={colors} />
      ) : (
        <>
          {/* Results header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle1" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
                {isSearching ? 'Search Results' : 'Guild Members'}
              </Typography>
              <Chip
                label={displayUsers.length}
                size="small"
                sx={{ background: 'linear-gradient(135deg,#5865f2,#7289da)', color: 'white', fontWeight: 700 }}
              />
            </Box>
            {pageCount > 1 && (
              <Typography variant="caption" sx={{ color: colors.textMuted }}>
                Page {page} of {pageCount}
              </Typography>
            )}
          </Box>

          {pagedUsers.length === 0 ? (
            <ModernCard>
              <Box textAlign="center" py={6}>
                <Typography sx={{ color: colors.textMuted, fontStyle: 'italic' }}>
                  {isSearching ? `No users found matching "${searchQuery}"` : 'No users found for this filter.'}
                </Typography>
              </Box>
            </ModernCard>
          ) : (
            <Grid container spacing={3}>
              {pagedUsers.map(user => (
                <Grid item xs={12} sm={6} md={4} key={user.user_id}>
                  <UserCard
                    user={user}
                    bulkRoles={bulkRoles}
                    loadingRoles={loadingRoles}
                    colors={colors}
                    onUserClick={handleUserClick}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_, newPage) => { setPage(newPage); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                color="primary"
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': { color: colors.textSecondary, borderColor: colors.cardBorder },
                  '& .MuiPaginationItem-root.Mui-selected': { background: 'linear-gradient(135deg,#5865f2,#7289da)', color: 'white', borderColor: 'transparent' },
                }}
              />
            </Box>
          )}
        </>
      )}
    </ModernPageLayout>
  );
};

export default Users;
