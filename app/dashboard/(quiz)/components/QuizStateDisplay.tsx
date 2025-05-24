"use client"

import { motion } from "framer-motion"
import { Loader2, AlertCircle, Home, RefreshCw, ClipboardX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DisplayProps {
  className?: string
  message?: string
  onReturn?: () => void
  onRetry?: () => void
}

interface ErrorDisplayProps extends DisplayProps {
  error: string
}

export function InitializingDisplay({ message = "Loading quiz...", className }: DisplayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center justify-center min-h-[300px] ${className || ""}`}
    >
      <Card className="w-full max-w-xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium text-muted-foreground">{message}</p>
          </div>
        </CardContent>
      </Card>
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
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl text-center">Error Loading Quiz</CardTitle>
          <CardDescription className="text-center">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {onReturn && (
              <Button
                variant="outline"
                onClick={onReturn}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Return to Dashboard
              </Button>
            )}
            {onRetry && (
              <Button 
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
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
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-muted">
              <ClipboardX className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl text-center">No Questions Available</CardTitle>
          <CardDescription className="text-center">
            This quiz doesn't have any questions yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onReturn && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={onReturn}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Return to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
