"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Eye, AlertTriangle, CheckCircle, Info, HelpCircle, BookOpen, Target, Zap, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { HintLevel } from "@/lib/utils/hint-system"
import { analyzeUserInput } from "@/lib/utils/hint-system"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"

interface HintSystemProps {
  hints: HintLevel[]
  onHintUsed?: (hintIndex: number, hint: HintLevel) => void
  className?: string
  userInput?: string
  correctAnswer?: string
  questionText?: string
  maxHints?: number
  enableKeyboardShortcuts?: boolean
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
    transition: {
      duration: 0.2,
    },
  },
}

export function HintSystem({
  hints,
  onHintUsed,
  className,
  userInput = "",
  correctAnswer = "",
  questionText = "",
  maxHints = 3,
  enableKeyboardShortcuts = true,
}: HintSystemProps) {
  const [currentHintIndex, setCurrentHintIndex] = useState(-1)
  const [usedHints, setUsedHints] = useState<number[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showHintPreview, setShowHintPreview] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Show next hint with 'H' key
      if (event.key.toLowerCase() === 'h' && currentHintIndex < hints.length - 1 && currentHintIndex < maxHints - 1) {
        event.preventDefault()
        handleNextHint()
      }

      // Toggle hint system with 'T' key
      if (event.key.toLowerCase() === 't' && hints.length > 0) {
        event.preventDefault()
        setIsCollapsed(!isCollapsed)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardShortcuts, currentHintIndex, hints.length, maxHints, isCollapsed])

  // Analyze user input for intelligent hint suggestions
  const inputAnalysis = userInput && correctAnswer 
    ? analyzeUserInput(userInput, correctAnswer, questionText)
    : null

  const handleNextHint = () => {
    if (currentHintIndex >= hints.length - 1 || currentHintIndex >= maxHints - 1) return

    const nextIndex = currentHintIndex + 1
    const hint = hints[nextIndex]
    
    setCurrentHintIndex(nextIndex)
    setUsedHints(prev => [...prev, nextIndex])
    onHintUsed?.(nextIndex, hint)
  }

  const getHintIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "gentle":
        return Lightbulb
      case "moderate":
        return Info
      case "strong":
        return Target
      case "direct":
        return Eye
      default:
        return HelpCircle
    }
  }

  const getHintColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "gentle":
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300"
      case "moderate":
        return "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300"
      case "strong":
        return "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-300"
      case "direct":
        return "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300"
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950/20 dark:border-gray-800 dark:text-gray-300"
    }
  }

  const getNextHintLevel = () => {
    if (currentHintIndex >= hints.length - 1 || currentHintIndex >= maxHints - 1) return null
    return hints[currentHintIndex + 1]?.level || "unknown"
  }

  const hintProgress = ((currentHintIndex + 1) / Math.min(hints.length, maxHints)) * 100

  if (hints.length === 0) return null

  return (
    <motion.div
      className={cn("w-full max-w-2xl mx-auto", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="region"
      aria-label="Hint system"
    >
      <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
        <Card className="border-2 border-dashed border-muted-foreground/20 bg-background/50 backdrop-blur-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <span>Hint System</span>
                  {usedHints.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {usedHints.length} used
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {enableKeyboardShortcuts && (
                    <Badge variant="outline" className="text-xs">
                      Press H for hint
                    </Badge>
                  )}
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {usedHints.length > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Hints used</span>
                    <span>{usedHints.length} / {Math.min(hints.length, maxHints)}</span>
                  </div>
                  <Progress value={hintProgress} className="h-1.5" />
                </div>
              )}
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* Input Analysis */}
              {inputAnalysis && userInput.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-muted/50 rounded-lg border border-muted"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Answer Analysis</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Similarity: {(inputAnalysis.similarity * 100).toFixed(1)}%</p>
                    {inputAnalysis.feedback && (
                      <p className="mt-1">{inputAnalysis.feedback}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Available Hints */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {hints.slice(0, currentHintIndex + 1).map((hint, index) => {
                    const Icon = getHintIcon(hint.level)
                    const colorClass = getHintColor(hint.level)
                    
                    return (
                      <motion.div
                        key={`hint-${index}`}
                        variants={hintVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className={cn(
                          "p-4 rounded-lg border-2",
                          colorClass
                        )}
                        role="alert"
                        aria-live="polite"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <Icon className="w-5 h-5 mt-0.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs font-medium">
                                {hint.level} hint {index + 1}
                              </Badge>
                              {hint.penalty && (
                                <Badge variant="destructive" className="text-xs">
                                  -{hint.penalty} points
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed">
                              {hint.content}
                            </p>
                            {hint.example && (
                              <div className="mt-2 p-2 bg-background/60 rounded border border-current/20">
                                <p className="text-xs font-medium mb-1">Example:</p>
                                <p className="text-xs italic">{hint.example}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {/* Next Hint Preview */}
                {currentHintIndex < hints.length - 1 && currentHintIndex < maxHints - 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-dashed border-muted-foreground/30" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-background px-3 text-muted-foreground">
                          Next hint available ({getNextHintLevel()})
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleNextHint}
                      variant="outline"
                      size="sm"
                      className="mt-3 hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
                      onMouseEnter={() => setShowHintPreview(true)}
                      onMouseLeave={() => setShowHintPreview(false)}
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Get Next Hint
                      {enableKeyboardShortcuts && (
                        <kbd className="ml-2 px-1.5 py-0.5 bg-muted border rounded text-xs">H</kbd>
                      )}
                    </Button>

                    {/* Hint Preview */}
                    <AnimatePresence>
                      {showHintPreview && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="mt-2 p-2 bg-muted/80 rounded border text-xs text-muted-foreground"
                        >
                          Preview: {hints[currentHintIndex + 1]?.content.slice(0, 50)}...
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Max hints reached */}
                {currentHintIndex >= maxHints - 1 && hints.length > maxHints && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/20 dark:border-amber-800"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Maximum hints reached. Try to solve it with what you've learned!
                    </p>
                  </motion.div>
                )}

                {/* All hints used */}
                {currentHintIndex >= hints.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800"
                  >
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-800 dark:text-green-300">
                      All hints revealed! You should have enough information to solve this.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Keyboard shortcuts info */}
              {enableKeyboardShortcuts && (
                <div className="mt-4 pt-3 border-t border-muted text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <span><kbd className="px-1 py-0.5 bg-muted border rounded">H</kbd> Next hint</span>
                    <span><kbd className="px-1 py-0.5 bg-muted border rounded">T</kbd> Toggle hints</span>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </motion.div>
  )
}
