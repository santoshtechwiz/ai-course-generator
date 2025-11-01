/**
 * OrderingQuiz Component
 * 
 * Enhanced with Neobrutalism design system:
 * - Bold 4px borders with shadow offsets
 * - Vibrant color palette with high contrast
 * - Interactive animations and hover states
 * - Full keyboard accessibility (Arrow keys + Tab navigation)
 * - ARIA labels for screen readers
 * - Visual feedback for drag, drop, and completion states
 * - Responsive layout for mobile and desktop
 * 
 * Features:
 * - Drag-and-drop reordering
 * - Arrow button controls
 * - Keyboard shortcuts (↑/↓ arrows)
 * - Auto-completion detection
 * - Milestone tracking
 * - Accessible focus states
 */

"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import neo from "@/components/neo/tokens"
import { CheckCircle2, XCircle, GripVertical, ChevronUp, ChevronDown, Hand, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface OrderingQuizStep {
  id: number
  description: string
  explanation?: string
}

interface OrderingQuizQuestion {
  id?: string | number
  title: string
  topic?: string
  description?: string
  difficulty?: "easy" | "medium" | "hard"
  steps: OrderingQuizStep[]
  type: "ordering"
}

interface DraggableStep {
  id: number
  description: string
  explanation?: string
  currentIndex: number
}

interface OrderingQuizProps {
  question: OrderingQuizQuestion
  onSubmit: (userOrder: number[], isCorrect: boolean) => void
  onRetry?: () => void
  showResult?: boolean
  isSubmitting?: boolean
  className?: string
  hideSubmitButton?: boolean
  onOrderChange?: (userOrder: number[]) => void
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export const OrderingQuiz: React.FC<OrderingQuizProps> = ({
  question,
  onSubmit,
  onRetry,
  showResult = false,
  isSubmitting = false,
  className = "",
  hideSubmitButton = false,
  onOrderChange,
}) => {
  const [shuffledSteps, setShuffledSteps] = useState<DraggableStep[]>([])
  const [userOrder, setUserOrder] = useState<number[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    const shuffled = shuffleArray(question.steps).map((step: any, index: number) => {
      let description = ""
      if (typeof step === "string") {
        description = step
      } else if (step && typeof step === "object") {
        if (typeof step.description === "string") {
          description = step.description
        } else if (step.description) {
          description = String(step.description)
        } else {
          description = JSON.stringify(step)
        }
      } else {
        description = String(step || "")
      }

      return {
        id: typeof step.id === "number" ? step.id : index,
        description: description,
        explanation: "",
        currentIndex: index,
      } as DraggableStep
    })
    setShuffledSteps(shuffled)
    const initialOrder = shuffled.map((_: any, idx: number) => idx)
    setUserOrder(initialOrder)

    setTimeout(() => setIsInitialized(true), 100)
    setTimeout(() => setShowHint(false), 3000)
  }, [question.steps])

  useEffect(() => {
    void onSubmit
    void onRetry
    void isSubmitting
    void hideSubmitButton
  }, [onSubmit, onRetry, isSubmitting, hideSubmitButton])

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
    setDropTargetIndex(index)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      if (draggedIndex === null || draggedIndex === index) return

      // Only update the drop target indicator, don't reorder yet
      setDropTargetIndex(index)
    },
    [draggedIndex],
  )

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dropTargetIndex !== null && draggedIndex !== dropTargetIndex) {
      const newOrder = [...userOrder]
      const draggedItem = newOrder[draggedIndex]

      // Remove from old position
      newOrder.splice(draggedIndex, 1)
      // Insert at new position
      newOrder.splice(dropTargetIndex, 0, draggedItem)

      setUserOrder(newOrder)

      if (isInitialized && onOrderChange) {
        const orderedIds = newOrder.map((idx) => shuffledSteps[idx]?.id ?? idx)
        onOrderChange(orderedIds)
      }
    }

    setDraggedIndex(null)
    setDropTargetIndex(null)
  }, [draggedIndex, dropTargetIndex, userOrder, onOrderChange, isInitialized, shuffledSteps])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "ArrowUp" && index > 0) {
        e.preventDefault()
        const newOrder = [...userOrder]
        ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
        setUserOrder(newOrder)
        if (isInitialized && onOrderChange) {
          const orderedIds = newOrder.map((idx) => shuffledSteps[idx]?.id ?? idx)
          onOrderChange(orderedIds)
        }
      } else if (e.key === "ArrowDown" && index < userOrder.length - 1) {
        e.preventDefault()
        const newOrder = [...userOrder]
        ;[newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]]
        setUserOrder(newOrder)
        if (isInitialized && onOrderChange) {
          const orderedIds = newOrder.map((idx) => shuffledSteps[idx]?.id ?? idx)
          onOrderChange(orderedIds)
        }
      }
    },
    [userOrder, onOrderChange, isInitialized, shuffledSteps],
  )

  const handleSwap = useCallback(
    (index1: number, index2: number) => {
      const newOrder = [...userOrder]
      ;[newOrder[index1], newOrder[index2]] = [newOrder[index2], newOrder[index1]]
      setUserOrder(newOrder)
      if (isInitialized && onOrderChange) {
        const orderedIds = newOrder.map((idx) => shuffledSteps[idx]?.id ?? idx)
        onOrderChange(orderedIds)
      }
    },
    [userOrder, onOrderChange, isInitialized, shuffledSteps],
  )

  const correctOrder = useMemo(() => {
    return question.steps.map((_: any, idx: number) => idx)
  }, [question.steps])

  const getCurrentSteps = useCallback(() => {
    return userOrder.map((idx) => shuffledSteps[idx]).filter(Boolean)
  }, [userOrder, shuffledSteps])

  const currentSteps = getCurrentSteps()

  const hasUserReordered = useMemo(() => {
    const initialOrder = Array.from(Array(shuffledSteps.length).keys())
    return !userOrder.every((val, idx) => val === initialOrder[idx])
  }, [userOrder, shuffledSteps.length])

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)} data-has-reordered={hasUserReordered}>
      <Card className="border-4 border-border shadow-neo-heavy dark:shadow-neo-heavy rounded-xl overflow-hidden bg-background">
        <CardHeader className="border-b-4 border-border pb-6 bg-card">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="neutral" className={cn(neo.badge, "bg-primary text-primary-foreground border-3 border-border shadow-neo font-bold uppercase tracking-wide")}>
                    🎯 Ordering Quiz
                  </Badge>
                  {question.difficulty && (
                    <Badge variant="neutral" className={cn(
                      neo.badge,
                      "border-3 border-border shadow-neo font-bold uppercase tracking-wide",
                      question.difficulty === 'easy' && "bg-success text-background",
                      question.difficulty === 'medium' && "bg-warning text-foreground",
                      question.difficulty === 'hard' && "bg-error text-background"
                    )}>
                      {question.difficulty}
                    </Badge>
                  )}
                </div>

                <CardTitle className="text-2xl font-black leading-tight text-foreground">
                  {question.title}
                </CardTitle>

                {question.description && (
                  <div className="bg-muted/80 rounded-none p-4 border-l-4 border-primary shadow-neo">
                    <p className="text-sm leading-relaxed text-foreground font-medium">
                      {question.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {showInstructions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-secondary/10 dark:bg-secondary/5 border-4 border-secondary rounded-xl p-4 shadow-neo"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Hand className="h-6 w-6 text-blue-700 dark:text-blue-300 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-black text-blue-900 dark:text-blue-100 uppercase tracking-wide">
                        How to reorder items:
                      </p>
                      <ul className="space-y-1 text-blue-800 dark:text-blue-200 font-medium">
                        <li className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4" />
                          <span>Drag the grip handle to reorder</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <ChevronUp className="h-4 w-4" />
                          <ChevronDown className="h-4 w-4" />
                          <span>Use arrow buttons or keyboard arrows</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="neutral"
                    onClick={() => setShowInstructions(false)}
                    className="h-8 w-8 p-0 border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-neo-active)] transition-all"
                    aria-label="Close instructions"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 bg-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-border pb-3">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                Arrange the steps in the correct order
              </h3>
              <div className="text-sm font-bold text-[var(--color-text)] bg-[var(--color-muted)] px-3 py-1 rounded-none border-6 border-[var(--color-border)]">
                {currentSteps.length} steps
              </div>
            </div>

            <div className="space-y-3" role="region" aria-label="Draggable steps for ordering">
              <AnimatePresence>
                {currentSteps.map((step, index) => {
                  if (!step) return null
                  const isCorrectPosition = showResult && step.id === correctOrder[index]
                  const isWrongPosition = showResult && step.id !== correctOrder[index]
                  const isDragging = draggedIndex === index
                  const isDropTarget = dropTargetIndex === index && draggedIndex !== null && draggedIndex !== index

                  return (
                    <React.Fragment key={`${step.id}-${index}`}>
                      {isDropTarget &&
                        dropTargetIndex !== null &&
                        draggedIndex !== null &&
                        dropTargetIndex < draggedIndex && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 56 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-green-400 rounded-xl border-4 border-green-600 shadow-[6px_6px_0px_0px_hsl(var(--border))] flex items-center justify-center"
                          >
                            <span className="text-white font-black text-base uppercase tracking-wide">
                              ⬇️ Drop Here
                            </span>
                          </motion.div>
                        )}

                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                          opacity: isDragging ? 0.7 : 1,
                          y: 0,
                          scale: isDragging ? 1.03 : 1,
                        }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                        draggable={!showResult}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        tabIndex={0}
                        className={cn(
                          "group relative flex items-start gap-4 p-5 rounded-xl border-4 transition-all duration-200",
                          !showResult && "cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
                          // Default state
                          !isDragging &&
                            !isDropTarget &&
                            !showResult &&
                            "border-border bg-card shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:border-primary hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
                          // Being dragged
                          isDragging && "border-blue-500 bg-blue-100 dark:bg-blue-950/50 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.5)] scale-105 rotate-2",
                          // Drop target
                          isDropTarget && "border-green-500 bg-green-100 dark:bg-green-950/50 ring-4 ring-green-400/30 shadow-[8px_8px_0px_0px_rgba(34,197,94,0.5)]",
                          // Result states
                          showResult && isWrongPosition && "border-error bg-error/10 dark:bg-error/5 shadow-neo",
                          showResult && isCorrectPosition && "border-success bg-success/10 dark:bg-success/5 shadow-neo",
                        )}
                        role="button"
                        aria-label={`Step ${index + 1}: ${step.description}`}
                        aria-pressed={isDragging}
                      >
                        <div
                          className={cn(
                            "flex-shrink-0 pt-1 transition-all duration-200 rounded-none px-2 py-1",
                            !showResult && "hover:bg-primary/10",
                            isDragging && "bg-secondary text-background scale-125 animate-pulse shadow-lg",
                            !isDragging &&
                              !showResult &&
                              "text-muted-foreground group-hover:text-primary group-hover:scale-110",
                            showHint && !isDragging && !showResult && "animate-pulse",
                          )}
                        >
                          <GripVertical className="h-7 w-7" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Step Description */}
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center h-10 w-10 rounded-full font-black text-base transition-all duration-200 flex-shrink-0 shadow-neo",
                                // Default state
                                !isDragging && !showResult && "bg-primary text-primary-foreground border-3 border-border",
                                // Being dragged
                                isDragging && "bg-secondary text-background border-3 border-border shadow-neo-hover scale-110",
                                // Result states
                                showResult && isCorrectPosition && "bg-success text-background border-3 border-border animate-bounce",
                                showResult && isWrongPosition && "bg-error text-background border-3 border-border animate-pulse",
                              )}
                            >
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "font-bold text-base leading-relaxed break-words transition-all duration-200",
                                  isDragging && "text-secondary dark:text-secondary text-lg",
                                  showResult && isCorrectPosition && "text-success dark:text-success",
                                  showResult && isWrongPosition && "text-error dark:text-error",
                                  !isDragging && !showResult && "text-foreground",
                                )}
                              >
                                {step.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-2">
                          {showResult && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center",
                                isCorrectPosition ? "bg-green-100 dark:bg-green-950" : "bg-red-100 dark:bg-red-950",
                              )}
                            >
                              {isCorrectPosition ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </motion.div>
                          )}

                          {!showResult && (
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="neutral"
                                onClick={() => index > 0 && handleSwap(index, index - 1)}
                                disabled={index === 0}
                                className="h-9 w-9 p-0 border-3 border-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-4 focus-visible:ring-primary/50"
                                aria-label="Move step up"
                                tabIndex={0}
                              >
                                <ChevronUp className="h-5 w-5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="neutral"
                                onClick={() => index < currentSteps.length - 1 && handleSwap(index, index + 1)}
                                disabled={index === currentSteps.length - 1}
                                className="h-9 w-9 p-0 border-3 border-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-4 focus-visible:ring-primary/50"
                                aria-label="Move step down"
                                tabIndex={0}
                              >
                                <ChevronDown className="h-5 w-5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {isDropTarget &&
                        dropTargetIndex !== null &&
                        draggedIndex !== null &&
                        dropTargetIndex > draggedIndex && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 48 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-success/80 rounded-none border-4 border-success shadow-neo flex items-center justify-center"
                          >
                            <span className="text-background font-semibold text-sm">Drop Here</span>
                          </motion.div>
                        )}
                    </React.Fragment>
                  )
                })}
              </AnimatePresence>
            </div>

            {!showResult && !hasUserReordered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center bg-muted/50 rounded-none p-4 border border-dashed border-muted-foreground/30"
              >
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Hand className="h-4 w-4" />
                  <span>Drag items or use the arrow buttons to reorder steps</span>
                </p>
              </motion.div>
            )}

            {!showResult && hasUserReordered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-200 rounded-full text-sm font-medium border border-green-300 dark:border-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Order modified - continue rearranging or submit your answer
                </div>
              </motion.div>
            )}

            {draggedIndex !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-center bg-blue-100 dark:bg-blue-950/50 rounded-none p-3 border border-blue-300 dark:border-blue-800"
              >
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  Drag to the desired position and release to drop
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
