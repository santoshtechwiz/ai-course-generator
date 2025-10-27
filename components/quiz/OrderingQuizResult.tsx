"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import neo from "@/components/neo/tokens"
import {
  Share2,
  RotateCcw,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  OrderingQuizMetrics,
  getPerformanceFeedback,
  getImprovementSuggestions,
  formatDuration,
} from "@/lib/ordering-quiz/scoring-service"
import { StepExplanation } from "@/lib/ordering-quiz/scoring-service"

interface OrderingQuizResultProps {
  metrics: OrderingQuizMetrics
  topic: string
  difficulty: "easy" | "medium" | "hard"
  onRetry?: () => void
  onShare?: () => void
  userStats?: {
    averageScore: number
    bestScore: number
    totalAttempts: number
  }
  className?: string
}

/**
 * Get color and shadow based on score for Nerobrutal theme
 */
function getScoreStyling(score: number): { bgColor: string, shadow: string } {
  if (score >= 90) return {
    bgColor: "bg-[var(--color-success)]",
    shadow: "shadow-[var(--shadow-neo-success)]"
  }
  if (score >= 75) return {
    bgColor: "bg-[var(--color-primary)]",
    shadow: "shadow-[var(--shadow-neo-primary)]"
  }
  if (score >= 60) return {
    bgColor: "bg-[var(--color-warning)]",
    shadow: "shadow-[var(--shadow-neo-warning)]"
  }
  return {
    bgColor: "bg-[var(--color-error)]",
    shadow: "shadow-[var(--shadow-neo-error)]"
  }
}

/**
 * Get emoji based on grade
 */
function getGradeEmoji(grade: "A" | "B" | "C" | "D" | "F"): string {
  const emojis = {
    A: "🎯",
    B: "✨",
    C: "👍",
    D: "📈",
    F: "💪",
  }
  return emojis[grade]
}

/**
 * OrderingQuizResult Component
 * Displays detailed quiz results with metrics, feedback, and next actions
 */
export const OrderingQuizResult: React.FC<OrderingQuizResultProps> = ({
  metrics,
  topic,
  difficulty,
  onRetry,
  onShare,
  userStats,
  className = "",
}) => {
  const [expandedSteps, setExpandedSteps] = React.useState<Set<number>>(new Set())
  const [shareMessage, setShareMessage] = React.useState<string | null>(null)

  const feedback = getPerformanceFeedback(metrics)
  const suggestions = getImprovementSuggestions(metrics)

  const toggleStepExpand = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber)
    } else {
      newExpanded.add(stepNumber)
    }
    setExpandedSteps(newExpanded)
  }

  const handleShare = async () => {
    const shareText = `I scored ${metrics.score}/100 on an ordering quiz about "${topic}"! ${
      metrics.isCorrect ? "Perfect score! 🎉" : `Accuracy: ${metrics.accuracy}%`
    }`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Ordering Quiz Result",
          text: shareText,
        })
      } catch (err) {
        console.log("Share cancelled or failed")
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(shareText)
      setShareMessage("Result copied to clipboard!")
      setTimeout(() => setShareMessage(null), 3000)
    }

    onShare?.()
  }

  const speedBonus = metrics.speedRating === "Very Fast" ? 5 : 0

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-6", className)}>
      {/* Main Result Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-4 border-amber-600 bg-card overflow-hidden shadow-[8px_8px_0px_0px_hsl(var(--border))]">
          {/* Header with Score */}
          <div className={cn("p-8 relative overflow-hidden border-4 border-border", getScoreStyling(metrics.score).bgColor, getScoreStyling(metrics.score).shadow)}>
            <div className="relative z-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="inline-block mb-4"
              >
                <div className="text-6xl font-black">{metrics.score}</div>
              </motion.div>

              <div className="text-white/90 text-lg mb-4">{feedback}</div>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Badge variant="neutral" className={cn(neo.badge, "bg-white/20 text-white border-white/30 font-bold uppercase")}>
                  {getGradeEmoji(metrics.grade)} Grade: {metrics.grade}
                </Badge>
                <Badge variant="neutral" className={cn(neo.badge, "bg-white/20 text-white border-white/30 font-bold uppercase")}>
                  {metrics.isCorrect ? "✓ PERFECT" : `${metrics.accuracy}% CORRECT`}
                </Badge>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <CardContent className="p-6 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Accuracy */}
              <div className="p-3 border-6 border-[var(--color-accent)]/50 rounded-none bg-[var(--color-accent)]/20">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-[var(--color-accent)]" />
                  <span className="text-xs font-bold text-[var(--color-accent)] uppercase">Accuracy</span>
                </div>
                <div className="text-xl font-black text-[var(--color-accent)]">{metrics.accuracy}%</div>
                <div className="text-xs text-[var(--color-accent)]/60">
                  {metrics.correctPositions}/{metrics.totalPositions} correct
                </div>
              </div>

              {/* Time */}
              <div className="p-3 border-6 border-[var(--color-secondary)]/50 rounded-none bg-[var(--color-secondary)]/20">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-[var(--color-secondary)]" />
                  <span className="text-xs font-bold text-[var(--color-secondary)] uppercase">Time</span>
                </div>
                <div className="text-xl font-black text-[var(--color-secondary)]">
                  {formatDuration(metrics.timeTaken)}
                </div>
                <div className="text-xs text-[var(--color-secondary)]/60">{metrics.speedRating}</div>
              </div>

              {/* Speed Rating */}
              <div className="p-3 border-6 border-[var(--color-warning)]/50 rounded-none bg-[var(--color-warning)]/20">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-[var(--color-warning)]" />
                  <span className="text-xs font-bold text-[var(--color-warning)] uppercase">Speed</span>
                </div>
                <div className="text-xl font-black text-[var(--color-warning)]">
                  {metrics.speedPercentage}%
                </div>
                <div className="text-xs text-[var(--color-warning)]/60">vs average</div>
              </div>

              {/* Status */}
              <div className="p-3 border-6 border-[var(--color-success)]/50 rounded-none bg-[var(--color-success)]/20">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-[var(--color-success)]" />
                  <span className="text-xs font-bold text-[var(--color-success)] uppercase">Status</span>
                </div>
                <div className="text-xl font-black text-[var(--color-success)]">
                  {metrics.isCorrect ? "PERFECT" : "PARTIAL"}
                </div>
                <div className="text-xs text-[var(--color-success)]/60">
                  {metrics.isCorrect ? "All steps correct!" : "Try again"}
                </div>
              </div>
            </div>

            {/* User Comparison (if stats provided) */}
            {userStats && (
              <div className="p-4 border-l-4 border-cyan-600 bg-cyan-900/20 rounded-none">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-bold text-cyan-300">YOUR PROGRESS</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-cyan-300/60">Current</div>
                    <div className="text-xl font-black text-cyan-300">{metrics.score}</div>
                  </div>
                  <div>
                    <div className="text-cyan-300/60">Average</div>
                    <div className="text-xl font-black text-cyan-300">
                      {userStats.averageScore}
                    </div>
                  </div>
                  <div>
                    <div className="text-cyan-300/60">Best</div>
                    <div className="text-xl font-black text-cyan-300">
                      {userStats.bestScore}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step-by-Step Breakdown */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                📋 STEP BREAKDOWN
              </h3>
              <div className="space-y-2">
                {metrics.stepExplanations.map((step, idx) => (
                  <motion.div
                    key={step.stepNumber}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <button
                      onClick={() => toggleStepExpand(step.stepNumber)}
                      className={cn(
                        "w-full p-3 rounded-none border-6 text-left transition-colors",
                        step.isCorrect
                          ? "border-[var(--color-success)]/50 bg-[var(--color-success)]/20 hover:bg-[var(--color-success)]/30"
                          : "border-[var(--color-error)]/50 bg-[var(--color-error)]/20 hover:bg-[var(--color-error)]/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-lg font-black",
                              step.isCorrect ? "text-green-300" : "text-red-300"
                            )}>
                              {step.isCorrect ? "✓" : "✗"}
                            </span>
                            <span className="text-sm font-bold text-white">
                              Step {step.stepNumber}
                            </span>
                            {!step.isCorrect && (
                              <span className="text-xs text-white/60">
                                (Position {step.userPosition} → {step.correctPosition})
                              </span>
                            )}
                          </div>
                        </div>
                        {expandedSteps.has(step.stepNumber) ? (
                          <ChevronUp className="h-4 w-4 text-white/60 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-white/60 flex-shrink-0" />
                        )}
                      </div>

                      {/* Expanded Content */}
                      {expandedSteps.has(step.stepNumber) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 pt-2 border-t border-white/10"
                        >
                          <p className={cn(
                            "text-sm leading-relaxed",
                            step.isCorrect ? "text-green-300/90" : "text-red-300/90"
                          )}>
                            {step.message}
                          </p>
                        </motion.div>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Improvement Suggestions */}
            {!metrics.isCorrect && (
              <div className="p-4 border-l-4 border-orange-600 bg-orange-900/20 rounded-none space-y-2">
                <h4 className="text-sm font-bold text-orange-300 uppercase">💡 SUGGESTIONS</h4>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-sm text-orange-300/80 flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Share Message */}
            {shareMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-[var(--color-success)]/20 border-6 border-[var(--color-success)] rounded-none text-center text-[var(--color-success)] font-bold"
              >
                {shareMessage}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="flex-1 border-6 bg-[var(--color-warning)] hover:bg-[var(--color-accent)] text-[var(--color-text)] font-bold uppercase"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              <Button
                onClick={handleShare}
                className="flex-1 border-6 bg-[var(--color-primary)] hover:bg-[var(--color-accent)] text-[var(--color-text)] font-bold uppercase"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Quiz Info */}
            <div className="p-3 bg-black/40 border-l-4 border-white/20 rounded-none text-xs text-white/70 space-y-1">
              <div>
                <strong className="text-white">Topic:</strong> {topic}
              </div>
              <div>
                <strong className="text-white">Difficulty:</strong> {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </div>
              <div>
                <strong className="text-white">Attempts on Topic:</strong> {userStats?.totalAttempts || 1}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}


