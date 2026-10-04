import React from 'react';

export default function PublicArrow({ diagonal = false }) {
  return (
    <svg
      className="rq-arrow"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
