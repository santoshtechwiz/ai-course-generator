"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  Clock,
  Target,
  Zap,
  Brain,
  BookOpen,
  Code,
  FileText,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface TokenUsage {
  used: number
  available: number
  remaining: number
  percentage: number
}

interface QuizInfo {
  type: string
  topic?: string
  count?: number
  difficulty?: string
  estimatedTokens?: number
}

interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  showTokenUsage?: boolean
  tokenUsage?: TokenUsage
  quizInfo?: QuizInfo
  status?: "loading" | "error" | "success"
  errorMessage?: string
  children?: React.ReactNode
}

const getQuizIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "mcq":
    case "multiple choice":
      return <Target className="h-5 w-5" />
    case "code":
    case "coding":
      return <Code className="h-5 w-5" />
    case "flashcard":
    case "flashcards":
      return <Brain className="h-5 w-5" />
    case "open ended":
    case "openended":
      return <FileText className="h-5 w-5" />
    case "fill in the blanks":
    case "blanks":
      return <BookOpen className="h-5 w-5" />
    default:
      return <Sparkles className="h-5 w-5" />
  }
}

const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "hard":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  showTokenUsage = false,
  tokenUsage,
  quizInfo,
  status,
  errorMessage,
  children,
}: ConfirmDialogProps) {
  const isLoading = status === "loading"
  const hasError = status === "error"
  const isSuccess = status === "success"

  const handleConfirm = React.useCallback(() => {
    if (isLoading) return
    onConfirm()
  }, [isLoading, onConfirm])

  const handleCancel = React.useCallback(() => {
    if (isLoading) return
    onCancel()
  }, [isLoading, onCancel])

  // Don't render if dialog is not open
  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasError ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : isSuccess ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quiz Information */}
          {quizInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                {getQuizIcon(quizInfo.type)}
                <span className="font-medium text-blue-900 dark:text-blue-100">{quizInfo.type} Details</span>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                {quizInfo.topic && quizInfo.topic !== "Not specified" && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Topic:</span>
                    <span className="font-medium truncate ml-2 max-w-[200px]" title={quizInfo.topic}>
                      {quizInfo.topic}
                    </span>
                  </div>
                )}

                {quizInfo.count && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Questions:</span>
                    <Badge variant="secondary">{quizInfo.count}</Badge>
                  </div>
                )}

                {quizInfo.difficulty && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Difficulty:</span>
                    <Badge className={getDifficultyColor(quizInfo.difficulty)}>{quizInfo.difficulty}</Badge>
                  </div>
                )}

                {quizInfo.estimatedTokens && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Est. Tokens:</span>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span className="font-medium">{quizInfo.estimatedTokens}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Token Usage */}
          {showTokenUsage && tokenUsage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Credit Usage</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{tokenUsage.remaining} remaining</span>
                </div>
              </div>

              <div className="space-y-2">
                <Progress
                  value={tokenUsage.percentage}
                  className={cn(
                    "h-2",
                    tokenUsage.percentage > 80
                      ? "bg-red-100"
                      : tokenUsage.percentage > 60
                        ? "bg-yellow-100"
                        : "bg-green-100",
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{tokenUsage.used} used</span>
                  <span>{tokenUsage.available} total</span>
                </div>
              </div>

              {tokenUsage.remaining < 5 && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-amber-800 dark:text-amber-200">
                    Low credits remaining. Consider upgrading your plan.
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Custom Content */}
          {children && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Separator className="my-4" />
              {children}
            </motion.div>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {hasError && errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
              >
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Generation Failed</p>
                    <p className="text-xs text-red-600 dark:text-red-300">{errorMessage}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Generating your quiz...</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      This may take a few moments. Please don't close this window.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto bg-transparent"
          >
            {cancelText}
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={isLoading || hasError}
            className={cn(
              "w-full sm:w-auto",
              isLoading && "bg-blue-600 hover:bg-blue-600",
              hasError && "bg-red-600 hover:bg-red-600",
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : hasError ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Try Again
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
