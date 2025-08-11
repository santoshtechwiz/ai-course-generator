"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Eye, AlertTriangle, CheckCircle, Info, HelpCircle, BookOpen, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { HintLevel } from "@/lib/utils/hint-system"
import { analyzeUserInput } from "@/lib/utils/hint-system"

interface HintSystemProps {
  hints: HintLevel[]
  onHintUsed?: (hintIndex: number, hint: HintLevel) => void
  className?: string
  userInput?: string
  correctAnswer?: string
  questionText?: string
  maxHints?: number
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
}

const hintVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

const proactiveHintVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

export function HintSystem({
  hints,
  onHintUsed,
  className,
  userInput,
  correctAnswer,
  questionText,
  maxHints = 5,
}: HintSystemProps) {
  const [revealedCount, setRevealedCount] = useState(0)
  const [proactiveHint, setProactiveHint] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [hintToConfirm, setHintToConfirm] = useState<HintLevel | null>(null)
  const [hintIndexToConfirm, setHintIndexToConfirm] = useState<number | null>(null)

  // Effect to analyze user input and provide proactive hints
  useEffect(() => {
    if (userInput && correctAnswer && questionText) {
      const feedback = analyzeUserInput(userInput, correctAnswer, questionText)
      setProactiveHint(feedback)
    } else {
      setProactiveHint(null)
    }
  }, [userInput, correctAnswer, questionText])

  if (!hints || hints.length === 0) return null

  const nextHint = hints[revealedCount]
  const availableHints = hints.slice(0, maxHints)

  const handleReveal = () => {
    if (!nextHint) return

    // Show confirmation for high spoiler hints (level 4 and above)
    if (nextHint.spoilerLevel === "high" && revealedCount >= 3) {
      setHintToConfirm(nextHint)
      setHintIndexToConfirm(revealedCount)
      setShowConfirmation(true)
    } else {
      // Otherwise, reveal directly
      revealConfirmedHint()
    }
  }

  const revealConfirmedHint = () => {
    const next = revealedCount
    if (next < availableHints.length) {
      const hint = availableHints[next]
      onHintUsed?.(next, hint)
      setRevealedCount(next + 1)
      setShowConfirmation(false)
      setHintToConfirm(null)
      setHintIndexToConfirm(null)
    }
  }

  const cancelConfirmation = () => {
    setShowConfirmation(false)
    setHintToConfirm(null)
    setHintIndexToConfirm(null)
  }

  const getHintIcon = (index: number) => {
    switch (index) {
      case 0:
        return HelpCircle
      case 1:
        return BookOpen
      case 2:
        return Target
      case 3:
        return Eye
      case 4:
        return Lightbulb
      default:
        return HelpCircle
    }
  }

  const getColor = (spoiler: HintLevel["spoilerLevel"], index: number) => {
    if (index >= 4) {
      return "bg-accent/10 text-accent-foreground border-accent/20 dark:bg-accent/20 dark:text-accent-foreground dark:border-accent/30"
    } else if (index >= 2) {
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800"
    } else {
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800"
    }
  }

  const totalPenalty = availableHints.slice(0, revealedCount).reduce((acc, h) => acc + (h.penalty || 0), 0)

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card
        className={cn(
          "bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border-blue-200 relative overflow-hidden dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-700",
          className,
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-lg">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Learning Hints
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm font-medium">
                {revealedCount}/{maxHints} Revealed
              </Badge>
            </div>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            Progressive hints to guide your learning. Each hint provides more specific guidance.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Proactive Hint Section */}
          <AnimatePresence>
            {proactiveHint && (
              <motion.div
                variants={proactiveHintVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200 p-4 rounded-lg shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 flex-shrink-0 mt-0.5 text-cyan-600 dark:text-cyan-400" />
                  <div>
                    <div className="font-semibold mb-1">Smart Analysis</div>
                    <p className="text-sm leading-relaxed">{proactiveHint}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Revealed Hints */}
          <AnimatePresence>
            {availableHints.slice(0, revealedCount).map((hint, index) => {
              const HintIcon = getHintIcon(index)
              return (
                <motion.div
                  key={index}
                  variants={hintVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="border rounded-xl p-4 bg-white dark:bg-gray-950/50 shadow-sm hover:shadow-md transition-all duration-300 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white">
                        <HintIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">Hint {index + 1}</span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{hint.description}</div>
                      </div>
                    </div>
                    <Badge className={cn("text-xs font-medium", getColor(hint.spoilerLevel, index))}>
                      {index >= 4 ? "ANSWER" : index >= 2 ? "DETAILED" : "GENTLE"}
                    </Badge>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border-l-4 border-l-blue-400"
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{hint.content}</p>
                  </motion.div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="text-gray-500 dark:text-gray-400">
                      {hint.type === "direct"
                        ? "Complete Answer"
                        : hint.type === "semantic"
                          ? "Meaning Clue"
                          : hint.type === "structural"
                            ? "Structure Clue"
                            : "Context Clue"}
                    </div>
                    <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                      <span>-{hint.penalty}% score</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Reveal Next Hint Button */}
          {revealedCount < availableHints.length ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Button
                onClick={handleReveal}
                className={cn(
                  "w-full text-sm transition-all duration-300 ease-in-out",
                  revealedCount >= 4
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl"
                    : revealedCount >= 2
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl",
                )}
              >
                <Eye className="w-4 h-4 mr-2" />
                {revealedCount >= 4 ? (
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Show Complete Answer (-{nextHint?.penalty || 20}%)
                  </span>
                ) : (
                  `Get Hint ${revealedCount + 1} (-${nextHint?.penalty || 5}%)`
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center text-gray-500 dark:text-gray-400 text-sm py-4 flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border"
            >
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">All hints revealed</span>
            </motion.div>
          )}

          {/* Score Impact Display */}
          {revealedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Learning Impact</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-700 dark:text-orange-300">
                    -{totalPenalty}% from final score
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">
                    Hints help learning but reduce assessment score
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>

        {/* Confirmation Modal for Final Answer */}
        <AnimatePresence>
          {showConfirmation && hintToConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent/10 dark:bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-accent" />
                  </div>

                  <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">Show Complete Answer?</h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    This will reveal the complete answer. While this helps you learn, it will significantly impact your
                    assessment score.
                  </p>

                  <div className="bg-accent/5 dark:bg-accent/10 border border-accent/20 dark:border-accent/30 rounded-lg p-3 mb-6">
                    <div className="flex items-center justify-center gap-2 text-accent-foreground font-medium">
                      <span>Score Impact: -{hintToConfirm.penalty}%</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={cancelConfirmation} className="flex-1 bg-transparent">
                      Keep Trying
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={revealConfirmedHint}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    >
                      Show Answer
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
