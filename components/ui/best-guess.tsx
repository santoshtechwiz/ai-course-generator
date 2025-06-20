"use client"

import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useMemo } from "react"
import { CheckIcon, XIcon, AlertTriangleIcon, InfoIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getSimilarityFeedback } from "@/lib/utils/similarity-scoring"

interface BestGuessProps {
  userAnswer: string
  correctAnswer: string
  similarity?: number
  explanation?: string
  animationDelay?: number
  className?: string
  /**
   * Array of similar correct answers to show as alternatives
   */
  similarAnswers?: string[]
  /**
   * Show more detailed similarity information
   */
  showDetailedInfo?: boolean
}

export function BestGuess({ 
  userAnswer, 
  correctAnswer, 
  similarity = 0, 
  explanation, 
  animationDelay = 0, 
  className,
  similarAnswers = [],
  showDetailedInfo = false
}: BestGuessProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Get feedback message based on similarity score
  const feedbackMessage = getSimilarityFeedback(similarity)
  
  // Calculate score points (for partial credit)
  const points = similarity >= 0.9 ? 1 : similarity >= 0.7 ? 0.5 : 0
  
  const { color, bgColor, borderColor, icon, label, progressColor } = useMemo(() => {
    // Calculate similarity level with proper thresholds (90% full, 70-90% partial, <70% none)
    if (similarity >= 0.9) {
      return {
        color: isDark ? "text-green-400" : "text-green-600",
        bgColor: isDark ? "bg-green-950/40" : "bg-green-50",
        borderColor: isDark ? "border-green-800" : "border-green-200",
        icon: <CheckIcon className="h-4 w-4 text-green-500" />,
        label: "Correct",
        progressColor: "bg-green-500",
      }
    } else if (similarity >= 0.7) {
      return {
        color: isDark ? "text-blue-400" : "text-blue-600",
        bgColor: isDark ? "bg-blue-950/40" : "bg-blue-50",
        borderColor: isDark ? "border-blue-800" : "border-blue-200",
        icon: <CheckIcon className="h-4 w-4 text-blue-500" />,
        label: "Almost Correct",
        progressColor: "bg-blue-500",
      }
    } else if (similarity >= 0.5) {
      return {
        color: isDark ? "text-yellow-400" : "text-yellow-600",
        bgColor: isDark ? "bg-yellow-950/40" : "bg-yellow-50",
        borderColor: isDark ? "border-yellow-800" : "border-yellow-200",
        icon: <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />,
        label: "Close",
        progressColor: "bg-yellow-500",
      }
    } else {
      return {
        color: isDark ? "text-red-400" : "text-red-600",
        bgColor: isDark ? "bg-red-950/40" : "bg-red-50",
        borderColor: isDark ? "border-red-800" : "border-red-200",
        icon: <XIcon className="h-4 w-4 text-red-500" />,
        label: "Incorrect",
        progressColor: "bg-red-500",
      }
    }
  }, [similarity, isDark])

  // Format similarity for display (e.g., 0.87 -> 87%)
  const similarityDisplay = Math.round(similarity * 100)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      className={cn("rounded-md border p-4 mb-4", borderColor, bgColor, className)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {icon}
          <span className={`ml-2 font-medium ${color}`}>{label}</span>
          {similarityDisplay > 0 && (
            <Badge variant="outline" className="ml-2 text-xs">
              Match: {similarityDisplay}%
            </Badge>
          )}
        </div>
      </div>
      
      {/* Progress bar to visually indicate match quality */}
      <div className="mb-3">
        <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${progressColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${similarityDisplay}%` }}
            transition={{ delay: animationDelay + 0.2, duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{feedbackMessage}</p>
      </div>
      
      <div className="space-y-3 mt-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Your Answer:</p>
          <div className={`text-sm p-2 rounded ${similarity < 0.7 ? "bg-background/80" : "bg-background"} border`}>
            {userAnswer || <span className="italic text-muted-foreground">No answer provided</span>}
          </div>
        </div>
        
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Correct Answer:</p>
          <div className="text-sm p-2 rounded bg-background border">
            {correctAnswer}
          </div>
        </div>

        {similarAnswers && similarAnswers.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-semibold text-muted-foreground mb-1">Other Acceptable Answers:</p>
            <div className="flex flex-wrap gap-2">
              {similarAnswers.map((answer, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="bg-background/50 text-muted-foreground py-1 px-2"
                >
                  {answer}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {showDetailedInfo && (
          <motion.div
            className="mt-3 pt-3 border-t text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: animationDelay + 0.3 }}
          >
            <div className="flex items-start gap-2">
              <InfoIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground">
                  {similarity >= 0.9 ? (
                    <>Your answer is a perfect match and receives full credit.</>
                  ) : similarity >= 0.7 ? (
                    <>Your answer is close enough to receive partial credit.</>
                  ) : similarity >= 0.5 ? (
                    <>Your answer shows some understanding but needs improvement.</>
                  ) : (
                    <>Your answer needs significant improvement to receive credit.</>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {explanation && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-semibold text-muted-foreground mb-1">Explanation:</p>
            <p className="text-sm">{explanation}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

