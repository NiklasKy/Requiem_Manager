import { alpha } from '@mui/material';

// Requiem brand crimson
const CRIMSON = '#c0392b';

/**
 * Returns a fixed set of Requiem Dark Fantasy color values.
 * The app is always rendered in dark mode — no theme branching needed.
 */
const useThemeColors = () => ({
  isDark: true,

  // Brand accent
  crimson: CRIMSON,
  crimsonLight: '#e74c3c',
  crimsonDark: '#8b0000',

  // Text hierarchy
  textPrimary:   'rgba(255,255,255,0.95)',
  textSecondary: 'rgba(255,255,255,0.70)',
  textMuted:     'rgba(255,255,255,0.45)',
  textCaption:   'rgba(255,255,255,0.55)',

  // Card / surface
  cardBg:          alpha('#ffffff', 0.03),
  cardBorder:      alpha(CRIMSON, 0.22),
  cardHoverBg:     alpha(CRIMSON, 0.07),
  cardHoverBorder: alpha(CRIMSON, 0.40),

  // Inputs
  inputBg:      alpha('#ffffff', 0.05),
  inputHoverBg: alpha('#ffffff', 0.08),
  inputFocusBg: alpha('#ffffff', 0.08),

  // Subtle containers
  subtleBg:     alpha('#ffffff', 0.04),
  subtleBorder: alpha(CRIMSON, 0.14),

  // Skeleton
  skeletonBg: alpha(CRIMSON, 0.12),
});

export default useThemeColors;
