import React from 'react'

interface LogoProps {
  variant?: 'default' | 'compact' | 'text-only'
  textColor?: string
  iconColor?: string
  size?: 'small' | 'medium' | 'large'
}

export default function Logo({ 
  variant = 'default', 
  textColor = '#2D3748', 
  iconColor = '#4FD1C5', 
  size = 'medium'
}: LogoProps) {
  const dimensions = {
    small: { width: 150, height: 40, fontSize: 20, iconSize: 30 },
    medium: { width: 200, height: 50, fontSize: 24, iconSize: 40 },
    large: { width: 300, height: 80, fontSize: 36, iconSize: 60 }
  }

  const { width, height, fontSize, iconSize } = dimensions[size]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {variant !== 'text-only' && (
        <g transform={`translate(${iconSize / 4}, ${height / 2 - iconSize / 2})`}>
          <circle cx={iconSize / 2} cy={iconSize / 2} r={iconSize / 2} fill={iconColor} />
          <path
            d={`M${iconSize / 2} ${iconSize / 5}
               A${3 * iconSize / 10} ${3 * iconSize / 10} 0 0 1 ${4 * iconSize / 5} ${iconSize / 2}
               A${3 * iconSize / 10} ${3 * iconSize / 10} 0 0 1 ${iconSize / 2} ${4 * iconSize / 5}
               A${3 * iconSize / 10} ${3 * iconSize / 10} 0 0 1 ${iconSize / 5} ${iconSize / 2}
               A${3 * iconSize / 10} ${3 * iconSize / 10} 0 0 1 ${iconSize / 2} ${iconSize / 5}`}
            stroke="white"
            strokeWidth={iconSize / 10}
          />
          <circle cx={iconSize / 2} cy={iconSize / 2} r={iconSize / 5} fill="white" />
        </g>
      )}
      {variant !== 'compact' && (
        <text
          x={variant === 'text-only' ? width / 20 : width / 3}
          y={height / 2 + fontSize / 3}
          fontFamily="Arial, sans-serif"
          fontSize={fontSize}
          fontWeight="bold"
          fill={textColor}
        >
          CourseAI
        </text>
      )}
    </svg>
  )
}