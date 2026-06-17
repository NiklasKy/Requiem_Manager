import React from 'react';
import { Box, Typography } from '@mui/material';
import useThemeColors from '../hooks/useThemeColors';

const COLOR_MAP = {
  primary:   { main: '#c0392b', gradient: 'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)', shadow: 'rgba(192,57,43,0.4)' },
  secondary: { main: '#9c27b0', gradient: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)', shadow: 'rgba(156,39,176,0.4)' },
  success:   { main: '#4caf50', gradient: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)', shadow: 'rgba(76,175,80,0.4)' },
  warning:   { main: '#ff9800', gradient: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)', shadow: 'rgba(255,152,0,0.4)' },
  error:     { main: '#f44336', gradient: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)', shadow: 'rgba(244,67,54,0.4)' },
  info:      { main: '#2196f3', gradient: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)', shadow: 'rgba(33,150,243,0.4)' },
};

const StatCard = ({ title, value, icon, color = 'primary' }) => {
  const { cardBg, cardBorder, textSecondary } = useThemeColors();
  const cfg = COLOR_MAP[color] || COLOR_MAP.primary;

  return (
    <Box
      sx={{
        height: '100%',
        position: 'relative',
        background: cardBg,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${cardBorder}`,
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 10px 32px ${cfg.shadow}`,
          borderColor: cfg.main,
          '& .stat-shimmer': { transform: 'translateX(100%)' },
          '& .stat-icon': { transform: 'scale(1.08)' },
        },
        '& .stat-shimmer': {
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1,
          transform: 'translateX(-100%)',
          transition: 'transform 0.55s ease',
        },
      }}
    >
      <span className="stat-shimmer" />
      <Box sx={{ p: 3, position: 'relative', zIndex: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Typography
              variant="body2"
              sx={{
                color: textSecondary,
                fontWeight: 500,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 1.5,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              className="stat-value"
              sx={{
                fontWeight: 700,
                fontSize: '2.25rem',
                lineHeight: 1,
                transition: 'color 0.25s ease',
                background: cfg.gradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {value?.toLocaleString() ?? '0'}
            </Typography>
          </Box>

          {icon && (
            <Box
              className="stat-icon"
              sx={{
                ml: 2,
                p: 1.75,
                borderRadius: '50%',
                background: cfg.gradient,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 14px ${cfg.shadow}`,
                transition: 'transform 0.25s ease',
                '& svg': { fontSize: '1.6rem' },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: cfg.gradient,
            opacity: 0.7,
          }}
        />
      </Box>
    </Box>
  );
};

export default StatCard;
