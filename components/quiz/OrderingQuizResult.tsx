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
 * Get color based on score
 */
function getScoreColor(score: number): string {
  if (score >= 90) return "from-green-600 to-emerald-600"
  if (score >= 75) return "from-blue-600 to-cyan-600"
  if (score >= 60) return "from-yellow-600 to-orange-600"
  return "from-red-600 to-orange-600"
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
        <Card className="border-2 border-amber-600 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Header with Score */}
          <div className={cn("bg-gradient-to-r p-8 relative overflow-hidden", getScoreColor(metrics.score))}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22><rect fill=%22currentColor%22 width=%2220%22 height=%2220%22/></svg>')] bg-repeat" />
            </div>

            <div className="relative z-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="inline-block mb-4"
              >
                <div className="text-8xl font-black">{metrics.score}</div>
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
              <div className="p-3 border-2 border-blue-600/50 rounded-lg bg-blue-900/20">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold text-blue-300 uppercase">Accuracy</span>
                </div>
                <div className="text-2xl font-black text-blue-300">{metrics.accuracy}%</div>
                <div className="text-xs text-blue-300/60">
                  {metrics.correctPositions}/{metrics.totalPositions} correct
                </div>
              </div>

              {/* Time */}
              <div className="p-3 border-2 border-purple-600/50 rounded-lg bg-purple-900/20">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-300 uppercase">Time</span>
                </div>
                <div className="text-2xl font-black text-purple-300">
                  {formatDuration(metrics.timeTaken)}
                </div>
                <div className="text-xs text-purple-300/60">{metrics.speedRating}</div>
              </div>

              {/* Speed Rating */}
              <div className="p-3 border-2 border-yellow-600/50 rounded-lg bg-yellow-900/20">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-300 uppercase">Speed</span>
                </div>
                <div className="text-2xl font-black text-yellow-300">
                  {metrics.speedPercentage}%
                </div>
                <div className="text-xs text-yellow-300/60">vs average</div>
              </div>

              {/* Status */}
              <div className="p-3 border-2 border-green-600/50 rounded-lg bg-green-900/20">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-bold text-green-300 uppercase">Status</span>
                </div>
                <div className="text-2xl font-black text-green-300">
                  {metrics.isCorrect ? "PERFECT" : "PARTIAL"}
                </div>
                <div className="text-xs text-green-300/60">
                  {metrics.isCorrect ? "All steps correct!" : "Try again"}
                </div>
              </div>
            </div>

            {/* User Comparison (if stats provided) */}
            {userStats && (
              <div className="p-4 border-l-4 border-cyan-600 bg-cyan-900/20 rounded-lg">
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
                        "w-full p-3 rounded-lg border-2 text-left transition-colors",
                        step.isCorrect
                          ? "border-green-600/50 bg-green-900/20 hover:bg-green-900/30"
                          : "border-red-600/50 bg-red-900/20 hover:bg-red-900/30"
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
              <div className="p-4 border-l-4 border-orange-600 bg-orange-900/20 rounded-lg space-y-2">
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
                className="p-3 bg-green-900/20 border-2 border-green-600 rounded-lg text-center text-green-300 font-bold"
              >
                {shareMessage}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="flex-1 border-2 bg-amber-600 hover:bg-amber-700 text-black font-bold uppercase"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              <Button
                onClick={handleShare}
                className="flex-1 border-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Quiz Info */}
            <div className="p-3 bg-black/40 border-l-4 border-white/20 rounded-lg text-xs text-white/70 space-y-1">
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


