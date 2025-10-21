"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  XCircle,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Define types locally to avoid import issues
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
  difficulty?: 'easy' | 'medium' | 'hard'
  steps: OrderingQuizStep[]
  type: 'ordering'
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
  hideSubmitButton?: boolean // Hide submit button for external control
  onOrderChange?: (userOrder: number[]) => void // Callback when order changes
}

/**
 * Shuffle array in place using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * OrderingQuiz Component
 * Interactive drag-and-drop component for ordering/sequencing quiz questions
 * IMPORTANT: Answer is NOT revealed during the game - only shown AFTER submission
 */
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
  const [isInitialized, setIsInitialized] = useState(false) // Track initialization

  useEffect(() => {
    const shuffled = shuffleArray(question.steps).map((step: any, index: number) => {
      // Handle both string and object step formats - ensure we get a clean string
      let description = ''
      if (typeof step === 'string') {
        description = step
      } else if (step && typeof step === 'object') {
        // If step is an object, extract description property
        if (typeof step.description === 'string') {
          description = step.description
        } else if (step.description) {
          // If description exists but isn't a string, convert it
          description = String(step.description)
        } else {
          // Fallback: try to stringify the whole object (avoid [object Object])
          description = JSON.stringify(step)
        }
      } else {
        description = String(step || '')
      }
      
      return {
        id: typeof step.id === 'number' ? step.id : index,
        description: description,
        explanation: '', // Never show explanations
        currentIndex: index,
      } as DraggableStep
    })
    setShuffledSteps(shuffled)
    const initialOrder = shuffled.map((_: any, idx: number) => idx)
    setUserOrder(initialOrder)
    
    // Mark as initialized after setting initial order
    setTimeout(() => setIsInitialized(true), 100)
  }, [question.steps])

  // Reference props that may be unused at the moment so TypeScript doesn't complain
  useEffect(() => {
    void onSubmit
    void onRetry
    void isSubmitting
    void hideSubmitButton
  }, [onSubmit, onRetry, isSubmitting, hideSubmitButton])

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // Only reorder if we're hovering over a different position than current dragged position
    if (draggedIndex !== index) {
      const newOrder = [...userOrder]
      const draggedItem = newOrder[draggedIndex]

      // Remove the dragged item from its current position
      newOrder.splice(draggedIndex, 1)

      // Insert it at the new position
      newOrder.splice(index, 0, draggedItem)

      setUserOrder(newOrder)
      setDraggedIndex(index)

      // Always notify parent when order changes (after initialization)
      if (isInitialized && onOrderChange) {
        // Return the IDs in the new order, not the indices
        const orderedIds = newOrder.map((idx) => shuffledSteps[idx]?.id ?? idx)
        onOrderChange(orderedIds)
      }
    }
  }, [draggedIndex, userOrder, onOrderChange, isInitialized, shuffledSteps])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "ArrowUp" && index > 0) {
        e.preventDefault()
        const newOrder = [...userOrder]
        ;[newOrder[index - 1], newOrder[index]] = [
          newOrder[index],
          newOrder[index - 1],
        ]
        setUserOrder(newOrder)
        if (isInitialized && onOrderChange) {
          const orderedIds = newOrder.map((idx) => shuffledSteps[idx]?.id ?? idx)
          onOrderChange(orderedIds)
        }
      } else if (e.key === "ArrowDown" && index < userOrder.length - 1) {
        e.preventDefault()
        const newOrder = [...userOrder]
        ;[newOrder[index + 1], newOrder[index]] = [
          newOrder[index],
          newOrder[index + 1],
        ]
        setUserOrder(newOrder)
        if (isInitialized && onOrderChange) {
          const orderedIds = newOrder.map((idx) => shuffledSteps[idx]?.id ?? idx)
          onOrderChange(orderedIds)
        }
      }
    },
    [userOrder, onOrderChange, isInitialized, shuffledSteps]
  )

  const handleSwap = useCallback((index1: number, index2: number) => {
    const newOrder = [...userOrder]
    ;[newOrder[index1], newOrder[index2]] = [
      newOrder[index2],
      newOrder[index1],
    ]
    setUserOrder(newOrder)
    if (isInitialized && onOrderChange) {
      const orderedIds = newOrder.map((idx) => shuffledSteps[idx]?.id ?? idx)
      onOrderChange(orderedIds)
    }
  }, [userOrder, onOrderChange, isInitialized, shuffledSteps])

  const correctOrder = useMemo(() => {
    return question.steps.map((_: any, idx: number) => idx)
  }, [question.steps])

  const getCurrentSteps = useCallback(() => {
    return userOrder.map((idx) => shuffledSteps[idx]).filter(Boolean)
  }, [userOrder, shuffledSteps])

  const currentSteps = getCurrentSteps()

  // Check if user has made any changes from initial order
  const hasUserReordered = useMemo(() => {
    const initialOrder = Array.from(Array(shuffledSteps.length).keys())
    return !userOrder.every((val, idx) => val === initialOrder[idx])
  }, [userOrder, shuffledSteps.length])

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)} data-has-reordered={hasUserReordered}>
      <Card className="border-2 border-primary/50 shadow-lg">
        <CardHeader className="border-b pb-6 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                    Ordering Quiz
                  </Badge>
                  {question.difficulty && (
                    <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {question.difficulty}
                    </Badge>
                  )}
                </div>

                <CardTitle className="text-2xl font-bold leading-tight">
                  {question.title}
                </CardTitle>

                {question.description && (
                  <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                    <p className="text-sm leading-relaxed text-foreground">
                      {question.description}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                  <span>Drag and drop or use arrow keys to reorder the steps</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Arrange the steps in the correct order
              </h3>
              <div className="text-sm text-muted-foreground">
                {currentSteps.length} steps
              </div>
            </div>

            <div
              className="space-y-3"
              role="region"
              aria-label="Draggable steps for ordering"
            >
              <AnimatePresence>
                {currentSteps.map((step, index) => {
                  if (!step) return null
                  const isCorrectPosition =
                    showResult &&
                    step.id === correctOrder[index]
                  const isWrongPosition =
                    showResult &&
                    step.id !== correctOrder[index]

                  return (
                    <motion.div
                      key={`${step.id}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      draggable={true}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      tabIndex={0}
                      className={cn(
                        "group relative flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-300",
                        "cursor-move hover:shadow-lg hover:scale-[1.01]",
                        // Default state
                        draggedIndex === null &&
                          "border-border bg-card hover:border-primary/50 hover:bg-primary/5",
                        // Being dragged - bright blue with glow
                        draggedIndex === index &&
                          "border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-2xl shadow-blue-500/30 scale-105 rotate-2 z-50 ring-4 ring-blue-400/50",
                        // Result states (only when showing results)
                        showResult && isWrongPosition && "ring-2 ring-red-200 border-red-300",
                        showResult && isCorrectPosition && "ring-2 ring-green-200 border-green-300"
                      )}
                      role="button"
                      aria-label={`Step ${index + 1}: ${step.description}`}
                      aria-pressed={draggedIndex === index}
                    >
                      <div className={cn(
                        "flex-shrink-0 pt-1 transition-all duration-300",
                        draggedIndex === index && "text-blue-600 scale-110 animate-pulse",
                        draggedIndex === null && "text-muted-foreground group-hover:text-primary"
                      )}>
                        <GripVertical className="h-6 w-6" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Question Title */}
                        <div className="text-sm font-semibold text-primary/80 border-b border-primary/20 pb-1">
                          {question.title}
                        </div>

                        {/* Question Description */}
                        {question.description && (
                          <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1 border-l-2 border-primary/30">
                            {question.description}
                          </div>
                        )}

                        {/* Step Description */}
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm transition-all duration-300",
                            // Default state
                            draggedIndex === null &&
                              "bg-primary/10 text-primary border-2 border-primary/20",
                            // Being dragged - bright blue
                            draggedIndex === index &&
                              "bg-blue-500 text-white border-2 border-blue-600 shadow-lg shadow-blue-500/50 scale-110 animate-bounce",
                            // Result states
                            showResult && isCorrectPosition && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                            showResult && isWrongPosition && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          )}>
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className={cn(
                              "font-medium leading-relaxed break-words transition-all duration-300",
                              draggedIndex === index && "text-blue-700 dark:text-blue-300 font-semibold",
                              showResult && isCorrectPosition && "text-green-700 dark:text-green-300 font-semibold",
                              showResult && isWrongPosition && "text-red-700 dark:text-red-300 font-semibold",
                              draggedIndex === null && !showResult && "text-foreground"
                            )}>
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
                              isCorrectPosition
                                ? "bg-green-100 dark:bg-green-950"
                                : "bg-red-100 dark:bg-red-950"
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
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="neutral"
                              onClick={() =>
                                index > 0 &&
                                handleSwap(index, index - 1)
                              }
                              disabled={index === 0}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="neutral"
                              onClick={() =>
                                index < currentSteps.length - 1 &&
                                handleSwap(index, index + 1)
                              }
                              disabled={
                                index ===
                                currentSteps.length - 1
                              }
                              className="h-8 w-8 p-0"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {!showResult && !hasUserReordered && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  💡 Tip: Drag items or use the arrow buttons to reorder steps
                </p>
              </div>
            )}

            {!showResult && hasUserReordered && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Order modified - drag items to continue rearranging
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrderingQuiz
