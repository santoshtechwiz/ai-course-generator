"use client"

import type React from "react"
import { motion } from "framer-motion"
import { AlertCircle, Loader2, Clock, CheckCircle, RotateCcw } from "lucide-react"
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
  >
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary"></div>
      </div>
    </div>
    <p className="text-lg font-medium mt-2">Preparing your results</p>
    <p className="text-sm text-muted-foreground">We're retrieving your quiz results after sign-in...</p>

    <div className="w-full max-w-md mt-4 bg-muted/50 rounded-lg p-4">
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
          <RotateCcw className="h-3 w-3 mr-1" />
          Retry Loading Results
        </Button>
      </div>
    </div>
  </motion.div>
)

type SavingDisplayProps = {}

export const SavingDisplay: React.FC<SavingDisplayProps> = () => (
  <motion.div
    key="saving"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center min-h-[200px] gap-3"
    aria-live="polite"
  >
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary"></div>
      </div>
    </div>
    <p className="text-lg font-medium mt-2">Saving your results</p>
    <p className="text-sm text-muted-foreground">Please wait while we save your quiz results...</p>

    <div className="w-full max-w-md mt-4 bg-muted/50 rounded-lg p-4">
      <div className="flex items-center space-x-2 text-sm">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>Quiz completed successfully</span>
      </div>
      <div className="flex items-center space-x-2 text-sm mt-2">
        <Loader2 className="h-4 w-4 text-primary animate-spin" />
        <span>Saving to your account...</span>
      </div>
    </div>
  </motion.div>
)

interface ErrorDisplayProps {
  error: string | null
  onRetry: () => void
  onReturn: () => void
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, onReturn }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl mx-auto p-4">
    <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-destructive">Error loading quiz</h3>
          <p className="text-sm mt-1">{error || "We couldn't load the quiz data. Please try again later."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={onRetry} size="sm">
              Retry Loading Quiz
            </Button>
            <Button onClick={onReturn} variant="outline" size="sm">
              Return to Quizzes
            </Button>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
)

interface EmptyQuestionsDisplayProps {
  onReturn: () => void
}

export const EmptyQuestionsDisplay: React.FC<EmptyQuestionsDisplayProps> = ({ onReturn }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-xl font-semibold mb-2">No Questions Available</h3>
    <p className="text-muted-foreground text-center max-w-md">
      We couldn't find any questions for this quiz. This could be because the quiz is still being generated or there was
      an error.
    </p>
    <Button onClick={onReturn} className="mt-6">
      Return to Quizzes
    </Button>
  </div>
)

interface QuizNotFoundDisplayProps {
  onReturn: () => void
}

export const QuizNotFoundDisplay: React.FC<QuizNotFoundDisplayProps> = ({ onReturn }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-xl font-semibold mb-2">Quiz Not Found</h3>
    <p className="text-muted-foreground text-center max-w-md">
      We couldn't find the quiz you're looking for. This could be because the quiz ID or slug is invalid.
    </p>
    <Button onClick={onReturn} className="mt-6">
      Return to Quizzes
    </Button>
  </div>
)

type InitializingDisplayProps = {}

export const InitializingDisplay: React.FC<InitializingDisplayProps> = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
    <h3 className="text-xl font-semibold mb-2">Loading quiz...</h3>
    <p className="text-muted-foreground text-center max-w-md">Please wait while we load your quiz.</p>
  </div>
)
