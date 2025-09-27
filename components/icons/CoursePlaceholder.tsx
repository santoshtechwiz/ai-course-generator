import * as React from 'react'

const CoursePlaceholder: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 240 160" width="240" height="160" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="ph-grad" x1="0" x2="1">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#ffffff" />
      </linearGradient>
      <linearGradient id="ph-img" x1="0" x2="1">
        <stop offset="0%" stopColor="#eef2ff" />
        <stop offset="100%" stopColor="#f0fff4" />
      </linearGradient>
    </defs>

    {/* outer rounded panel */}
    <rect x="2" y="2" width="236" height="156" rx="12" fill="url(#ph-grad)" stroke="#eef2ff" />

    {/* image area */}
    <rect x="12" y="12" width="216" height="80" rx="8" fill="url(#ph-img)" />

    {/* simple scene: mountain + sun */}
    <path d="M28 84 L64 48 L108 84 Z" fill="#7c3aed" opacity="0.95" />
    <circle cx="44" cy="56" r="6" fill="#0ea5a4" />

    {/* person silhouette (abstract) */}
    <g transform="translate(150, 36)">
      <ellipse cx="0" cy="14" rx="18" ry="12" fill="#111827" opacity="0.08" />
      <path d="M-6 2 C-6 -6 6 -6 6 2 C6 10 -6 10 -6 2 Z" fill="#111827" opacity="0.12" />
      <rect x="-8" y="18" width="16" height="30" rx="6" fill="#111827" opacity="0.08" />
    </g>

    {/* play badge */}
    <g transform="translate(198, 60)">
      <circle cx="0" cy="0" r="12" fill="#2563eb" />
      <path d="M-4 -6 L6 0 L-4 6 Z" fill="white" />
    </g>

    {/* title lines */}
    <rect x="16" y="104" width="152" height="12" rx="4" fill="#f8fafc" />
    <rect x="16" y="122" width="110" height="10" rx="4" fill="#f8fafc" />

    {/* chips */}
    <rect x="16" y="136" width="70" height="12" rx="6" fill="#eef2ff" />
    <rect x="96" y="136" width="70" height="12" rx="6" fill="#ecfdf5" />
    <rect x="176" y="136" width="48" height="12" rx="6" fill="#fff7ed" />

    {/* subtle divider */}
    <line x1="12" y1="98" x2="228" y2="98" stroke="#eef2f6" strokeWidth="1" />
  </svg>
)

export default CoursePlaceholder
