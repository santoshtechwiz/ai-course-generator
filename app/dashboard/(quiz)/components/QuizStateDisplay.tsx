"use client"

import { useState } from "react"
import type React from "react"
import { motion } from "framer-motion"
import {
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  XCircle,
  FileQuestion,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { useQuiz } from "@/hooks/useQuizState"
import { cn } from "@/lib/utils"

interface LoadingDisplayProps {
  message?: string
  description?: string
  className?: string
}

export const LoadingDisplay: React.FC<LoadingDisplayProps> = ({
  message = "Loading quiz data...",
  description = "Preparing your quiz experience...",
  className,
}) => (
  <motion.div
    key="loading"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={cn("flex flex-col items-center justify-center min-h-[300px] p-6 gap-4", className)}
    aria-live="polite"
    role="status"
  >
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-3 w-3 rounded-full bg-primary"></div>
      </div>
    </div>
    <div className="text-center space-y-2">
      <p className="text-xl font-medium">{message}</p>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
    </div>

    <Progress className="w-64 h-2 mt-2" value={undefined} />
  </motion.div>
)

interface PreparingDisplayProps {
  onRetry: () => void
  className?: string
}

export const PreparingDisplay: React.FC<PreparingDisplayProps> = ({ onRetry, className }) => (
  <motion.div
    key="preparing"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={cn("flex flex-col items-center justify-center min-h-[300px] p-6 gap-4", className)}
    aria-live="polite"
    role="status"
  >
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-3 w-3 rounded-full bg-primary"></div>
      </div>
    </div>
    <div className="text-center space-y-2">
      <p className="text-xl font-medium">Preparing your results</p>
      <p className="text-sm text-muted-foreground max-w-md">We're retrieving your quiz results after sign-in...</p>
    </div>

    <Card className="w-full max-w-md mt-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-sm">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Authentication successful</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
            <span>Processing quiz data...</span>
          </div>

          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={onRetry} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading Results
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

interface SavingDisplayProps {
  className?: string
}

export const SavingDisplay: React.FC<SavingDisplayProps> = ({ className }) => (
  <motion.div
    key="saving"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={cn("flex flex-col items-center justify-center min-h-[300px] p-6 gap-4", className)}
    aria-live="polite"
    role="status"
  >
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-3 w-3 rounded-full bg-primary"></div>
      </div>
    </div>
    <div className="text-center space-y-2">
      <p className="text-xl font-medium">Saving your results</p>
      <p className="text-sm text-muted-foreground max-w-md">Please wait while we save your quiz results...</p>
    </div>

    <Card className="w-full max-w-md mt-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-sm">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Quiz completed successfully</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span>Saving to your account...</span>
          </div>
          <Progress className="h-2 mt-2" value={75} />
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

interface ErrorDisplayProps {
  error: string | null
  onRetry?: () => void
  onReturn?: () => void
  className?: string
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, onReturn, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("w-full max-w-3xl mx-auto p-6", className)}
    role="alert"
  >
    <Card className="border border-destructive/50 bg-destructive/5 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-destructive/20 bg-destructive/10">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive text-lg">Error Loading Quiz</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-4">
          {error || "We couldn't load the quiz data. Please try again later."}
        </p>
        <div className="bg-background/50 rounded-md p-4 border border-border text-sm">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Troubleshooting tips:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Check your internet connection</li>
                <li>Try refreshing the page</li>
                <li>Clear your browser cache</li>
                <li>Try again in a few minutes</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading Quiz
          </Button>
        )}
        {onReturn && (
          <Button onClick={onReturn} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Quizzes
          </Button>
        )}
      </CardFooter>
    </Card>
  </motion.div>
)

interface EmptyQuestionsDisplayProps {
  onReturn: () => void
  message?: string
  description?: string
  className?: string
}

export const EmptyQuestionsDisplay: React.FC<EmptyQuestionsDisplayProps> = ({
  onReturn,
  message = "No Questions Available",
  description = "We couldn't find any questions for this quiz. This could be because the quiz is still being generated or there was an error.",
  className,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("flex flex-col items-center justify-center min-h-[50vh] p-8", className)}
    role="alert"
  >
    <div className="bg-muted/30 rounded-full p-6 mb-6">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
    </div>
    <h3 className="text-2xl font-semibold mb-3">{message}</h3>
    <p className="text-muted-foreground text-center max-w-md mb-8">{description}</p>
    <Button onClick={onReturn} size="lg">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Return to Quizzes
    </Button>
  </motion.div>
)

interface QuizNotFoundDisplayProps {
  onReturn: () => void
  className?: string
}

export const QuizNotFoundDisplay: React.FC<QuizNotFoundDisplayProps> = ({ onReturn, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("flex flex-col items-center justify-center min-h-[50vh] p-8", className)}
    role="alert"
  >
    <div className="bg-destructive/10 rounded-full p-6 mb-6">
      <AlertCircle className="h-16 w-16 text-destructive" />
    </div>
    <h3 className="text-2xl font-semibold mb-3">Quiz Not Found</h3>
    <p className="text-muted-foreground text-center max-w-md mb-8">
      We couldn't find the quiz you're looking for. This could be because the quiz ID or slug is invalid or the quiz has
      been removed.
    </p>
    <Button onClick={onReturn} size="lg">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Return to Quizzes
    </Button>
  </motion.div>
)

interface InitializingDisplayProps {
  message?: string
  className?: string
}

export const InitializingDisplay: React.FC<InitializingDisplayProps> = ({ message = "Loading quiz...", className }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("flex flex-col items-center justify-center min-h-[50vh] p-8", className)}
    role="status"
  >
    <div className="relative mb-6">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-3 w-3 rounded-full bg-primary"></div>
      </div>
    </div>
    <h3 className="text-2xl font-semibold mb-3">{message}</h3>
    <p className="text-muted-foreground text-center max-w-md">Please wait while we prepare your quiz experience.</p>
    <div className="w-64 mt-8">
      <Progress className="h-2" value={undefined} />
    </div>
  </motion.div>
)

interface QuizStateDebuggerProps {
  className?: string
}

export const QuizStateDebugger: React.FC<QuizStateDebuggerProps> = ({ className }) => {
  const quizState = useQuiz()
  const [isOpen, setIsOpen] = useState(false)

  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <Card className={cn("bg-slate-50 border-slate-200 mt-8", className)}>
      <CardHeader className="p-3">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <CardTitle className="text-sm text-slate-700 flex items-center">
              <Info className="h-4 w-4 mr-2 text-slate-500" />
              Quiz State Debugger
            </CardTitle>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-3 pt-0">
              {quizState ? (
                <pre className="text-xs bg-slate-100 p-3 rounded overflow-auto max-h-96 border border-slate-200">
                  {JSON.stringify(quizState, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-slate-500">No quiz state available.</p>
              )}
            </CardContent>
            <CardFooter className="p-3 pt-0 flex justify-end border-t border-slate-200 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  console.log("Quiz State:", quizState)
                }}
              >
                Log to Console
              </Button>
            </CardFooter>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  )
}

// Export a combined component for convenience
export function QuizStateDisplay() {
  return <QuizStateDebugger />
}
