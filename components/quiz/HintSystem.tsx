"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Lightbulb,
  Eye,
  AlertTriangle,
  Info,
  HelpCircle,
  BookOpen,
  Target,
  Lock,
  Crown,
  Sparkles,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AttemptTracker } from '@/lib/utils/adaptive-feedback'
import { cn } from "@/lib/utils"
import type { HintLevel } from "@/lib/utils/hint-system"
import { analyzeUserInput } from "@/lib/utils/hint-system"
import { 
  generateContextualHints, 
  selectAdaptiveContextualHint,
  formatHintForDisplay,
  type QuestionMetadata 
} from "@/lib/utils/hint-generation-contextual"
import { useAuth } from "@/modules/auth"

interface HintSystemProps {
  hints: HintLevel[]
  onHintUsed?: (hintIndex: number, hint: HintLevel) => void
  className?: string
  userInput?: string
  correctAnswer?: string
  questionText?: string
  maxHints?: number
  expectedLength?: "short" | "medium" | "long"
  tags?: string[]
  keywords?: string[]
  blanks?: string[]
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, when: "beforeChildren", staggerChildren: 0.1 },
  },
}

const hintVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } },
}

const proactiveHintVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
}

export function HintSystem({
  hints,
  onHintUsed,
  className,
  userInput,
  correctAnswer,
  questionText,
  maxHints = 3, // Default to 3 contextual hints (Concept, Keyword, Structure)
  expectedLength = "medium",
  tags = [],
  keywords = [],
  blanks = [],
}: HintSystemProps) {
  const { isAuthenticated, hasActiveSubscription, canUseFeatures, needsUpgrade } = useAuth()
  const [revealedCount, setRevealedCount] = useState(0)
  const [proactiveHint, setProactiveHint] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [hintToConfirm, setHintToConfirm] = useState<HintLevel | null>(null)
  const [hintIndexToConfirm, setHintIndexToConfirm] = useState<number | null>(null)
  const [showFullAnswer, setShowFullAnswer] = useState(false)
  const [showFullConfirm, setShowFullConfirm] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [adaptiveReason, setAdaptiveReason] = useState<string>('')

  // Generate contextual hints from question metadata
  const contextualHints = useMemo(() => {
    if (!correctAnswer || !questionText) return []
    
    const metadata: QuestionMetadata = { tags, keywords, blanks }
    return generateContextualHints(correctAnswer, questionText, metadata, userInput)
  }, [correctAnswer, questionText, tags, keywords, blanks, userInput])

  // Use contextual hints if available, otherwise fall back to provided hints
  const effectiveHints = contextualHints.length > 0 ? contextualHints.map((ch, idx) => ({
    level: ch.spoilerLevel === 'low' ? 'low' as const : ch.spoilerLevel === 'high' ? 'high' as const : 'medium' as const,
    type: ch.level === 'concept' ? 'contextual' as const : ch.level === 'keyword' ? 'semantic' as const : 'structural' as const,
    content: ch.content,
    spoilerLevel: ch.spoilerLevel,
    penalty: 0, // No penalties for context-aware hints
    description: ch.description
  })) : (!hints || hints.length === 0) ? [
    {
      level: "low" as const,
      type: "contextual" as const,
      content: "Break down the question into smaller parts and tackle each one.",
      spoilerLevel: "low" as const,
      penalty: 0,
      description: "General guidance"
    },
    {
      level: "low" as const,
      type: "structural" as const,
      content: "Consider the key concepts mentioned in the question.",
      spoilerLevel: "low" as const,
      penalty: 0,
      description: "Structural hint"
    },
    {
      level: "medium" as const,
      type: "semantic" as const,
      content: "Think about real-world examples that relate to this topic.",
      spoilerLevel: "medium" as const,
      penalty: 0,
      description: "Application hint"
    }
  ] : hints

  const nextHint = effectiveHints[revealedCount]
  const availableHints = effectiveHints.slice(0, Math.min(maxHints, effectiveHints.length))

  // Adaptive hint selection based on user answer similarity
  useEffect(() => {
    if (userInput && correctAnswer && contextualHints.length > 0) {
      const selected = selectAdaptiveContextualHint(
        userInput,
        correctAnswer,
        contextualHints,
        revealedCount
      )
      
      if (selected) {
        setAdaptiveReason(selected.encouragement)
      }
    }
  }, [userInput, correctAnswer, contextualHints, revealedCount])

  const handleReveal = () => {
    if (!nextHint) return

    // For authenticated users with active subscription, allow all hints
    if (isAuthenticated && hasActiveSubscription) {
      if (nextHint.spoilerLevel === "high") {
        setHintToConfirm(nextHint)
        setHintIndexToConfirm(revealedCount)
        setShowConfirmation(true)
      } else {
        revealConfirmedHint()
      }
      return
    }

    // For authenticated users without subscription, limit to first 2 hints
    if (isAuthenticated && !hasActiveSubscription) {
      if (revealedCount >= 2) {
        setShowUpgradePrompt(true)
        return
      }
    }

    // For unauthenticated users, limit to first hint only
    if (!isAuthenticated) {
      if (revealedCount >= 1) {
        setShowUpgradePrompt(true)
        return
      }
    }

    // Allow the hint if user hasn't hit limits
    if (nextHint.spoilerLevel === "high") {
      setHintToConfirm(nextHint)
      setHintIndexToConfirm(revealedCount)
      setShowConfirmation(true)
    } else {
      revealConfirmedHint()
    }
  }

  const revealConfirmedHint = () => {
    const index = revealedCount
    if (index < availableHints.length) {
      const hint = availableHints[index]
      onHintUsed?.(index, hint)
      setRevealedCount(index + 1)
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
      case 0: return HelpCircle
      case 1: return BookOpen
      case 2: return Target
      case 3: return Eye
      case 4: return Lightbulb
      default: return HelpCircle
    }
  }

  const getColor = (spoiler: HintLevel["spoilerLevel"], index: number) => {
    // Color-code hints by position for clarity:
    // Hint 1 -> Blue (Concept Clue - broad topic)
    // Hint 2 -> Amber (Keyword Clue - specific terms)
    // Hint 3 -> Emerald (Structure Clue - fill-in-the-gap)
    if (index === 0) {
      return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/10 dark:text-blue-300 dark:border-blue-800"
    } else if (index === 1) {
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800"
    } else if (index === 2) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/10 dark:text-emerald-300 dark:border-emerald-800"
    }

    // Fallback styling for additional hints
    return "bg-muted text-foreground border-border"
  }

  // Positive reinforcement messages shown as hints are revealed
  const encouragementMessages = [
    '💡 Good start! This concept clue will guide your thinking in the right direction.',
    '🔑 Nice! The keyword clue helps you focus on the most important terms.',
    '📝 Almost there! Use the structure clue to piece together the final answer.'
  ]
  
  const getEncouragementMessage = (index: number): string => {
    if (adaptiveReason) return adaptiveReason
    return encouragementMessages[Math.min(index, encouragementMessages.length - 1)] || 'Keep learning — you\'re doing great!'
  }

  const positiveBadge = revealedCount === 0 
    ? '🌱 Ready to learn' 
    : revealedCount >= availableHints.length 
      ? '🏁 All hints revealed' 
      : '⭐ Learning in progress'

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className={cn("relative overflow-hidden border-border bg-card", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              <span>Learning Hints</span>
            </CardTitle>
            <Badge variant="outline" className="text-sm font-medium">
              {revealedCount}/{maxHints} Revealed
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Progressive hints to guide your learning. Each hint provides more specific guidance.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Proactive Hint */}
          <AnimatePresence>
            {proactiveHint && (
              <motion.div
                variants={proactiveHintVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="p-4 rounded-lg shadow-sm bg-muted border border-border text-foreground"
              >
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 flex-shrink-0 mt-0.5 text-primary" />
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
                  className="border border-border rounded-xl p-4 bg-card shadow-sm hover:shadow-md transition-all duration-300 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                        <HintIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-foreground">Hint {index + 1}</span>
                        <p className="text-xs text-muted-foreground">{hint.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{index === 0 ? '💡' : index === 1 ? '🔑' : index === 2 ? '📝' : '💭'}</span>
                      <Badge className={cn("text-xs font-medium uppercase", getColor(hint.spoilerLevel, index))}>
                        {index === 0 ? "Concept" : index === 1 ? "Keyword" : index === 2 ? "Structure" : "Helper"}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {hint.content}
                  </p>

                  <div className="flex items-center justify-between text-xs mt-3">
                    <span className="text-gray-500 dark:text-gray-400 italic">
                      {index === 0 
                        ? "High-level topic direction" 
                        : index === 1 
                          ? "Specific terms to focus on" 
                          : index === 2 
                            ? "Fill-in-the-gap guidance"
                            : hint.description}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 text-xs font-medium">
                      Hint {index + 1}/{availableHints.length}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Reveal button */}
          <Button onClick={handleReveal} disabled={!nextHint} className="w-full min-h-[44px] py-3 text-base">
            {nextHint ? `Reveal Next Hint (${Math.min(revealedCount+1, availableHints.length)}/${Math.min(availableHints.length, maxHints)})` : "No More Hints"}
          </Button>

          {/* Positive Reinforcement */}
          {revealedCount >= 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/10 dark:to-indigo-950/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">{positiveBadge}</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    {revealedCount > 0 
                      ? getEncouragementMessage(revealedCount - 1)
                      : 'Use hints to build your understanding step-by-step. Each hint is designed to guide you without giving away the full answer.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Explicit full answer reveal (user-initiated) */}
          {!showFullAnswer && correctAnswer && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">
                {isAuthenticated && hasActiveSubscription
                  ? "Still stuck?"
                  : "Want the complete solution?"
                }
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (isAuthenticated && hasActiveSubscription) {
                    setShowFullConfirm(true)
                  } else {
                    setShowUpgradePrompt(true)
                  }
                }}
                className="w-full"
              >
                {isAuthenticated && hasActiveSubscription
                  ? "Reveal Example Answer"
                  : isAuthenticated && !hasActiveSubscription
                    ? (
                        <span className="inline-flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          Upgrade for Full Solutions
                        </span>
                      )
                    : (
                        <span className="inline-flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Sign Up for Complete Answers
                        </span>
                      )
                }
              </Button>
            </div>
          )}

          {/* Tags / Keywords display */}
          {tags && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs" aria-label={`tag-${t}`}>
                  #{t}
                </Badge>
              ))}
            </div>
          )}

          {showFullAnswer && (
            <div className="mt-4 p-4 bg-muted rounded">
              <div className="text-sm font-semibold mb-2">Example answer (preview)</div>
              <pre className="whitespace-pre-wrap">{correctAnswer}</pre>
            </div>
          )}
        </CardContent>

        {/* Confirmation Modal */}
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
                  <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">Reveal Complete Answer?</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    This hint will reveal more helpful detail to guide your understanding. We record hint usage to improve personalized learning — no punitive messages are shown here.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={cancelConfirmation} className="flex-1 bg-transparent">
                      Keep Trying
                    </Button>
                    <Button
                      onClick={revealConfirmedHint}
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary/90"
                    >
                      Show Hint
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showFullConfirm && (
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
                  <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">Reveal Example Answer?</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    Revealing the example answer will show a completed solution for study. This helps with learning and will be recorded anonymously to improve future hints.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowFullConfirm(false)} className="flex-1 bg-transparent">
                      Keep Trying
                    </Button>
                      <Button
                        onClick={() => {
                          setShowFullConfirm(false)
                          setShowFullAnswer(true)
                          try {
                            AttemptTracker.incrementAttempt?.('reveal_full_answer', 'hint_system')
                          } catch (e) {
                            // ignore
                          }
                          onHintUsed?.(-1, {
                            level: 'high' as any,
                            type: 'reveal' as any,
                            content: correctAnswer || '',
                            spoilerLevel: 'high' as any,
                            penalty: 20,
                            description: 'Full answer reveal'
                          } as any)
                        }}
                        className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary/90"
                      >
                        Reveal Example Answer
                      </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showUpgradePrompt && (
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
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
                    {isAuthenticated ? "Unlock Premium Learning" : "Join Our Learning Community"}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {isAuthenticated
                      ? "Upgrade to access complete solutions, unlimited hints, and personalized learning analytics. Join thousands of learners accelerating their progress!"
                      : "Create your free account to access detailed hints and example answers. Upgrade anytime for unlimited learning features and AI-powered insights."
                    }
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Sparkles className="w-4 h-4" />
                      <span>Complete example answers</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Target className="w-4 h-4" />
                      <span>Unlimited personalized hints</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Lightbulb className="w-4 h-4" />
                      <span>AI-powered learning analytics</span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setShowUpgradePrompt(false)} className="flex-1 bg-transparent">
                      Maybe Later
                    </Button>
                    <Button
                      onClick={() => {
                        setShowUpgradePrompt(false)
                        window.location.href = isAuthenticated ? '/dashboard/subscription' : '/auth/signup'
                      }}
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary/90"
                    >
                      {isAuthenticated ? "Upgrade Now" : "Get Started Free"}
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
