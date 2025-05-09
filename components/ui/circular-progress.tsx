"use client"
import { motion } from "framer-motion"

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  className?: string
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  className,
}: CircularProgressProps) {
  // Ensure value is between 0 and 100
  const safeValue = Math.min(100, Math.max(0, value))

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (safeValue / 100) * circumference

  // Determine color based on value
  const getColor = () => {
    if (safeValue >= 80) return "var(--green-500, #22c55e)"
    if (safeValue >= 60) return "var(--yellow-500, #eab308)"
    return "var(--red-500, #ef4444)"
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--gray-200, #e5e7eb)"
          strokeWidth={strokeWidth}
          className="dark:stroke-gray-800"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>

      {/* Label */}
      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            className="text-2xl font-bold"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {label}
          </motion.span>
          {sublabel && (
            <motion.span
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              {sublabel}
            </motion.span>
          )}
        </div>
      )}
    </div>
  )
}
