"use client"

import * as React from "react"

interface CourseIconProps {
  className?: string
  size?: number
}

export const CourseIcon: React.FC<CourseIconProps> = ({ className = "", size = 64 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Course preview icon"
    >
      <defs>
        <linearGradient id="ci-grad" x1="0" x2="1">
          <stop offset="0%" stopColor="#eef2ff" />
          <stop offset="100%" stopColor="#e6fffa" />
        </linearGradient>
        <linearGradient id="ci-img" x1="0" x2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#c7f9f1" />
        </linearGradient>
      </defs>

      {/* Rounded card background */}
      <rect x="1" y="1" width="118" height="78" rx="10" fill="white" stroke="#f1f5f9" />

      {/* Top image panel */}
      <rect x="6" y="6" width="108" height="36" rx="6" fill="url(#ci-img)" />
      {/* decorative triangle / mountain */}
      <path d="M18 32 L36 16 L56 32 Z" fill="#7c3aed" opacity="0.95" />
      <circle cx="22" cy="18" r="3" fill="#0ea5a4" />

      {/* Play badge */}
      <g transform="translate(88, 26)">
        <circle cx="0" cy="0" r="10" fill="#2563eb" opacity="0.95" />
        <path d="M-3 -5 L6 0 L-3 5 Z" fill="white" />
      </g>

      {/* Title area */}
      <rect x="12" y="46" width="82" height="8" rx="2" fill="#f8fafc" />
      <rect x="12" y="56" width="54" height="6" rx="2" fill="#f8fafc" />

      {/* Small stats chips */}
      <g transform="translate(12, 66)">
        <rect x="0" y="0" width="28" height="10" rx="5" fill="#eef2ff" />
        <rect x="36" y="0" width="28" height="10" rx="5" fill="#ecfdf5" />
        <rect x="72" y="0" width="28" height="10" rx="5" fill="#fff7ed" />
      </g>

      {/* subtle shadow */}
      <rect x="4" y="56" width="112" height="22" rx="8" fill="rgba(2,6,23,0.02)" />
    </svg>
  )
}

export default CourseIcon