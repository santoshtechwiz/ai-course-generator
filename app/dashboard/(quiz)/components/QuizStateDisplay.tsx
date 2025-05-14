"use client"

import type React from "react"
import { motion } from "framer-motion"
import { AlertCircle, Loader2, Clock, CheckCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoadingDisplayProps {
  isLoadingResults?: boolean
}

export const LoadingDisplay: React.FC<LoadingDisplayProps> = ({ isLoadingResults }) => (
  <motion.div
    key="loading"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center min-h-[200px] gap-3"
    aria-live="polite"
    role="status"
  >
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary"></div>
      </div>
    </div>
    <p className="text-lg font-medium mt-2">{isLoadingResults ? "Loading your results..." : "Loading quiz data..."}</p>
    <p className="text-sm text-muted-foreground">
      {isLoadingResults ? "We're retrieving your quiz results..." : "Preparing your quiz experience..."}
    </p>
  </motion.div>
)

interface PreparingDisplayProps {
  onRetry: () => void
}

export const PreparingDisplay: React.FC<PreparingDisplayProps> = ({ onRetry }) => (
  <motion.div
    key="preparing"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center min-h-[200px] gap-3"
    aria-live="polite"
    role="status"
  >
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary"></div>
      </div>
    </div>
    <p className="text-lg font-medium mt-2">Preparing your results</p>
    <p className="text-sm text-muted-foreground">We're retrieving your quiz results after sign-in...</p>

    <Card className="w-full max-w-md mt-4 p-4">
      <div className="flex items-center space-x-2 text-sm">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>Authentication successful</span>
      </div>
      <div className="flex items-center space-x-2 text-sm mt-2">
        <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
        <span>Processing quiz data...</span>
      </div>

      <div className="mt-4 text-center">
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry Loading Results
        </Button>
      </div>
    </Card>
  </motion.div>
)

export const SavingDisplay: React.FC = () => (
  <motion.div
    key="saving"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center min-h-[200px] gap-3"
    aria-live="polite"
    role="status"
  >
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary"></div>
      </div>
    </div>
    <p className="text-lg font-medium mt-2">Saving your results</p>
    <p className="text-sm text-muted-foreground">Please wait while we save your quiz results...</p>

    <Card className="w-full max-w-md mt-4 p-4">
      <div className="flex items-center space-x-2 text-sm">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>Quiz completed successfully</span>
      </div>
      <div className="flex items-center space-x-2 text-sm mt-2">
        <Loader2 className="h-4 w-4 text-primary animate-spin" />
        <span>Saving to your account...</span>
      </div>
    </Card>
  </motion.div>
)

interface ErrorDisplayProps {
  error: string | null
  onRetry?: () => void
  onReturn?: () => void
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, onReturn }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-3xl mx-auto p-4"
    role="alert"
  >
    <Card className="p-4 border border-destructive bg-destructive/10">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-destructive">Error loading quiz</h3>
          <p className="text-sm mt-1">{error || "We couldn't load the quiz data. Please try again later."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {onRetry && (
              <Button onClick={onRetry} size="sm">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry Loading Quiz
              </Button>
            )}
            {onReturn && (
              <Button onClick={onReturn} variant="outline" size="sm">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Return to Quizzes
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  </motion.div>
)

interface EmptyQuestionsDisplayProps {
  onReturn: () => void
  message?: string
  description?: string
}

export const EmptyQuestionsDisplay: React.FC<EmptyQuestionsDisplayProps> = ({
  onReturn,
  message = "No Questions Available",
  description = "We couldn't find any questions for this quiz. This could be because the quiz is still being generated or there was an error.",
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center min-h-[50vh] p-8"
    role="alert"
  >
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-xl font-semibold mb-2">{message}</h3>
    <p className="text-muted-foreground text-center max-w-md">
      {description}
    </p>
    <Button onClick={onReturn} className="mt-6">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Return to Quizzes
    </Button>
  </motion.div>
)

interface QuizNotFoundDisplayProps {
  onReturn: () => void
}

export const QuizNotFoundDisplay: React.FC<QuizNotFoundDisplayProps> = ({ onReturn }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center min-h-[50vh] p-8"
    role="alert"
  >
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-xl font-semibold mb-2">Quiz Not Found</h3>
    <p className="text-muted-foreground text-center max-w-md">
      We couldn't find the quiz you're looking for. This could be because the quiz ID or slug is invalid.
    </p>
    <Button onClick={onReturn} className="mt-6">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Return to Quizzes
    </Button>
  </motion.div>
)

export const InitializingDisplay: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center min-h-[50vh] p-8"
    role="status"
  >
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary"></div>
      </div>
    </div>
    <h3 className="text-xl font-semibold mb-2 mt-4">Loading quiz...</h3>
    <p className="text-muted-foreground text-center max-w-md">Please wait while we load your quiz.</p>
  </motion.div>
)

import { useQuiz } from "@/hooks/useQuizState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

export function QuizStateDisplay() {
  const { quizState } = useQuiz()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardHeader className="p-3">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <CardTitle className="text-sm text-slate-700">Quiz State</CardTitle>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-3 pt-0">
              {quizState ? (
                <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60">
                  {JSON.stringify(quizState, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-slate-500">No quiz state available.</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  )
}
