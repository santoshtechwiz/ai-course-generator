"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
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

interface OrderingQuizSingleProps {
  question: OrderingQuizQuestion
  questionNumber: number
  totalQuestions: number
  onAnswer?: (userOrder: number[]) => void
  existingAnswer?: number[]
  className?: string
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
 * OrderingQuizSingle Component
 * Interactive drag-and-drop component for a SINGLE ordering question
 * Integrates with unified quiz architecture (QuizPlayLayout + QuizFooter)
 * Does NOT show results or have submit button - just collects answer
 */
export const OrderingQuizSingle: React.FC<OrderingQuizSingleProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  existingAnswer,
  className = "",
}) => {
  const [shuffledSteps, setShuffledSteps] = useState<DraggableStep[]>([])
  const [userOrder, setUserOrder] = useState<number[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [justSwapped, setJustSwapped] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Initialize shuffled steps on mount or when question ID changes
  useEffect(() => {
    // Reset initialization flag when question changes
    setIsInitialized(false)
    
    // If there's an existing answer, restore it
    if (existingAnswer && existingAnswer.length > 0) {
      // Reconstruct shuffled steps from existing answer
      const steps = question.steps.map((step, index) => ({
        id: index,
        description: typeof step === 'string' ? step : step.description || String(step),
        explanation: '',
        currentIndex: index,
      }))
      setShuffledSteps(steps)
      setUserOrder(existingAnswer)
      setTimeout(() => setIsInitialized(true), 50)
      return
    }

    // Otherwise, shuffle for new question
    const shuffled = shuffleArray(question.steps).map((step: any, index: number) => {
      let description = ''
      if (typeof step === 'string') {
        description = step
      } else if (step && typeof step === 'object') {
        description = typeof step.description === 'string' 
          ? step.description 
          : String(step.description || step)
      } else {
        description = String(step || '')
      }
      
      return {
        id: typeof step.id === 'number' ? step.id : index,
        description: description,
        explanation: '',
        currentIndex: index,
      } as DraggableStep
    })
    
    setShuffledSteps(shuffled)
    const initialOrder = shuffled.map((_: any, idx: number) => idx)
    setUserOrder(initialOrder)
    
    setTimeout(() => setIsInitialized(true), 50)
  }, [question.id])
  // Only depend on question.id to avoid re-shuffling on every render

  // Notify parent of answer changes (fixes setState bug)
  useEffect(() => {
    if (!isInitialized || !onAnswer || userOrder.length === 0) return
    
    const orderedIds = userOrder.map((idx) => shuffledSteps[idx]?.id ?? idx)
    onAnswer(orderedIds)
  }, [userOrder, isInitialized])
  // Deliberately excluding onAnswer and shuffledSteps to avoid loops

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
    setDragOverIndex(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    setDragOverIndex(index)
    
    setUserOrder((prevOrder) => {
      const newOrder = [...prevOrder]
      const draggedItem = newOrder[draggedIndex]
      newOrder[draggedIndex] = newOrder[index]
      newOrder[index] = draggedItem
      return newOrder
    })
    setDraggedIndex(index)
    
    // Visual feedback
    setJustSwapped(index)
    setTimeout(() => setJustSwapped(null), 300)
  }, [draggedIndex])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "ArrowUp" && index > 0) {
        e.preventDefault()
        setUserOrder((prevOrder) => {
          const newOrder = [...prevOrder]
          ;[newOrder[index - 1], newOrder[index]] = [
            newOrder[index],
            newOrder[index - 1],
          ]
          return newOrder
        })
        // Visual feedback
        setJustSwapped(index - 1)
        setTimeout(() => setJustSwapped(null), 300)
      } else if (e.key === "ArrowDown" && index < userOrder.length - 1) {
        e.preventDefault()
        setUserOrder((prevOrder) => {
          const newOrder = [...prevOrder]
          ;[newOrder[index + 1], newOrder[index]] = [
            newOrder[index],
            newOrder[index + 1],
          ]
          return newOrder
        })
        // Visual feedback
        setJustSwapped(index + 1)
        setTimeout(() => setJustSwapped(null), 300)
      }
    },
    [userOrder.length]
  )

  const handleSwap = useCallback((index1: number, index2: number) => {
    setUserOrder((prevOrder) => {
      const newOrder = [...prevOrder]
      ;[newOrder[index1], newOrder[index2]] = [
        newOrder[index2],
        newOrder[index1],
      ]
      return newOrder
    })
    // Visual feedback
    setJustSwapped(index2)
    setTimeout(() => setJustSwapped(null), 300)
  }, [])

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
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <Card className="border-3 border-primary/50 shadow-[6px_6px_0px_0px_hsl(var(--primary)/0.2)]">
        <CardHeader className="border-b-3 border-border pb-4 bg-gradient-to-br from-muted/50 to-muted/30">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge 
                    variant="default" 
                    className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-2 border-blue-700 shadow-sm"
                  >
                    Question {questionNumber} of {totalQuestions}
                  </Badge>
                  {question.difficulty && (
                    <Badge 
                      variant="default" 
                      className={cn(
                        "text-xs font-bold border-2",
                        question.difficulty === 'easy' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-400",
                        question.difficulty === 'medium' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-400",
                        question.difficulty === 'hard' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-400"
                      )}
                    >
                      {question.difficulty}
                    </Badge>
                  )}
                  {hasUserReordered && (
                    <Badge 
                      variant="default" 
                      className="text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-2 border-purple-400 animate-pulse"
                    >
                      ✓ Modified
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl font-black bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  {question.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {question.description ||
                    "Drag and drop the items to arrange them in the correct order."}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border-2 border-border">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-xs font-bold uppercase text-foreground tracking-wider">
                  Drag to Reorder
                </p>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {currentSteps.length} steps to arrange
              </p>
            </div>

            <div
              className="space-y-2"
              role="region"
              aria-label="Draggable steps for ordering"
            >
              <AnimatePresence>
                {currentSteps.map((step, index) => {
                  if (!step) return null

                  return (
                    <motion.div
                      key={`${step.id}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: justSwapped === index ? [1, 1.05, 1] : 1,
                      }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ 
                        duration: 0.2,
                        scale: { duration: 0.3 }
                      }}
                      draggable={true}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      tabIndex={0}
                      className={cn(
                        "group relative flex items-start gap-3 p-4 rounded-lg border-3",
                        "transition-all duration-200 bg-card",
                        "cursor-move focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        // Default state
                        draggedIndex !== index && dragOverIndex !== index && justSwapped !== index &&
                          "border-border shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:shadow-[5px_5px_0px_0px_hsl(var(--primary)/0.3)] hover:border-primary/40",
                        // Being dragged
                        draggedIndex === index &&
                          "border-green-500 bg-green-50 dark:bg-green-950 shadow-[6px_6px_0px_0px_hsl(142,76%,36%)] scale-105 rotate-2 z-50",
                        // Drag over target
                        dragOverIndex === index && draggedIndex !== index &&
                          "border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-[5px_5px_0px_0px_hsl(221,83%,53%)] scale-102",
                        // Just swapped animation
                        justSwapped === index &&
                          "border-purple-500 bg-purple-50 dark:bg-purple-950 shadow-[5px_5px_0px_0px_hsl(271,81%,56%)]",
                        // Other items fade when dragging
                        draggedIndex !== null && draggedIndex !== index && dragOverIndex !== index && 
                          "opacity-60 scale-98"
                      )}
                      role="button"
                      aria-label={`Step ${index + 1}: ${step.description}`}
                      aria-pressed={draggedIndex === index}
                    >
                      <div className={cn(
                        "flex-shrink-0 pt-1 transition-all duration-200",
                        draggedIndex === index && "text-green-600 animate-pulse",
                        dragOverIndex === index && draggedIndex !== index && "text-blue-600",
                        justSwapped === index && "text-purple-600",
                        draggedIndex !== index && dragOverIndex !== index && justSwapped !== index &&
                          "text-muted-foreground group-hover:text-primary"
                      )}>
                        <GripVertical className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="default" 
                            className={cn(
                              "h-7 w-7 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200",
                              "border-2 shadow-sm",
                              draggedIndex === index && "bg-green-500 border-green-600 text-white scale-110 shadow-green-500/50",
                              dragOverIndex === index && draggedIndex !== index && "bg-blue-500 border-blue-600 text-white scale-110 shadow-blue-500/50",
                              justSwapped === index && "bg-purple-500 border-purple-600 text-white scale-110 shadow-purple-500/50",
                              draggedIndex !== index && dragOverIndex !== index && justSwapped !== index &&
                                "bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-600 text-white"
                            )}
                          >
                            {index + 1}
                          </Badge>
                          <p className={cn(
                            "font-medium break-words transition-colors duration-200",
                            draggedIndex === index && "text-green-700 dark:text-green-300 font-semibold",
                            dragOverIndex === index && draggedIndex !== index && "text-blue-700 dark:text-blue-300",
                            justSwapped === index && "text-purple-700 dark:text-purple-300",
                            draggedIndex !== index && dragOverIndex !== index && justSwapped !== index && "text-foreground"
                          )}>
                            {step.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="neutral"
                          onClick={() =>
                            index > 0 &&
                            handleSwap(index, index - 1)
                          }
                          disabled={index === 0}
                          className="h-8 w-8 p-0 border-2"
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
                          className="h-8 w-8 p-0 border-2"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>

          {!hasUserReordered && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 <strong>Tip:</strong> Drag items to reorder them, or use the arrow buttons. You can also use keyboard arrows after selecting an item.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default OrderingQuizSingle
