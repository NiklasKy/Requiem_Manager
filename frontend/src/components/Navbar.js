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
  useTheme,
  alpha,
  Chip
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/users', label: 'Users', icon: <PeopleIcon /> },
    { path: '/changes', label: 'Recent Changes', icon: <HistoryIcon /> },
    { path: '/admin', label: 'Admin', icon: <AdminPanelSettingsIcon />, requireAdmin: true },
  ].filter(item => !item.requireAdmin || isAdmin());

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewProfile = () => {
    const defaultGuildId = process.env.REACT_APP_DEFAULT_GUILD_ID || '123456789012345678';
    navigate(`/users/${user.user_id}?guild=${defaultGuildId}`);
    handleProfileMenuClose();
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: isDark
          ? 'rgba(26, 26, 26, 0.9)'
          : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${alpha(isDark ? '#ffffff' : '#000000', 0.1)}`,
        color: isDark ? '#ffffff' : '#1a1a1a'
      }}
    >
      <Toolbar sx={{ px: 3 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            flexGrow: 1
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(88, 101, 242, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              border: `2px solid ${alpha('#ffffff', 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 6px 20px rgba(88, 101, 242, 0.4)',
              }
            }}
          >
            <img
              src="/icons/Requiem-logo.png"
              alt="Requiem Logo"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}
              onError={(e) => {
                // Fallback to "R" if logo doesn't load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                display: 'none', // Hidden by default, shown if image fails
                position: 'absolute',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              R
            </Typography>
          </Box>
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              background: isDark
                ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                : 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Requiem Tracking
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {menuItems.map((item) => (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              startIcon={item.icon}
              sx={{
                color: isDark ? '#ffffff' : '#1a1a1a',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                ...(location.pathname === item.path && {
                  background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
                  color: 'white',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(88, 101, 242, 0.4)',
                }),
                '&:hover': {
                  background: location.pathname === item.path 
                    ? 'linear-gradient(135deg, #4752c4 0%, #5865f2 100%)'
                    : alpha(isDark ? '#ffffff' : '#5865f2', 0.1),
                  transform: 'translateY(-1px)',
                  boxShadow: location.pathname === item.path 
                    ? '0 6px 20px rgba(88, 101, 242, 0.5)'
                    : '0 4px 12px rgba(88, 101, 242, 0.2)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transition: 'left 0.5s',
                },
                '&:hover::before': {
                  left: '100%',
                }
              }}
            >
              {item.label}
            </Button>
          ))}
          
          <Box sx={{ mx: 2 }}>
            <ThemeToggle />
          </Box>
          
          {user && (
            <>
              <Button
                onClick={handleProfileMenuOpen}
                sx={{ 
                  textTransform: 'none',
                  color: isDark ? '#ffffff' : '#1a1a1a',
                  borderRadius: 3,
                  px: 2,
                  py: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: alpha(isDark ? '#ffffff' : '#5865f2', 0.1),
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(88, 101, 242, 0.2)',
                  },
                }}
              >
                <Avatar 
                  src={user.avatar_url} 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    mr: 2,
                    border: `2px solid ${alpha('#ffffff', 0.2)}`,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {user.username?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      lineHeight: 1.2
                    }}
                  >
                    {user.username}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      opacity: 0.7,
                      fontSize: '0.7rem'
                    }}
                  >
                    {user.roles?.length || 0} roles
                  </Typography>
                </Box>
              </Button>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    background: isDark
                      ? alpha('#1a1a1a', 0.95)
                      : alpha('#ffffff', 0.95),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(isDark ? '#ffffff' : '#000000', 0.1)}`,
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    minWidth: 250,
                    '& .MuiMenuItem-root': {
                      borderRadius: 2,
                      mx: 1,
                      my: 0.5,
                      '&:hover': {
                        background: alpha('#5865f2', 0.1),
                      }
                    }
                  }
                }}
              >
                <MenuItem disabled sx={{ py: 2 }}>
                  <ListItemIcon>
                    <PersonIcon sx={{ color: '#5865f2' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography variant="body1" fontWeight={600}>
                        {user.username}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={`${user.roles?.length || 0} roles`}
                          size="small"
                          sx={{
                            background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
                            color: 'white',
                            fontSize: '0.7rem',
                            height: '24px'
                          }}
                        />
                        {isAdmin() && (
                          <Chip 
                            label="Admin"
                            size="small"
                            sx={{
                              ml: 1,
                              background: 'linear-gradient(135deg, #f44336 0%, #ff7043 100%)',
                              color: 'white',
                              fontSize: '0.7rem',
                              height: '24px'
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                </MenuItem>
                <Divider sx={{ my: 1, opacity: 0.3 }} />
                <MenuItem 
                  onClick={handleViewProfile}
                  sx={{
                    '&:hover': {
                      background: alpha('#5865f2', 0.1),
                    }
                  }}
                >
                  <ListItemIcon>
                    <AccountCircleIcon sx={{ color: '#5865f2' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        View Profile
                      </Typography>
                    } 
                  />
                </MenuItem>
                <MenuItem 
                  onClick={handleLogout}
                  sx={{
                    color: '#f44336',
                    '&:hover': {
                      background: alpha('#f44336', 0.1),
                    }
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon sx={{ color: '#f44336' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        Sign Out
                      </Typography>
                    } 
                  />
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
