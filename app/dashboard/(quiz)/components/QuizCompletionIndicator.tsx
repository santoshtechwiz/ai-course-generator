"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface QuizCompletionIndicatorProps {
  message?: string
  completeMessage?: string
  duration?: number
  onComplete?: () => void
  showSpinner?: boolean
  status?: 'idle' | 'processing' | 'complete' | 'error'
}

export function QuizCompletionIndicator({
  message = "Processing your answers...",
  completeMessage = "Quiz completed successfully!",
  duration = 1500,
  onComplete,
  showSpinner = false,
  status = 'processing'
}: QuizCompletionIndicatorProps) {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(status === 'complete')
  
  useEffect(() => {
    if (status === 'complete') {
      setProgress(100)
      setIsComplete(true)
      if (onComplete) {
        setTimeout(onComplete, 500)
      }
      return
    }
    
    if (status === 'idle' || status === 'error') {
      return
    }
    
    let start = Date.now()
    const end = start + duration
    
    const timer = setInterval(() => {
      const now = Date.now()
      const remaining = end - now
      const percentage = 100 - (remaining / duration) * 100
      
      if (percentage >= 100) {
        clearInterval(timer)
        setProgress(100)
        setIsComplete(true)
        if (onComplete) {
          setTimeout(onComplete, 500)
        }
      } else {
        // Cap progress at 90% until we get confirmation
        setProgress(Math.min(percentage, 90))
      }
    }, 50)
    
    return () => clearInterval(timer)
  }, [duration, onComplete, status])
  
  return (
    <div className="flex flex-col items-center p-8 text-center space-y-6">
      {isComplete ? (
        <>
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h3 className="text-2xl font-semibold text-green-700">{completeMessage}</h3>
        </>
      ) : (
        <>
          <div className="w-full max-w-md">
            <Progress value={progress} className="h-2 w-full" />
          </div>
          <div className="flex flex-col items-center space-y-2">
            <p className="text-lg text-muted-foreground">{message}</p>
            {showSpinner && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Saving...</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
