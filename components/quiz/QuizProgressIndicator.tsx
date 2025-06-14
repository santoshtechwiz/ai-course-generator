"use client"

import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"

interface QuizProgressIndicatorProps {
  current: number
  total: number
  className?: string
  showPercentage?: boolean
  showNumbers?: boolean
}

export function QuizProgressIndicator({
  current,
  total,
  className = "",
  showPercentage = true,
  showNumbers = true,
}: QuizProgressIndicatorProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className={`space-y-2 ${className}`}>
      {showNumbers && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Question {current} of {total}</span>
          {showPercentage && (
            <motion.span
              key={percentage}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-medium text-primary"
            >
              {percentage}% Complete
            </motion.span>
          )}
        </div>
      )}
      <div className="relative">
        <Progress value={percentage} className="h-2" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 0.5,
          }}
          style={{ opacity: percentage > 0 ? 1 : 0 }}
        />
      </div>
    </div>
  )
}
