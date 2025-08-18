import React from 'react';
import { Box, Typography, useTheme, alpha, keyframes } from '@mui/material';

const glow = keyframes`
  0%, 100% { 
    box-shadow: 0 4px 20px rgba(88, 101, 242, 0.3);
  }
  50% { 
    box-shadow: 0 6px 30px rgba(88, 101, 242, 0.5);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
`;

const StatCard = ({ title, value, icon, color = 'primary' }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const getColorConfig = (colorName) => {
    const colors = {
      primary: { main: '#5865f2', gradient: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)', shadow: 'rgba(88, 101, 242, 0.4)' },
      secondary: { main: '#9c27b0', gradient: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)', shadow: 'rgba(156, 39, 176, 0.4)' },
      success: { main: '#4caf50', gradient: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)', shadow: 'rgba(76, 175, 80, 0.4)' },
      warning: { main: '#ff9800', gradient: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)', shadow: 'rgba(255, 152, 0, 0.4)' },
      error: { main: '#f44336', gradient: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)', shadow: 'rgba(244, 67, 54, 0.4)' },
      info: { main: '#2196f3', gradient: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)', shadow: 'rgba(33, 150, 243, 0.4)' },
    };
    return colors[colorName] || colors.primary;
  };

  const colorConfig = getColorConfig(color);

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
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 12px 40px ${colorConfig.shadow}`,
          border: `1px solid ${alpha(colorConfig.main, 0.4)}`,
          '& .stat-icon': {
            animation: `${float} 2s ease-in-out infinite`,
          },
          '& .stat-value': {
            color: colorConfig.main,
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
    >
      <Box sx={{ p: 3, height: '100%' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
          <Box flex={1}>
            <Typography 
              variant="body2" 
              gutterBottom
              sx={{ 
                color: alpha('#ffffff', 0.7),
                fontWeight: 500,
                fontSize: '0.9rem',
                mb: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              component="div"
              className="stat-value"
              sx={{
                color: alpha('#ffffff', 0.95),
                fontWeight: 700,
                fontSize: '2.5rem',
                lineHeight: 1,
                transition: 'color 0.3s ease',
                background: colorConfig.gradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {value?.toLocaleString() || '0'}
            </Typography>
          </Box>
          
          {icon && (
            <Box 
              className="stat-icon"
              sx={{ 
                ml: 2,
                p: 2,
                borderRadius: '50%',
                background: colorConfig.gradient,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 15px ${colorConfig.shadow}`,
                transition: 'all 0.3s ease',
                '& svg': {
                  fontSize: '1.8rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
        
        {/* Bottom accent line */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: colorConfig.gradient,
            opacity: 0.8,
          }}
        />
      </Box>
    </Box>
  );
};

export default StatCard;
