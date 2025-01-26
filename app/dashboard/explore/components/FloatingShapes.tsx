"use client";

export function FloatingShapes() {
  return (
    <svg
      className="absolute inset-0 -z-10"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      viewBox="0 0 1440 560"
    >
      <circle cx="100" cy="100" r="20" fill="currentColor" fillOpacity="0.1" />
      <rect x="300" y="300" width="40" height="40" fill="currentColor" fillOpacity="0.1" />
      <polygon points="1300,100 1320,150 1280,150" fill="currentColor" fillOpacity="0.1" />
    </svg>
  );
}
