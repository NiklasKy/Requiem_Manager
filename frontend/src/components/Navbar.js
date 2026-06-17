import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  alpha,
  Chip,
  Tooltip,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HomeIcon from '@mui/icons-material/Home';
import EventIcon from '@mui/icons-material/Event';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import HistoryIcon from '@mui/icons-material/History';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

const MEMBER_NAV = [
  { path: '/', label: 'Home', icon: <HomeIcon sx={{ fontSize: 18 }} /> },
  { path: '/events', label: 'Events', icon: <EventIcon sx={{ fontSize: 18 }} /> },
  { path: '/leaderboard', label: 'Leaderboard', icon: <EmojiEventsIcon sx={{ fontSize: 18 }} /> },
  { path: '/news', label: 'News', icon: <NewspaperIcon sx={{ fontSize: 18 }} /> },
  { path: '/changes', label: 'Changes', icon: <HistoryIcon sx={{ fontSize: 18 }} /> },
];

const ADMIN_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
  { path: '/users', label: 'Users', icon: <PeopleIcon sx={{ fontSize: 18 }} /> },
  { path: '/admin', label: 'Admin', icon: <AdminPanelSettingsIcon sx={{ fontSize: 18 }} /> },
];

const CR    = '#c0392b';
const CR_LT = '#e74c3c';
const CINZEL = '"Cinzel", "Palatino Linotype", serif';

const NavButton = ({ item, isActive, onClick }) => (
  <Button
    onClick={onClick}
    startIcon={item.icon}
    size="small"
    sx={{
      color: isActive ? '#fff' : alpha('#fff', 0.55),
      textTransform: 'none',
      fontWeight: isActive ? 600 : 500,
      fontSize: '0.85rem',
      px: 1.5,
      py: 0.75,
      borderRadius: '8px',
      minWidth: 0,
      bgcolor: isActive ? alpha(CR, 0.18) : 'transparent',
      border: `1px solid ${isActive ? alpha(CR, 0.50) : 'transparent'}`,
      transition: 'all 0.15s ease',
      '&:hover': {
        bgcolor: alpha(CR, isActive ? 0.24 : 0.10),
        color: '#fff',
        border: `1px solid ${alpha(CR, 0.30)}`,
      },
    }}
  >
    {item.label}
  </Button>
);

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/login');
  };

  const handleViewProfile = () => {
    setAnchorEl(null);
    navigate('/profile');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#08080f',
        borderBottom: `1px solid ${alpha(CR, 0.20)}`,
        top: 0,
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 }, gap: 2, minHeight: '56px !important' }}>
        {/* Logo + wordmark */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', mr: 1 }}
          onClick={() => navigate('/')}
        >
          <Box
            component="img"
            src="/icons/Requiem-logo.png"
            alt="Requiem"
            sx={{ width: 30, height: 30, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Typography
            variant="body1"
            sx={{ fontWeight: 700, color: '#fff', letterSpacing: '0.05em', whiteSpace: 'nowrap', fontFamily: CINZEL }}
          >
            REQUIEM
          </Typography>
        </Box>

        {/* Member nav */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 0.5, alignItems: 'center' }}>
          {MEMBER_NAV.map((item) => (
            <NavButton
              key={item.path}
              item={item}
              isActive={isActive(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
        </Box>

        {/* Admin nav — separated by a subtle vertical rule */}
        {isAdmin() && (
          <>
            <Box sx={{ display: { xs: 'none', lg: 'flex' }, width: '1px', height: 20, bgcolor: alpha(CR, 0.35), mx: 0.5 }} />
            <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 0.5, alignItems: 'center' }}>
              {ADMIN_NAV.map((item) => (
                <Tooltip key={item.path} title="Admin" placement="bottom" arrow>
                  <span>
                    <NavButton
                      item={item}
                      isActive={isActive(item.path)}
                      onClick={() => navigate(item.path)}
                    />
                  </span>
                </Tooltip>
              ))}
            </Box>
          </>
        )}

        <Box sx={{ flex: 1 }} />

        {/* User avatar + dropdown */}
        {user && (
          <>
            <Button
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                textTransform: 'none',
                color: '#fff',
                borderRadius: '10px',
                px: 1.25,
                py: 0.5,
                border: `1px solid ${alpha(CR, 0.22)}`,
                bgcolor: alpha(CR, 0.07),
                gap: 1,
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: alpha(CR, 0.16),
                  border: `1px solid ${alpha(CR, 0.42)}`,
                },
              }}
            >
              <Avatar
                src={user.avatar_url}
                sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
              >
                {user.username?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                {user.username}
              </Typography>
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  mt: 1,
              bgcolor: '#100a0a',
              border: `1px solid ${alpha(CR, 0.28)}`,
                  borderRadius: '12px',
                  boxShadow: `0 16px 48px rgba(0,0,0,0.5)`,
                  minWidth: 220,
                  '& .MuiMenuItem-root': {
                    borderRadius: '8px',
                    mx: 0.75,
                    my: 0.25,
                    fontSize: '0.875rem',
                    color: alpha('#fff', 0.75),
                    '&:hover': { bgcolor: alpha(CR, 0.12), color: '#fff' },
                  },
                },
              }}
            >
              {/* Profile header */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                  {user.username}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${user.roles?.length || 0} roles`}
                    size="small"
                    sx={{ bgcolor: alpha(CR, 0.18), color: CR_LT, height: 20, fontSize: '0.7rem' }}
                  />
                  {isAdmin() && (
                    <Chip
                      label="Admin"
                      size="small"
                      sx={{ bgcolor: alpha('#ef4444', 0.2), color: '#f87171', height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              </Box>

              <Divider sx={{ borderColor: alpha(CR, 0.15), mx: 1 }} />

              <MenuItem onClick={handleViewProfile}>
                <ListItemIcon><AccountCircleIcon sx={{ fontSize: 18, color: CR_LT }} /></ListItemIcon>
                <ListItemText primary={<Typography variant="body2" fontWeight={600}>My Profile</Typography>} />
              </MenuItem>

              {/* Mobile-only nav items */}
              <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
                <Divider sx={{ borderColor: alpha(CR, 0.15), mx: 1, my: 0.5 }} />
                {MEMBER_NAV.map((item) => (
                  <MenuItem key={item.path} onClick={() => { setAnchorEl(null); navigate(item.path); }}>
                    <ListItemIcon>{React.cloneElement(item.icon, { sx: { fontSize: 18, color: CR_LT } })}</ListItemIcon>
                    <ListItemText primary={<Typography variant="body2">{item.label}</Typography>} />
                  </MenuItem>
                ))}
                {isAdmin() && ADMIN_NAV.map((item) => (
                  <MenuItem key={item.path} onClick={() => { setAnchorEl(null); navigate(item.path); }}>
                    <ListItemIcon>{React.cloneElement(item.icon, { sx: { fontSize: 18, color: CR_LT } })}</ListItemIcon>
                    <ListItemText primary={<Typography variant="body2">{item.label}</Typography>} />
                  </MenuItem>
                ))}
              </Box>

              <Divider sx={{ borderColor: alpha(CR, 0.15), mx: 1 }} />

              <MenuItem onClick={handleLogout} sx={{ color: `${alpha('#ef4444', 0.85)} !important`, '&:hover': { bgcolor: `${alpha('#ef4444', 0.1)} !important`, color: '#f87171 !important' } }}>
                <ListItemIcon><LogoutIcon sx={{ fontSize: 18, color: '#f87171' }} /></ListItemIcon>
                <ListItemText primary={<Typography variant="body2" fontWeight={600}>Sign Out</Typography>} />
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
