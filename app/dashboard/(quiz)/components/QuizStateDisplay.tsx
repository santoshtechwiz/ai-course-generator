"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, RefreshCw, ChevronLeft } from "lucide-react"

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

export function ErrorDisplay({ error, onRetry, onReturn, className }: ErrorDisplayProps) {
  return (
    <Card className={`w-full max-w-xl mx-auto ${className || ""}`}>
      <CardHeader>
        <CardTitle className="text-xl text-center flex items-center justify-center">
          <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
          Error Loading Quiz
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <p className="text-center text-muted-foreground mb-6">{error}</p>
        <div className="flex justify-center gap-4">
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          {onReturn && (
            <Button onClick={onReturn} variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Return
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
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
