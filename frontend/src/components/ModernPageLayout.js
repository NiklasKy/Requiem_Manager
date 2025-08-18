import React from 'react';
import {
  Box,
  Container,
  useTheme,
  alpha,
  keyframes
} from '@mui/material';

// Shared animations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const ModernPageLayout = ({ 
  children, 
  maxWidth = "lg", 
  disablePadding = false,
  showShimmer = true,
  customBackground = null 
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: customBackground || (isDark 
          ? 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 50%, #2d1b69 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
        position: 'relative',
        overflow: 'hidden',
        py: disablePadding ? 0 : 4,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDark
            ? 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.2) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 200, 255, 0.2) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
          pointerEvents: 'none',
        }
      }}
    >
      <Container maxWidth={maxWidth} sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Container>
    </Box>
  );
};

export default ModernPageLayout;
