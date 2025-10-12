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
import type { HintLevel } from "@/lib/utils/hint-system"

declare module "@/lib/utils/hint-system" {
  interface HintLevel {
    type: 'contextual' | 'semantic' | 'structural' | 'blank_start' | 'blank_end' | 'open_ended_deconstruction' | 'open_ended_brainstorming' | 'open_ended_structuring' | 'open_ended_adaptive';
  }
}
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
  const [adaptiveReason, setAdaptiveReason] = useState<string>("")
  const [isOnCooldown, setIsOnCooldown] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)


  // Generate contextual hints from question metadata (as fallback only)
  const contextualHints = useMemo(() => {
    if (!correctAnswer || !questionText) return []
    
    const metadata: QuestionMetadata = { tags, keywords, blanks }
    return generateContextualHints(correctAnswer, questionText, metadata, userInput)
  }, [correctAnswer, questionText, tags, keywords, blanks, userInput])

  // Helper to generate hints for blanks
  const generateBlankHints = (correctAnswer: string, blanks: string[]): HintLevel[] => {
    if (!blanks || blanks.length === 0 || !correctAnswer) return [];

    const blankHints: HintLevel[] = [];
    const words = correctAnswer.split(/\s+/); // Simple split for words

    blanks.forEach((blankPlaceholder, index) => {
      // Find the actual word in the correct answer that corresponds to the blank
      // This is a simplified approach; a more robust solution might involve NLP or specific markers
      const actualWord = words.find(word => word.toLowerCase().includes(blankPlaceholder.toLowerCase()));

      if (actualWord) {
        if (actualWord.length > 0) {
          blankHints.push({
            level: "medium",
            type: "blank_start",
            content: `The missing word starting with '${actualWord[0].toUpperCase()}'`, // First letter
            spoilerLevel: "medium",
            penalty: 5,
            description: `Hint for blank ${index + 1}: Starting letter`
          });
        }
        if (actualWord.length > 1) {
          blankHints.push({
            level: "high",
            type: "blank_end",
            content: `The missing word ending with '${actualWord[actualWord.length - 1].toLowerCase()}'`, // Last letter
            spoilerLevel: "high",
            penalty: 10,
            description: `Hint for blank ${index + 1}: Ending letter`
          });
        }
      }
    });
    return blankHints;
  };

  const generatedBlankHints = useMemo(() => {
    return generateBlankHints(correctAnswer || '', blanks);
  }, [correctAnswer, blanks]);

  // Helper to generate hints for open-ended questions
  const generateOpenEndedHints = (questionText?: string, userInput?: string): HintLevel[] => {
    if (!questionText) return [];

    const hints: HintLevel[] = [];

    // Hint 1: Deconstruct the question (Start)
    hints.push({
      level: "low",
      type: "open_ended_deconstruction",
      content: `Let's start by breaking down the question: "${questionText}". What are the key components it's asking for?`,
      spoilerLevel: "low",
      penalty: 0,
      description: "Start: Deconstruct the question"
    });

    // Hint 2: Brainstorm initial ideas (Start)
    hints.push({
      level: "low",
      type: "open_ended_brainstorming",
      content: "For the beginning of your answer, brainstorm some initial ideas or perspectives. Don't worry about structure yet, just get your thoughts down.",
      spoilerLevel: "low",
      penalty: 0,
      description: "Start: Brainstorm initial ideas"
    });

    // Hint 3: Structure the main body (Middle)
    hints.push({
      level: "medium",
      type: "open_ended_structuring",
      content: "For the middle of your answer, think about how to organize your points. A good structure could be to define the main concepts, then compare and contrast them.",
      spoilerLevel: "medium",
      penalty: 0,
      description: "Middle: Structure the main body"
    });

    // Hint 4: Elaborate with examples (Middle)
    hints.push({
      level: "medium",
      type: "open_ended_adaptive", // Using adaptive for elaboration
      content: "To add depth to the middle of your answer, provide specific examples or evidence to support your points. This will make your argument more convincing.",
      spoilerLevel: "medium",
      penalty: 5,
      description: "Middle: Elaborate with examples"
    });

    // Hint 5: Conclude your answer (End)
    hints.push({
      level: "high",
      type: "open_ended_structuring", // Re-using structuring for conclusion
      content: "To end your answer, summarize your main points and offer a concluding thought. What is the key takeaway you want to leave the reader with?",
      spoilerLevel: "high",
      penalty: 10,
      description: "End: Conclude your answer"
    });

    return hints;
  };

  const generatedOpenEndedHints = useMemo(() => {
    // Assuming an open-ended question can be identified by the absence of a direct correctAnswer
    // or by a specific tag/type if available in metadata (not currently in props)
    const isOpenEnded = !correctAnswer && questionText; // Simplified detection
    return isOpenEnded ? generateOpenEndedHints(questionText, userInput) : [];
  }, [questionText, userInput, correctAnswer]);

  // PRIORITY: Use hints prop first, then generated hints, then contextual hints, then generic fallbacks
  const effectiveHints = (hints && hints.length > 0) ? hints : generatedBlankHints.length > 0 ? generatedBlankHints : generatedOpenEndedHints.length > 0 ? generatedOpenEndedHints : contextualHints.length > 0 ? contextualHints.map((ch, idx) => ({
    level: ch.spoilerLevel === 'low' ? 'low' as const : ch.spoilerLevel === 'high' ? 'high' as const : 'medium' as const,
    type: ch.level === 'concept' ? 'contextual' as const : ch.level === 'keyword' ? 'semantic' as const : 'structural' as const,
    content: ch.content,
    spoilerLevel: ch.spoilerLevel,
    penalty: 0, // No penalties for context-aware hints
    description: ch.description
  })) : [
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
  ]

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

  const getHintIcon = (hintType: HintLevel['type'], index: number) => {
    switch (hintType) {
      case 'contextual': return HelpCircle;
      case 'semantic': return BookOpen;
      case 'structural': return Target;
      case 'blank_start': return Lock; // Or another appropriate icon
      case 'blank_end': return Crown; // Or another appropriate icon
      case 'open_ended_deconstruction': return Info;
      case 'open_ended_brainstorming': return Sparkles;
      case 'open_ended_structuring': return Eye;
      case 'open_ended_adaptive': return Lightbulb;
      default: return HelpCircle;
    }
  }

  const getColor = (hint: HintLevel) => {
    // Color-code hints by type for clarity
    switch (hint.type) {
      case "contextual":
      case "open_ended_deconstruction":
        return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/10 dark:text-blue-300 dark:border-blue-800";
      case "semantic":
      case "open_ended_brainstorming":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800";
      case "structural":
      case "open_ended_structuring":
        return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/10 dark:text-emerald-300 dark:border-emerald-800";
      case "blank_start":
        return "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/10 dark:text-purple-300 dark:border-purple-800";
      case "blank_end":
        return "bg-pink-50 text-pink-800 border-pink-200 dark:bg-pink-950/10 dark:text-pink-300 dark:border-pink-800";
      case "open_ended_adaptive":
        return "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/10 dark:text-indigo-300 dark:border-indigo-800";
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
              const HintIcon = getHintIcon(hint.type, index);
              return (
                <motion.div
                  key={index}
                  variants={hintVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={cn(
                    "p-4 rounded-lg shadow-sm border flex flex-col gap-3",
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

          {/* Reveal button with cooldown */}
          <Button 
            onClick={handleReveal} 
            disabled={!nextHint || isOnCooldown} 
            className="w-full min-h-[44px] py-3 text-base"
          >
            {isOnCooldown 
              ? `Wait ${cooldownRemaining}s before next hint...`
              : nextHint 
                ? `Reveal Next Hint (${Math.min(revealedCount+1, availableHints.length)}/${Math.min(availableHints.length, maxHints)})` 
                : "No More Hints"}
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
