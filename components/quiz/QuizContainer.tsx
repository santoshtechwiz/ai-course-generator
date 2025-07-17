"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertTriangle, Keyboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizType } from "@/app/types/quiz-types"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface QuizContainerProps {
  children: React.ReactNode
  questionNumber: number
  totalQuestions: number
  quizType: QuizType,
  animationKey?: string | number
  className?: string
  contentClassName?: string
  quizTitle?: string
  quizSubtitle?: string
  timeSpent?: number
  difficulty?: "easy" | "medium" | "hard"
  error?: string | null
  onRetry?: () => void
  enableKeyboardShortcuts?: boolean
  autoSave?: boolean
  lastSaved?: Date
}

export function QuizContainer({
  children,
  questionNumber,
  totalQuestions,
  quizType,
  animationKey,
  className,
  contentClassName,
  quizTitle,
  quizSubtitle,
  timeSpent,
  error,
  onRetry,
  enableKeyboardShortcuts = true,
  autoSave = false,
  lastSaved,
}: QuizContainerProps) {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const progress = (questionNumber / totalQuestions) * 100

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Show keyboard help with ?
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        setShowKeyboardHelp(!showKeyboardHelp)
      }
      
      // Help with Ctrl/Cmd + /
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault()
        setShowKeyboardHelp(!showKeyboardHelp)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardShortcuts, showKeyboardHelp])

  const getQuizTypeInfo = () => {
    switch (quizType) {
      case "mcq":
        return { label: "Multiple Choice", color: "bg-blue-500", category: "Selection" }
      case "openended":
        return { label: "Open Ended", color: "bg-green-500", category: "Writing" }
      case "blanks":
        return { label: "Fill in Blanks", color: "bg-purple-500", category: "Completion" }
      case "code":
        return { label: "Code Challenge", color: "bg-orange-500", category: "Programming" }
      case "flashcard":
        return { label: "Flashcard", color: "bg-pink-500", category: "Memory" }
      default:
        return { label: "Quiz", color: "bg-gray-500", category: "General" }
    }
  }

  const typeInfo = getQuizTypeInfo()

  return (
    <TooltipProvider>
      <motion.div
        key={animationKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className={cn("w-full max-w-4xl mx-auto", className)}
        role="main"
        aria-label={`Quiz: ${quizTitle || 'Untitled Quiz'}`}
      >
        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="ml-2 text-sm underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                  >
                    Try Again
                  </button>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-muted/30 border-b border-border px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span 
                    className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm"
                    aria-label={`Question ${questionNumber} of ${totalQuestions}`}
                  >
                    {questionNumber}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Question {questionNumber} of {totalQuestions}
                    </div>
                    {quizSubtitle && <div className="text-xs text-muted-foreground">{quizSubtitle}</div>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className={cn("text-white text-xs", typeInfo.color)}>
                      {typeInfo.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quiz Type: {typeInfo.category}</p>
                  </TooltipContent>
                </Tooltip>

                {timeSpent && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Time spent on this quiz</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {enableKeyboardShortcuts && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                        className="p-1 rounded hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-label="Show keyboard shortcuts"
                      >
                        <Keyboard className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Keyboard shortcuts (Press ? for help)</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress 
                value={progress} 
                className="h-2" 
                aria-label={`Quiz progress: ${Math.round(progress)}% complete`}
              />
            </div>

            {quizTitle && (
              <div className="mt-3">
                <h1 className="text-lg font-semibold text-foreground">{quizTitle}</h1>
              </div>
            )}

            {/* Auto-save indicator */}
            {autoSave && lastSaved && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Auto-saved {new Date(lastSaved).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Keyboard Help Overlay */}
          {showKeyboardHelp && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-muted border-b border-border px-6 py-3"
            >
              <div className="text-sm">
                <div className="font-medium mb-2">Keyboard Shortcuts:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><kbd className="px-1 py-0.5 bg-background border rounded">Enter</kbd> Submit answer</div>
                  <div><kbd className="px-1 py-0.5 bg-background border rounded">Space</kbd> Next question</div>
                  <div><kbd className="px-1 py-0.5 bg-background border rounded">H</kbd> Show hint</div>
                  <div><kbd className="px-1 py-0.5 bg-background border rounded">?</kbd> Toggle this help</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Content */}
          <div className={cn("p-6", contentClassName)}>{children}</div>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
