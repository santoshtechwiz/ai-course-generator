"use client"

import { motion } from "framer-motion"
import { Loader2, AlertCircle, Home, RefreshCcw, ClipboardX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface DisplayProps {
  className?: string
  message?: string
  onReturn?: () => void
  onRetry?: () => void
}

interface ErrorDisplayProps extends DisplayProps {
  error: string
}

export function InitializingDisplay({ message = "Initializing quiz...", className }: DisplayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center justify-center min-h-[300px] ${className || ""}`}
    >
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">{message}</h2>
        <p className="text-muted-foreground">Please wait while we load the quiz content.</p>
      </div>
    </motion.div>
  )
}

export function LoadingDisplay({ message = "Loading quiz...", className }: DisplayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center justify-center min-h-[300px] ${className || ""}`}
    >
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">{message}</h2>
        <p className="text-muted-foreground">This may take a moment...</p>
      </div>
    </motion.div>
  )
}

export function ErrorDisplay({ error, onRetry, onReturn, className }: ErrorDisplayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-center min-h-[300px] ${className || ""}`}
    >
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
            Error Loading Quiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{error}</p>
          <p className="text-muted-foreground text-sm">
            Please try again or return to the dashboard.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          {onRetry && (
            <Button variant="outline" onClick={onRetry} className="flex-1">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          {onReturn && (
            <Button 
              onClick={onReturn} 
              className="flex-1"
              variant={onRetry ? "default" : "outline"}
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export function EmptyQuestionsDisplay({ onReturn, className }: DisplayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-center min-h-[300px] ${className || ""}`}
    >
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
            No Questions Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This quiz doesn't have any questions yet, or we couldn't load them.</p>
        </CardContent>
        <CardFooter>
          {onReturn && (
            <Button onClick={onReturn} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
