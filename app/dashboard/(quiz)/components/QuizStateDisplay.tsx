"use client"

import { motion } from "framer-motion"
import { Loader2, AlertCircle, RefreshCw, ArrowLeft, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface DisplayProps {
  className?: string
  onReturn?: () => void
}

interface ErrorDisplayProps extends DisplayProps {
  error: string
  onRetry: () => void
}

interface LoadingDisplayProps extends DisplayProps {
  message?: string
}

export function InitializingDisplay({ className }: DisplayProps) {
  return (
    <Card className={`w-full max-w-xl mx-auto ${className || ""}`}>
      <CardHeader>
        <CardTitle className="text-xl text-center">Loading Quiz</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-6">
        <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
        <CardDescription className="text-center">Please wait while we initialize your quiz...</CardDescription>
      </CardContent>
    </Card>
  )
}

export function LoadingDisplay({ message, className }: LoadingDisplayProps) {
  return (
    <Card className={`w-full max-w-xl mx-auto ${className || ""}`}>
      <CardContent className="flex flex-col items-center py-8">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-center text-muted-foreground">{message || "Loading..."}</p>
      </CardContent>
    </Card>
  )
}

export function QuizNotFoundDisplay({ onReturn, className }: DisplayProps) {
  return (
    <Card className={`w-full max-w-xl mx-auto ${className || ""}`}>
      <CardHeader>
        <CardTitle className="text-xl text-center">Quiz Not Found</CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <p className="text-center text-muted-foreground mb-4">
          We couldn't find the quiz you're looking for. It may have been removed or the URL is incorrect.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={onReturn} variant="default">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Return to Quizzes
        </Button>
      </CardFooter>
    </Card>
  )
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onReturn,
  ...props
}) {
  return (
    <div className="container max-w-3xl py-8" data-testid="error-display" {...props}>
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-destructive/20 rounded-full">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-3">Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onRetry} variant="default" data-testid="retry-button">
            Try Again
          </Button>
          <Button onClick={onReturn} variant="outline" data-testid="return-button">
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EmptyQuestionsDisplay({ onReturn, className }: DisplayProps) {
  return (
    <Card className={`w-full max-w-xl mx-auto ${className || ""}`}>
      <CardHeader>
        <CardTitle className="text-xl text-center">No Questions Available</CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <p className="text-center text-muted-foreground mb-4">
          This quiz doesn't have any questions yet. Please try another quiz or check back later.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={onReturn} variant="default">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Return to Quizzes
        </Button>
      </CardFooter>
    </Card>
  )
}
