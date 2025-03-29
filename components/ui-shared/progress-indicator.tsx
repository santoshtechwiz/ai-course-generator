import { cn } from "@/lib/utils"

interface ProgressIndicatorProps {
  current: number
  total: number
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export const ProgressIndicator = ({
  current,
  total,
  className,
  showText = true,
  size = "md",
}: ProgressIndicatorProps) => {
  const percentage = Math.round((current / total) * 100)

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }

  return (
    <div className={cn("w-full", className)}>
      {showText && (
        <div className="flex justify-between mb-1 text-sm text-gray-600 dark:text-gray-300">
          <span>{`${current} of ${total}`}</span>
          <span>{`${percentage}%`}</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
        <div
          className={cn("bg-primary rounded-full transition-all duration-300", sizeClasses[size])}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

