/**
 * Returns a human-readable relative time string (e.g. "3m ago", "2h ago").
 * Falls back to a localised date string for anything older than 7 days.
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '—';
  const now = new Date();
  const date = new Date(timestamp);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
};

/**
 * Returns the full, locale-aware absolute timestamp string.
 * Used as tooltip fallback for relative timestamps.
 */
export const formatAbsoluteTime = (timestamp) => {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString();
};
