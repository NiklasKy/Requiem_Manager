import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Grid,
  Box,
  Skeleton,
  Alert,
  Button,
  Tooltip,
  TextField,
  IconButton,
  Stack,
  Chip,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  Settings as SettingsIcon,
  Hub as HubIcon,
  BarChart as BarChartIcon,
  QueryStats as QueryStatsIcon,
  FileDownload as ExportIcon,
  CleaningServices as CleanupIcon,
  Assessment as ReportIcon,
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import StatCard from '../components/StatCard';
import ModernPageLayout from '../components/ModernPageLayout';
import ModernCard from '../components/ModernCard';
import { apiService } from '../services/api';
import useThemeColors from '../hooks/useThemeColors';

const AdminSkeleton = ({ c }) => (
  <>
    <Box mb={3}><Skeleton variant="rectangular" height={72} sx={{ borderRadius: 3, bgcolor: c.skeletonBg }} /></Box>
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {[1,2,3,4,5].map(i => <Grid item xs={12} sm={6} md={2.4} key={i}><Skeleton variant="rectangular" height={110} sx={{ borderRadius: 4, bgcolor: c.skeletonBg }} /></Grid>)}
    </Grid>
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}><Skeleton variant="rectangular" height={340} sx={{ borderRadius: 3, bgcolor: c.skeletonBg }} /></Grid>
      <Grid item xs={12} md={6}><Skeleton variant="rectangular" height={340} sx={{ borderRadius: 3, bgcolor: c.skeletonBg }} /></Grid>
    </Grid>
  </>
);

const StatusDot = ({ active }) => (
  <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: active ? '#4caf50' : '#f44336', boxShadow: `0 0 8px ${active ? '#4caf50' : '#f44336'}`, flexShrink: 0 }} />
);

// ── Achievement Manager sub-component ────────────────────────────────────────

const EMPTY_FORM = { game_name: '', title: '', description: '', achieved_at: '' };

const AchievementForm = ({ initial = null, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial ? { game_name: initial.game_name, title: initial.title, description: initial.description || '', achieved_at: initial.achieved_at || '' } : { ...EMPTY_FORM });
  const inputSx = {
    '& .MuiOutlinedInput-root': { bgcolor: alpha('#fff', 0.05), borderRadius: '8px', color: '#fff', '& fieldset': { borderColor: alpha('#5865f2', 0.25) }, '&:hover fieldset': { borderColor: alpha('#5865f2', 0.45) }, '&.Mui-focused fieldset': { borderColor: '#5865f2' } },
    '& .MuiInputLabel-root': { color: alpha('#fff', 0.45) },
    '& .MuiInputLabel-root.Mui-focused': { color: '#7289da' },
  };
  return (
    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha('#5865f2', 0.07), border: `1px solid ${alpha('#5865f2', 0.3)}` }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Game" value={form.game_name} onChange={e => setForm(f => ({ ...f, game_name: e.target.value }))} sx={inputSx} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} sx={inputSx} /></Grid>
        <Grid item xs={12}><TextField fullWidth size="small" label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} sx={inputSx} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Achieved At (YYYY-MM-DD)" value={form.achieved_at} onChange={e => setForm(f => ({ ...f, achieved_at: e.target.value }))} sx={inputSx} /></Grid>
      </Grid>
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
        <Button size="small" onClick={() => onSave(form)} disabled={!form.game_name || !form.title || saving}
          startIcon={saving ? <CircularProgress size={14} /> : <CheckIcon sx={{ fontSize: 14 }} />}
          sx={{ bgcolor: '#5865f2', color: '#fff', borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', '&:hover': { bgcolor: '#4752c4' } }}>
          Save
        </Button>
        <Button size="small" onClick={onCancel} startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
          sx={{ color: alpha('#fff', 0.5), border: `1px solid ${alpha('#fff', 0.12)}`, borderRadius: '8px', textTransform: 'none', fontSize: '0.8rem', '&:hover': { color: '#fff' } }}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

const AchievementManager = ({ c }) => {
  const [achievements, setAchievements] = useState([]);
  const [loadingA, setLoadingA] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadAchievements = useCallback(async () => {
    setLoadingA(true);
    try { setAchievements(await apiService.getAchievements()); } catch (e) { /* ignore */ }
    setLoadingA(false);
  }, []);

  useEffect(() => { loadAchievements(); }, [loadAchievements]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editingId) { await apiService.updateAchievement(editingId, form); }
      else { await apiService.createAchievement(form); }
      setShowForm(false); setEditingId(null);
      await loadAchievements();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await apiService.deleteAchievement(id);
    await loadAchievements();
  };

  const grouped = achievements.reduce((acc, a) => { (acc[a.game_name] = acc[a.game_name] || []).push(a); return acc; }, {});

  return (
    <ModernCard sx={{ mt: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
        <Box display="flex" alignItems="center" gap={1}>
          <TrophyIcon sx={{ color: '#f59e0b', fontSize: '1.1rem' }} />
          <Typography variant="h6" sx={{ color: c.textPrimary, fontWeight: 600 }}>Achievement Manager</Typography>
        </Box>
        {!showForm && !editingId && (
          <Button size="small" startIcon={<AddIcon sx={{ fontSize: 15 }} />} onClick={() => setShowForm(true)}
            sx={{ color: '#7289da', border: `1px solid ${alpha('#5865f2', 0.3)}`, borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
              '&:hover': { bgcolor: alpha('#5865f2', 0.1), borderColor: alpha('#5865f2', 0.5) } }}>
            Add Achievement
          </Button>
        )}
      </Box>

      {showForm && (
        <Box mb={2}><AchievementForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} /></Box>
      )}

      {loadingA ? (
        <Stack spacing={1}>{[1,2].map(i => <Skeleton key={i} height={52} sx={{ borderRadius: '8px', bgcolor: alpha('#5865f2', 0.1) }} />)}</Stack>
      ) : Object.keys(grouped).length === 0 && !showForm ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <TrophyIcon sx={{ fontSize: 36, color: alpha('#f59e0b', 0.2), mb: 1 }} />
          <Typography variant="body2" sx={{ color: c.textMuted }}>No achievements yet. Add your first one.</Typography>
        </Box>
      ) : (
        Object.entries(grouped).map(([game, items]) => (
          <Box key={game} mb={2.5}>
            <Chip label={game} size="small" sx={{ mb: 1.5, bgcolor: alpha('#5865f2', 0.15), color: '#7289da', border: `1px solid ${alpha('#5865f2', 0.3)}`, fontWeight: 700 }} />
            <Stack spacing={1}>
              {items.map(a => (
                editingId === a.id ? (
                  <AchievementForm key={a.id} initial={a} onSave={handleSave} onCancel={() => setEditingId(null)} saving={saving} />
                ) : (
                  <Box key={a.id} sx={{ p: '10px 14px', borderRadius: '8px', bgcolor: alpha('#fff', 0.03), border: `1px solid ${alpha('#5865f2', 0.12)}`, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>{a.title}</Typography>
                      {a.description && <Typography variant="caption" sx={{ color: alpha('#fff', 0.45) }}>{a.description}</Typography>}
                      {a.achieved_at && <Typography variant="caption" sx={{ color: alpha('#f59e0b', 0.7), display: 'block', fontSize: '0.68rem', mt: 0.3 }}>{a.achieved_at}</Typography>}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.25 }}>
                      <IconButton size="small" onClick={() => setEditingId(a.id)} sx={{ color: alpha('#fff', 0.35), '&:hover': { color: '#7289da' } }}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(a.id)} sx={{ color: alpha('#fff', 0.35), '&:hover': { color: '#f87171' } }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
                    </Box>
                  </Box>
                )
              ))}
            </Stack>
          </Box>
        ))
      )}
    </ModernCard>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const AdminPanel = () => {
  const [databaseStats, setDatabaseStats] = useState(null);
  const [apiInfo, setApiInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const c = useThemeColors();

  useEffect(() => { loadAdminData(); }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dbStats, apiData] = await Promise.all([
        apiService.getDatabaseStats(),
        apiService.getApiInfo(),
      ]);
      setDatabaseStats(dbStats);
      setApiInfo(apiData);
    } catch (err) {
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

  return (
    <ModernPageLayout>
      {loading ? <AdminSkeleton c={c} /> : (
        <>
          {/* Page header — warning-badge style, distinct from other pages */}
          <ModernCard sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, background: 'linear-gradient(135deg,#f44336,#ff7043)', display: 'flex', alignItems: 'center', boxShadow: '0 4px 16px rgba(244,67,54,0.3)' }}>
                  <AdminIcon sx={{ color: 'white', fontSize: '1.4rem' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ color: c.textPrimary, fontWeight: 700, lineHeight: 1.2 }}>Admin Panel</Typography>
                  <Typography variant="body2" sx={{ color: c.textMuted }}>System management &amp; monitoring</Typography>
                </Box>
              </Box>
              <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={refreshing}
                sx={{ background: 'linear-gradient(135deg,#5865f2,#7289da)', fontWeight: 600, borderRadius: 2, boxShadow: '0 4px 12px rgba(88,101,242,0.3)', textTransform: 'none',
                  '&:hover': { background: 'linear-gradient(135deg,#4752c4,#5b6bb0)' }, '&:disabled': { opacity: 0.5 } }}>
                {refreshing ? 'Refreshing…' : 'Refresh Data'}
              </Button>
            </Box>
          </ModernCard>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          {/* Database stats */}
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <BarChartIcon sx={{ color: '#5865f2', fontSize: '1.1rem' }} />
            <Typography variant="subtitle1" sx={{ color: c.textPrimary, fontWeight: 600 }}>Database Statistics</Typography>
          </Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}><StatCard title="Total Users" value={databaseStats && databaseStats.user_count} icon={<StorageIcon />} color="primary" /></Grid>
            <Grid item xs={12} sm={6} md={2.4}><StatCard title="Username Changes" value={databaseStats && databaseStats.username_changes} icon={<StorageIcon />} color="secondary" /></Grid>
            <Grid item xs={12} sm={6} md={2.4}><StatCard title="Nickname Changes" value={databaseStats && databaseStats.nickname_changes} icon={<StorageIcon />} color="info" /></Grid>
            <Grid item xs={12} sm={6} md={2.4}><StatCard title="Role Changes" value={databaseStats && databaseStats.role_changes} icon={<StorageIcon />} color="warning" /></Grid>
            <Grid item xs={12} sm={6} md={2.4}><StatCard title="Join/Leave Events" value={databaseStats && databaseStats.join_leave_events} icon={<StorageIcon />} color="success" /></Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* API Info */}
            <Grid item xs={12} md={6}>
              <ModernCard>
                <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                  <SettingsIcon sx={{ color: '#5865f2', fontSize: '1.1rem' }} />
                  <Typography variant="h6" sx={{ color: c.textPrimary, fontWeight: 600 }}>API Information</Typography>
                </Box>
                {apiInfo ? (
                  <Box>
                    <Box sx={{ p: 2, mb: 2, borderRadius: 2, background: c.subtleBg, border: `1px solid ${c.subtleBorder}` }}>
                      <Typography variant="body2" sx={{ mb: 1, color: c.textSecondary, fontFamily: 'monospace' }}>
                        <Box component="span" sx={{ fontWeight: 600, color: c.textPrimary }}>Version:</Box> {apiInfo.version}
                      </Typography>
                      <Typography variant="body2" sx={{ color: c.textSecondary }}>
                        <Box component="span" sx={{ fontWeight: 600, color: c.textPrimary }}>Message:</Box> {apiInfo.message}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                      <HubIcon sx={{ fontSize: '0.9rem', color: c.textSecondary }} />
                      <Typography variant="body2" sx={{ color: c.textSecondary, fontWeight: 600 }}>Available Endpoints</Typography>
                    </Box>
                    <Box sx={{ maxHeight: 200, overflowY: 'auto', background: c.subtleBg, borderRadius: 2, p: 1.5 }}>
                      {apiInfo.endpoints && Object.entries(apiInfo.endpoints).map(([name, endpoint]) => (
                        <Box key={name} sx={{ mb: 1, p: 1, borderRadius: 1, background: c.cardHoverBg, '&:hover': { background: c.inputHoverBg } }}>
                          <Typography variant="body2" sx={{ color: c.textSecondary }}>
                            <Box component="span" sx={{ fontWeight: 600, color: c.textPrimary }}>{name}:</Box>
                            <Box component="code" sx={{ ml: 1, px: 1, py: 0.25, borderRadius: 1, background: 'rgba(88,101,242,0.15)', color: '#7289da', fontSize: '0.78rem' }}>
                              {endpoint}
                            </Box>
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Typography sx={{ color: c.textMuted, fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                    API information not available
                  </Typography>
                )}
              </ModernCard>
            </Grid>

            {/* System Status */}
            <Grid item xs={12} md={6}>
              <ModernCard>
                <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                  <QueryStatsIcon sx={{ color: '#4caf50', fontSize: '1.1rem' }} />
                  <Typography variant="h6" sx={{ color: c.textPrimary, fontWeight: 600 }}>System Status</Typography>
                </Box>
                <Box>
                  {[
                    { label: 'Database Connection', active: !!databaseStats },
                    { label: 'API Status', active: !!apiInfo },
                    { label: 'Data Collection', active: !!(databaseStats && (databaseStats.user_count || 0) > 0) },
                  ].map(({ label, active }) => (
                    <Box key={label} display="flex" justifyContent="space-between" alignItems="center" mb={1.5}
                      sx={{ p: 2, borderRadius: 2, background: c.subtleBg, border: `1px solid ${c.subtleBorder}` }}>
                      <Typography variant="body2" sx={{ color: c.textSecondary, fontWeight: 500 }}>{label}</Typography>
                      <StatusDot active={active} />
                    </Box>
                  ))}
                  <Box sx={{ p: 2, borderRadius: 2, background: c.subtleBg, textAlign: 'center', mb: 2 }}>
                    <Typography variant="caption" sx={{ color: c.textMuted, fontFamily: 'monospace' }}>
                      Last updated: {new Date().toLocaleString()}
                    </Typography>
                  </Box>
                  <Button fullWidth variant="contained" onClick={handleRefresh} disabled={refreshing} startIcon={<RefreshIcon />}
                    sx={{ background: 'linear-gradient(135deg,#4caf50,#66bb6a)', fontWeight: 600, borderRadius: 2, textTransform: 'none',
                      '&:hover': { background: 'linear-gradient(135deg,#388e3c,#4caf50)' }, '&:disabled': { opacity: 0.5 } }}>
                    Check Status
                  </Button>
                </Box>
              </ModernCard>
            </Grid>
          </Grid>

          {/* Achievements */}
          <AchievementManager c={c} />

          {/* Quick Actions */}
          <ModernCard sx={{ mt: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2.5}>
              <AdminIcon sx={{ color: '#f44336', fontSize: '1.1rem' }} />
              <Typography variant="h6" sx={{ color: c.textPrimary, fontWeight: 600 }}>Quick Actions</Typography>
            </Box>
            <Grid container spacing={2}>
              {[
                { label: 'Export Data', icon: <ExportIcon />, tip: 'Data export is not yet implemented.' },
                { label: 'Cleanup Old Records', icon: <CleanupIcon />, tip: 'Record cleanup is not yet implemented.' },
                { label: 'Generate Report', icon: <ReportIcon />, tip: 'Report generation is not yet implemented.' },
              ].map(({ label, icon, tip }) => (
                <Grid item xs={12} md={4} key={label}>
                  <Tooltip title={tip} placement="top" arrow>
                    <span>
                      <Button variant="outlined" disabled fullWidth startIcon={icon}
                        sx={{ py: 2, borderColor: c.cardBorder, color: c.textMuted, borderRadius: 2, textTransform: 'none', fontWeight: 500 }}>
                        {label}
                      </Button>
                    </span>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </ModernCard>
        </>
      )}
    </ModernPageLayout>
  );
};

export default AdminPanel;
