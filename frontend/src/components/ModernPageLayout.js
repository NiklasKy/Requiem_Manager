import React from 'react';
import { Box, Container } from '@mui/material';
import { alpha } from '@mui/material/styles';

const CR = '#c0392b';

const ModernPageLayout = ({
  children,
  maxWidth = 'lg',
  disablePadding = false,
}) => (
  <Box
    sx={{
      minHeight: '100%',
      bgcolor: '#08080f',
      position: 'relative',
      overflow: 'hidden',
      py: disablePadding ? 0 : 4,
      backgroundImage: `radial-gradient(circle, ${alpha(CR, 0.10)} 1px, transparent 1px)`,
      backgroundSize: '28px 28px',
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(ellipse 80% 40% at 50% 0%, ${alpha(CR, 0.10)} 0%, transparent 70%)`,
        pointerEvents: 'none',
      },
    }}
  >
    <Container maxWidth={maxWidth} sx={{ position: 'relative', zIndex: 1 }}>
      {children}
    </Container>
  </Box>
);

export default ModernPageLayout;
