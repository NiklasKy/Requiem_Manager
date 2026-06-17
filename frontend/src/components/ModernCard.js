import React from 'react';
import { Card, CardContent } from '@mui/material';
import { alpha } from '@mui/material/styles';

const ModernCard = ({ children, elevation = 0, sx = {}, ...props }) => (
  <Card
    elevation={elevation}
    {...props}
    sx={{
      background: alpha('#ffffff', 0.03),
      backdropFilter: 'blur(12px)',
      border: `1px solid ${alpha('#5865f2', 0.18)}`,
      borderRadius: '14px',
      overflow: 'visible',
      position: 'relative',
      transition: 'border-color 0.2s ease, background 0.2s ease',
      '&:hover': {
        background: alpha('#5865f2', 0.05),
        borderColor: alpha('#5865f2', 0.35),
      },
      ...sx,
    }}
  >
    <CardContent>{children}</CardContent>
  </Card>
);

export default ModernCard;
