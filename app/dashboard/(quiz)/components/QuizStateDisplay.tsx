"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

// Enhanced loading display with animation
export const InitializingDisplay = ({ message = "Loading quiz..." }: { message?: string }) => (
  <motion.div 
    className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
    <h3 className="text-xl font-medium mb-2">{message}</h3>
    <p className="text-muted-foreground">Please wait while we prepare your quiz...</p>
  </motion.div>
)

// Enhanced empty questions display
export const EmptyQuestionsDisplay = ({ 
  onReturn, 
  message = "No questions found" 
}: { 
  onReturn: () => void
  message?: string 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl text-center">Quiz Unavailable</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-muted rounded-full p-3">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <p className="mb-4">{message}</p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={onReturn} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Return to Dashboard
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
)

// Enhanced error display with retry option
export const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onReturn 
}: { 
  error: string
  onRetry: () => void
  onReturn: () => void 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <Card className="w-full max-w-md mx-auto border-destructive/20">
      <CardHeader>
        <CardTitle className="text-xl text-center text-destructive">Error Loading Quiz</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-destructive/10 rounded-full p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <p className="mb-4">{error}</p>
        <p className="text-sm text-muted-foreground mb-4">
          This could be due to a network issue or the quiz may no longer be available.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center gap-3">
        <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <Button onClick={onReturn} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Return to Dashboard
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
)
