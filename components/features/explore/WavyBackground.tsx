"use client";

export function WavyBackground() {
  return (
    <svg
      className="absolute inset-0 -z-10"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      viewBox="0 0 1440 560"
    >
      <path
        fill="currentColor"
        fillOpacity="0.05"
        d="M0,224L60,229.3C120,235,240,245,360,234.7C480,224,600,192,720,181.3C840,171,960,181,1080,181.3C1200,181,1320,171,1380,165.3L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
      ></path>
    </svg>
  );
}
