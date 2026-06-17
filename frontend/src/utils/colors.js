/**
 * Returns white or black depending on which has better contrast against the given hex color.
 */
export const getContrastTextColor = (hexColor, fallbackDark = '#000000', fallbackLight = '#ffffff') => {
  if (!hexColor) return fallbackLight;
  const color = hexColor.replace('#', '');
  if (color.length !== 6) return fallbackLight;
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? fallbackDark : fallbackLight;
};

/**
 * Converts a numeric role color (Discord integer) to a CSS hex string.
 */
export const roleColorToHex = (color) => {
  if (!color && color !== 0) return '#99aab5';
  return `#${color.toString(16).padStart(6, '0')}`;
};

/**
 * Returns the MUI chip sx style for a change type (username / nickname / role).
 * Uses inline styles only — no MUI icons here so it stays dependency-free.
 */
export const getChangeTypeChipSx = (type) => {
  const base = { fontWeight: 600, fontSize: '0.75rem', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.7)' };
  switch (type) {
    case 'username':
      return { ...base, backgroundColor: '#c0392b', '&:hover': { backgroundColor: '#e74c3c' } };
    case 'nickname':
      return { ...base, backgroundColor: '#43b581', '&:hover': { backgroundColor: '#3ca374' } };
    case 'role':
      return { ...base, backgroundColor: '#faa61a', color: '#000000', textShadow: 'none', '&:hover': { backgroundColor: '#e8940f' } };
    default:
      return { ...base, backgroundColor: '#99aab5', color: '#2c2f33', textShadow: 'none', '&:hover': { backgroundColor: '#87909c' } };
  }
};
