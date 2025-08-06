"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, BarChart3 } from "lucide-react"
import type { UserQuizAttempt } from "@/app/types/types"

interface QuizResultsDialogProps {
  attempt: UserQuizAttempt
  open: boolean
  onClose: () => void
}

export default function QuizResultsDialog({ attempt, open, onClose }: QuizResultsDialogProps) {
  const questions = attempt.attemptQuestions || []
  
  // Debug logging
  console.log('QuizResultsDialog: attempt:', attempt)
  console.log('QuizResultsDialog: attemptQuestions:', attempt.attemptQuestions)
  console.log('QuizResultsDialog: questions length:', questions.length)
  
  // Helper function to format user answers
  const formatUserAnswer = (userAnswer: any): string => {
    if (!userAnswer) return 'No answer'
    
    if (typeof userAnswer === 'string') {
      // Check if it's a stringified object
      if (userAnswer === '[object Object]') {
        return 'Complex answer (object)'
      }
      return userAnswer
    }
    
    if (typeof userAnswer === 'object') {
      if (Array.isArray(userAnswer)) {
        return userAnswer.join(', ')
      }
      
      // Try to extract meaningful values from object
      if (userAnswer.value !== undefined) {
        return String(userAnswer.value)
      }
      if (userAnswer.text !== undefined) {
        return String(userAnswer.text)
      }
      if (userAnswer.answer !== undefined) {
        return String(userAnswer.answer)
      }
      
      // Fall back to JSON representation, but limit length
      const jsonStr = JSON.stringify(userAnswer)
      return jsonStr.length > 100 ? jsonStr.substring(0, 100) + '...' : jsonStr
    }
    
    return String(userAnswer)
  }
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Quiz Results: {attempt.userQuiz?.title}</DialogTitle>
          <DialogDescription>
            Completed on {new Date(attempt.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-xl font-bold">{attempt.score || 0}%</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="text-xl font-bold">{attempt.accuracy || 0}%</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time Spent</p>
              <p className="text-xl font-bold">{attempt.timeSpent}s</p>
            </div>
          </div>
        </div>

        {/* Questions Summary */}
        <ScrollArea className="flex-1 w-full max-h-[50vh] overflow-auto">
          <div className="space-y-4 p-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Question Results</h3>
              <span className="text-sm text-muted-foreground">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </span>
            </div>
            {questions.map((question, index) => (
              <Card key={question.id || index} className="border mt-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">Question {index + 1}</p>
                        <p className="text-sm text-muted-foreground">
                          Time spent: {question.timeSpent}s
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {question.userAnswer && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Answer: </span>
                          <span className="font-medium">
                            {formatUserAnswer(question.userAnswer)}
                          </span>
                        </div>
                      )}
                      <div className="flex-shrink-0">
                        {question.isCorrect ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Correct
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <XCircle className="h-3 w-3 mr-1" />
                            Incorrect
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {questions.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No question details available for this attempt.</p>
                  <div className="mt-4 text-xs">
                    <p>Attempt ID: {attempt.id}</p>
                    <p>Quiz ID: {attempt.userQuiz?.id}</p>
                    <p>Debug: attemptQuestions = {JSON.stringify(attempt.attemptQuestions, null, 2)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}