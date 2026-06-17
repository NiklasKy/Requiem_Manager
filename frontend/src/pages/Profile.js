import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  Grid,
  alpha,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  SportsEsports as GameIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const CARD_SX = {
  bgcolor: alpha('#fff', 0.03),
  border: `1px solid ${alpha('#5865f2', 0.18)}`,
  borderRadius: '14px',
  p: 2.5,
};

const GameProfileCard = ({ profile, onDelete, onEdit }) => (
  <Box
    sx={{
      ...CARD_SX,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 2,
      transition: 'border-color 0.2s',
      '&:hover': { borderColor: alpha('#5865f2', 0.35) },
    }}
  >
    <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha('#5865f2', 0.15), border: `1px solid ${alpha('#5865f2', 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <GameIcon sx={{ fontSize: 20, color: '#7289da' }} />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: alpha('#fff', 0.4), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
        {profile.game_name}
      </Typography>
      <Typography variant="body1" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.3 }}>
        {profile.character_name}
      </Typography>
      {(profile.server || profile.role_class) && (
        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
          {profile.server && (
            <Chip label={profile.server} size="small" sx={{ bgcolor: alpha('#fff', 0.07), color: alpha('#fff', 0.6), height: 20, fontSize: '0.7rem' }} />
          )}
          {profile.role_class && (
            <Chip label={profile.role_class} size="small" sx={{ bgcolor: alpha('#5865f2', 0.15), color: '#7289da', height: 20, fontSize: '0.7rem' }} />
          )}
        </Box>
      )}
    </Box>
    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
      <IconButton size="small" onClick={() => onEdit(profile)} sx={{ color: alpha('#fff', 0.4), '&:hover': { color: '#7289da' } }}>
        <EditIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <IconButton size="small" onClick={() => onDelete(profile.id)} sx={{ color: alpha('#fff', 0.4), '&:hover': { color: '#f87171' } }}>
        <DeleteIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  </Box>
);

const GameProfileForm = ({ initial = null, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({
    game_name: initial?.game_name ?? '',
    character_name: initial?.character_name ?? '',
    server: initial?.server ?? '',
    role_class: initial?.role_class ?? '',
  });

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: alpha('#fff', 0.05),
      borderRadius: '8px',
      color: '#fff',
      '& fieldset': { borderColor: alpha('#5865f2', 0.25) },
      '&:hover fieldset': { borderColor: alpha('#5865f2', 0.45) },
      '&.Mui-focused fieldset': { borderColor: '#5865f2' },
    },
    '& .MuiInputLabel-root': { color: alpha('#fff', 0.45) },
    '& .MuiInputLabel-root.Mui-focused': { color: '#7289da' },
  };

  return (
    <Box sx={{ ...CARD_SX, border: `1px solid ${alpha('#5865f2', 0.4)}` }}>
      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
        {initial ? 'Edit game profile' : 'Add game profile'}
      </Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Game" value={form.game_name} onChange={e => setForm(f => ({ ...f, game_name: e.target.value }))} sx={inputSx} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Character Name" value={form.character_name} onChange={e => setForm(f => ({ ...f, character_name: e.target.value }))} sx={inputSx} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Server (optional)" value={form.server} onChange={e => setForm(f => ({ ...f, server: e.target.value }))} sx={inputSx} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Class / Role (optional)" value={form.role_class} onChange={e => setForm(f => ({ ...f, role_class: e.target.value }))} sx={inputSx} />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button
          size="small" onClick={() => onSave(form)} disabled={!form.game_name || !form.character_name || saving}
          startIcon={saving ? <CircularProgress size={14} /> : <CheckIcon sx={{ fontSize: 16 }} />}
          sx={{ bgcolor: '#5865f2', color: '#fff', borderRadius: '8px', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#4752c4' }, '&:disabled': { opacity: 0.5 } }}
        >
          Save
        </Button>
        <Button size="small" onClick={onCancel} startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
          sx={{ color: alpha('#fff', 0.5), border: `1px solid ${alpha('#fff', 0.1)}`, borderRadius: '8px', textTransform: 'none', '&:hover': { color: '#fff' } }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

const Profile = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getMyProfile();
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      await apiService.upsertGameProfile(form);
      await loadProfile();
      setShowForm(false);
      setEditingProfile(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await apiService.deleteGameProfile(id);
    await loadProfile();
  };

  const handleEdit = (p) => {
    setEditingProfile(p);
    setShowForm(false);
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#08080f', minHeight: '100%', px: { xs: 2, md: 4 }, py: 4 }}>
        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: '14px', bgcolor: alpha('#5865f2', 0.1), mb: 3 }} />
        <Skeleton variant="rectangular" height={240} sx={{ borderRadius: '14px', bgcolor: alpha('#5865f2', 0.1) }} />
      </Box>
    );
  }

  const roles = profile?.roles ?? authUser?.roles ?? [];

  return (
    <Box sx={{ bgcolor: '#08080f', minHeight: '100%', px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 },
      backgroundImage: `radial-gradient(circle, ${alpha('#5865f2', 0.1)} 1px, transparent 1px)`,
      backgroundSize: '28px 28px',
    }}>
      <Grid container spacing={3} sx={{ maxWidth: 960, mx: 'auto' }}>

        {/* ── Identity card ──────────────────────────── */}
        <Grid item xs={12} md={4}>
          <Box sx={{ ...CARD_SX, textAlign: 'center' }}>
            <Avatar
              src={profile?.avatar_url ?? authUser?.avatar_url}
              sx={{ width: 88, height: 88, mx: 'auto', mb: 2, border: `2px solid ${alpha('#5865f2', 0.5)}`, fontSize: '2rem' }}
            >
              {(profile?.username ?? authUser?.username)?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {profile?.username ?? authUser?.username}
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.4) }}>
              #{profile?.discriminator ?? authUser?.discriminator}
            </Typography>

            <Box sx={{ height: '1px', bgcolor: alpha('#5865f2', 0.15), my: 2 }} />

            {/* Roles */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <ShieldIcon sx={{ fontSize: 14, color: alpha('#7289da', 0.7) }} />
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.4), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
                Roles ({roles.length})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
              {roles.length === 0 ? (
                <Typography variant="caption" sx={{ color: alpha('#fff', 0.3), fontStyle: 'italic' }}>No roles assigned</Typography>
              ) : (
                roles.map((role) => (
                  <Chip key={role.role_id} label={role.role_name} size="small"
                    sx={{ bgcolor: alpha(role.color || '#5865f2', 0.18), color: role.color || '#7289da', border: `1px solid ${alpha(role.color || '#5865f2', 0.35)}`, height: 22, fontSize: '0.7rem', fontWeight: 600 }} />
                ))
              )}
            </Box>
          </Box>
        </Grid>

        {/* ── Game profiles ──────────────────────────── */}
        <Grid item xs={12} md={8}>
          <Box sx={{ ...CARD_SX, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GameIcon sx={{ fontSize: 18, color: '#7289da' }} />
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 700 }}>
                  Game Profiles
                </Typography>
              </Box>
              {!showForm && !editingProfile && (
                <Button size="small" startIcon={<AddIcon sx={{ fontSize: 16 }} />} onClick={() => setShowForm(true)}
                  sx={{ color: '#7289da', border: `1px solid ${alpha('#5865f2', 0.3)}`, borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                    '&:hover': { bgcolor: alpha('#5865f2', 0.1), borderColor: alpha('#5865f2', 0.5) } }}>
                  Add
                </Button>
              )}
            </Box>

            <Stack spacing={1.5}>
              {showForm && (
                <GameProfileForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
              )}

              {(profile?.game_profiles ?? []).length === 0 && !showForm && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <GameIcon sx={{ fontSize: 36, color: alpha('#5865f2', 0.3), mb: 1 }} />
                  <Typography variant="body2" sx={{ color: alpha('#fff', 0.35) }}>
                    No game profiles yet. Add your first one.
                  </Typography>
                </Box>
              )}

              {(profile?.game_profiles ?? []).map((p) =>
                editingProfile?.id === p.id ? (
                  <GameProfileForm key={p.id} initial={p} onSave={handleSave} onCancel={() => setEditingProfile(null)} saving={saving} />
                ) : (
                  <GameProfileCard key={p.id} profile={p} onDelete={handleDelete} onEdit={handleEdit} />
                )
              )}
            </Stack>
          </Box>
        </Grid>

      </Grid>
    </Box>
  );
};

export default Profile;
