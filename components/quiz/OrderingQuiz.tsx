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

    const newOrder = [...userOrder]
    const draggedItem = newOrder[draggedIndex]
    newOrder[draggedIndex] = newOrder[index]
    newOrder[index] = draggedItem
    setUserOrder(newOrder)
    setDraggedIndex(index)
    
    // Always notify parent when order changes (after initialization)
    if (isInitialized && onOrderChange) {
      // Return the IDs in the new order, not the indices
      const orderedIds = newOrder.map((idx) => shuffledSteps[idx]?.id ?? idx)
      onOrderChange(orderedIds)
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
    <div className={cn("w-full max-w-3xl mx-auto", className)} data-has-reordered={hasUserReordered}>
      <Card className="border-2 border-primary/50">
        <CardHeader className="border-b pb-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold mb-2">
                  {question.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {question.description ||
                    "Arrange the steps in the correct order."}
                </p>
              </div>
              {question.difficulty && (
                <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {question.difficulty}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Current Order
            </p>

            <div
              className="space-y-2"
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
                        "group relative flex items-start gap-3 p-4 rounded-lg border-2",
                        "transition-all duration-200",
                        "cursor-move hover:shadow-md",
                        draggedIndex === index
                          ? "opacity-50 border-primary bg-primary/20 shadow-lg scale-105"
                          : "border-border hover:border-primary/50 bg-card",
                        draggedIndex !== null && draggedIndex !== index && "opacity-70",
                        showResult && isWrongPosition && "ring-1 ring-red-200"
                      )}
                      role="button"
                      aria-label={`Step ${index + 1}: ${step.description}`}
                      aria-pressed={draggedIndex === index}
                    >
                      <div className={cn(
                        "flex-shrink-0 pt-1 transition-colors",
                        draggedIndex === index
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}>
                        <GripVertical className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                            {index + 1}
                          </span>
                          <p className="font-medium break-words">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {showResult && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center",
                              isCorrectPosition
                                ? "bg-green-100 dark:bg-green-950"
                                : "bg-red-100 dark:bg-red-950"
                            )}
                          >
                            {isCorrectPosition ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </motion.div>
                        )}
                      </div>

                      {!showResult && (
                        <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              index > 0 &&
                              handleSwap(index, index - 1)
                            }
                            disabled={index === 0}
                            className="h-7 w-7 p-0"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              index < currentSteps.length - 1 &&
                              handleSwap(index, index + 1)
                            }
                            disabled={
                              index ===
                              currentSteps.length - 1
                            }
                            className="h-7 w-7 p-0"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrderingQuiz
