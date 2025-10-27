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
import { AttemptTracker } from "@/lib/utils/adaptive-feedback"
import { cn } from "@/lib/utils"
import {
  generateHints,
  selectAdaptiveHint,
  formatHintForDisplay,
  type Hint,
  type QuestionMetadata
} from "@/lib/utils/hint-system-unified"
import { useAuth } from "@/modules/auth"

interface HintSystemProps {
  hints?: Hint[] // Optional - if not provided, will generate from metadata
  onHintUsed?: (hintIndex: number, hint: Hint) => void
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
  hints = [], // Default to empty array
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
  const [hintToConfirm, setHintToConfirm] = useState<Hint | null>(null)
  const [hintIndexToConfirm, setHintIndexToConfirm] = useState<number | null>(null)
  const [showFullAnswer, setShowFullAnswer] = useState(false)
  const [showFullConfirm, setShowFullConfirm] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [adaptiveReason, setAdaptiveReason] = useState<string>("")
  const [isOnCooldown, setIsOnCooldown] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  // Reset hints when question changes
  useEffect(() => {
    setRevealedCount(0)
    setProactiveHint(null)
    setShowConfirmation(false)
    setHintToConfirm(null)
    setHintIndexToConfirm(null)
    setShowFullAnswer(false)
    setShowFullConfirm(false)
    setAdaptiveReason("")
    setIsOnCooldown(false)
    setCooldownRemaining(0)
  }, [questionText, correctAnswer])

  // Generate hints using the unified system if no hints provided
  const generatedHints = useMemo(() => {
    if (!correctAnswer || !questionText) return []

    const metadata: QuestionMetadata = {
      tags,
      keywords,
      blanks,
      hints: [], // Instructor hints would come from props if available
      expectedLength
    }

    return generateHints(correctAnswer, questionText, metadata, userInput, {
      maxHints: maxHints || 5,
      progressiveReveal: true,
      allowDirectAnswer: false // Don't allow direct answers in the hint system
    })
  }, [correctAnswer, questionText, tags, keywords, blanks, userInput, maxHints, expectedLength])

  // Use provided hints or generated hints
  const effectiveHints = hints.length > 0 ? hints : generatedHints

  const nextHint = effectiveHints[revealedCount]
  const availableHints = effectiveHints.slice(0, Math.min(maxHints, effectiveHints.length))  // Adaptive hint selection based on user answer similarity
  useEffect(() => {
    if (userInput && correctAnswer && generatedHints.length > 0) {
      const selected = selectAdaptiveHint(
        userInput,
        correctAnswer,
        generatedHints,
        revealedCount
      )

      if (selected) {
        setAdaptiveReason(selected.encouragement)
      }
    }
  }, [userInput, correctAnswer, generatedHints, revealedCount])

  const handleReveal = () => {
    if (!nextHint || isOnCooldown) return

    // Implement cooldown after each hint (5 seconds)
    setIsOnCooldown(true)
    setCooldownRemaining(5)
    
    const cooldownInterval = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) {
          clearInterval(cooldownInterval)
          setIsOnCooldown(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

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

  const getHintIcon = (hintType: Hint['type'], index: number) => {
    switch (hintType) {
      case 'contextual': return HelpCircle;
      case 'semantic': return BookOpen;
      case 'structural': return Target;
      case 'direct': return Lightbulb;
      default: return HelpCircle;
    }
  }

  const getColor = (hint: Hint) => {
    // Color-code hints by type for clarity using theme tokens
    switch (hint.type) {
      case "contextual":
        return "bg-primary/10 text-primary border-primary/20";
      case "semantic":
        return "bg-warning/10 text-warning border-warning/20";
      case "structural":
        return "bg-success/10 text-success border-success/20";
      case "direct":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-foreground border-border";
    }
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
              {revealedCount}/{effectiveHints.length} Revealed
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
                className="p-4 rounded-none neo-shadow bg-muted border border-border text-foreground"
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
              const HintIcon = getHintIcon(hint.type, index);
              return (
                <motion.div
                  key={index}
                  variants={hintVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={cn(
                    "p-4 rounded-none neo-shadow border flex flex-col gap-3",
                    getColor(hint)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-background/50 flex items-center justify-center">
                        <HintIcon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="secondary" className="capitalize text-xs font-semibold">
                          {hint.type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed">{hint.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pl-11">
                    <span className="text-muted-foreground italic">
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

          {/* Reveal button with cooldown */}
          <Button 
            onClick={handleReveal} 
            disabled={!nextHint || isOnCooldown} 
            className="w-full min-h-[44px] py-3 text-base"
          >
            {isOnCooldown 
              ? `Wait ${cooldownRemaining}s before next hint...`
              : nextHint 
                ? `Reveal Next Hint (${revealedCount + 1}/${effectiveHints.length})` 
                : "All Hints Revealed"}
          </Button>

          {/* Positive Reinforcement */}
          {revealedCount >= 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-primary/10 border border-primary/20 rounded-none p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-primary">{positiveBadge}</span>
                  </div>
                  <p className="text-sm text-primary/80 dark:text-primary/90 leading-relaxed">
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
              className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
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
                  <h3 className="text-lg font-bold mb-2 text-foreground">Reveal Complete Answer?</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    This hint will reveal more helpful detail to guide your understanding. We record hint usage to improve personalized learning — no punitive messages are shown here.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={cancelConfirmation} className="flex-1 bg-transparent">
                      Keep Trying
                    </Button>
                    <Button
                      onClick={revealConfirmedHint}
                      className="flex-1 bg-primary hover:bg-primary/90 border-4 border-primary-foreground shadow-[4px_4px_0px_0px_hsl(var(--border))]"
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
              className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
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
                  <h3 className="text-lg font-bold mb-2 text-foreground">Reveal Example Answer?</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
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
                        className="flex-1 bg-primary hover:bg-primary/90 border-4 border-primary-foreground shadow-[4px_4px_0px_0px_hsl(var(--border))]"
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
              className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    {isAuthenticated ? "Unlock Premium Learning" : "Join Our Learning Community"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {isAuthenticated
                      ? "Upgrade to access complete solutions, unlimited hints, and personalized learning analytics. Join thousands of learners accelerating their progress!"
                      : "Create your free account to access detailed hints and example answers. Upgrade anytime for unlimited learning features and AI-powered insights."
                    }
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="w-4 h-4" />
                      <span>Complete example answers</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Target className="w-4 h-4" />
                      <span>Unlimited personalized hints</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
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
                      className="flex-1 bg-primary hover:bg-primary/90 border-4 border-primary-foreground shadow-[4px_4px_0px_0px_hsl(var(--border))]"
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
