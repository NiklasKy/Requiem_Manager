import React from 'react';
import {
  Card,
  CardContent,
  useTheme,
  alpha,
  keyframes
} from '@mui/material';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const ModernCard = ({ 
  children, 
  elevation = 0, 
  sx = {},
  showShimmer = true,
  ...props 
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={elevation}
      {...props}
      sx={{
        background: isDark
          ? alpha('#1a1a1a', 0.8)
          : alpha('#ffffff', 0.25),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(isDark ? '#ffffff' : '#ffffff', 0.2)}`,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark 
            ? '0 8px 32px rgba(255, 255, 255, 0.1)'
            : '0 8px 32px rgba(0, 0, 0, 0.2)',
        },
        ...(showShimmer && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.1)}, transparent)`,
            animation: `${shimmer} 4s infinite`,
            pointerEvents: 'none',
            zIndex: 1,
          }
        }),
        ...sx
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 2 }}>
        {children}
      </CardContent>
    </Card>
  );
};

export default ModernCard;
