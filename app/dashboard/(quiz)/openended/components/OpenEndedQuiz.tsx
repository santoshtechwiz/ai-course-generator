"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SendIcon, Clock } from "lucide-react"

interface OpenEndedQuizProps {
  question: any
  questionNumber: number
  totalQuestions: number
  isSubmitting: boolean
  isLastQuestion: boolean
  onAnswer: (answer: string, elapsedTime: number, hintsUsed: boolean) => void
}

export function OpenEndedQuiz({
  question,
  questionNumber,
  totalQuestions,
  isSubmitting,
  isLastQuestion,
  onAnswer,
}: OpenEndedQuizProps) {
  const [answer, setAnswer] = useState("")
  const [timeSpent, setTimeSpent] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(false)
  const [hasWordLimitWarning, setHasWordLimitWarning] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  
  // Start the timer when component mounts
  useEffect(() => {
    startTimeRef.current = Date.now()
    
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setTimeSpent(elapsedSeconds)
      }
    }, 1000)
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Handle answer change
  const handleAnswerChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAnswer = e.target.value
    setAnswer(newAnswer)
    
    // Check word count for warning
    const wordCount = newAnswer.trim().split(/\s+/).filter(Boolean).length
    setHasWordLimitWarning(wordCount < 10)
  }, [])
  
  // Handle submission
  const handleSubmit = useCallback(() => {
    if (!answer.trim() || isSubmitting) return
    
    // Calculate final time spent
    const finalTimeSpent = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : timeSpent
    
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Call parent handler with answer and metadata
    onAnswer(answer, finalTimeSpent, hintsUsed)
    
    // Reset for next question
    setAnswer("")
    setTimeSpent(0)
    setHintsUsed(false)
    startTimeRef.current = Date.now()
  }, [answer, isSubmitting, timeSpent, hintsUsed, onAnswer])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      data-testid="openended-quiz"
    >
      <Card className="w-full max-w-4xl mx-auto shadow-lg border-t-4 border-primary">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <motion.div
                className="flex items-center gap-1 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="font-medium text-foreground">Question {questionNumber}</span>
                <span className="text-muted-foreground">of {totalQuestions}</span>
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTime(timeSpent)}</span>
              </Badge>
            </div>
          </div>
          <motion.h2
            className="text-2xl font-bold leading-tight text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {question.question || question.text}
          </motion.h2>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            value={answer}
            onChange={handleAnswerChange}
            placeholder="Type your answer here..."
            className="min-h-[150px] resize-none transition-all duration-200 focus:min-h-[200px] focus:ring-2 focus:ring-primary"
          />

          {/* Keywords/hints section */}
          {question.keywords && question.keywords.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Keywords to consider:</p>
              <div className="flex flex-wrap gap-2">
                {question.keywords.map((hint: string, index: number) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs"
                    onClick={() => setHintsUsed(true)}
                  >
                    {hint}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Word count warning */}
          {hasWordLimitWarning && answer.trim() && (
            <p className="text-sm text-amber-500">
              Consider providing a more detailed answer (at least 10 words recommended).
            </p>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitting}
            className="w-full sm:w-auto ml-auto bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                {isLastQuestion ? "Finishing Quiz..." : "Submitting..."}
              </>
            ) : (
              <>
                <SendIcon className="w-4 h-4 mr-2" />
                {isLastQuestion ? "Finish Quiz" : "Submit Answer"}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default OpenEndedQuiz
