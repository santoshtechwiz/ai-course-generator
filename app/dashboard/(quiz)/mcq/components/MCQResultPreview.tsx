"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle, XCircle, Send } from "lucide-react"
import { cn } from "@/lib/tailwindUtils"
import { UserAnswer } from "./types"

interface QuestionResult {
  id: string
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
}

interface MCQResultPreviewProps {
  result: {
    title: string
    score: number
    maxScore: number
    percentage: number
    questions: QuestionResult[]
    slug: string
  }
  onSubmit: (answers: UserAnswer[], elapsedTime: number) => void
  onCancel: () => void
  userAnswers: UserAnswer[]
}

export default function MCQResultPreview({ 
  result, 
  onSubmit, 
  onCancel,
  userAnswers
}: MCQResultPreviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = () => {
    setIsSubmitting(true)
    // Calculate approximate time spent based on number of questions
    const approximateTimePerQuestion = 30 // seconds per question
    const elapsedTime = result.questions.length * approximateTimePerQuestion
    
    // Make sure we preserve the original question ID format (string or number)
    const processedAnswers = userAnswers.map(answer => ({
      ...answer,
      // Ensure questionId maintains its original format (don't convert to string)
      questionId: answer.questionId
    }));
    
    onSubmit(processedAnswers, elapsedTime)
  }
  
  return (
    <Card className="max-w-3xl mx-auto" data-testid="mcq-quiz-result-preview">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Quiz Results Preview</span>
          <span className={cn(
            "text-lg px-3 py-1 rounded-full",
            result.percentage >= 70 
              ? "bg-green-100 text-green-700" 
              : "bg-amber-100 text-amber-700"
          )}>
            {result.score} / {result.maxScore} ({result.percentage}%)
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Your performance</h3>
          <Progress 
            value={result.percentage} 
            className="h-2"
          />
          
          <p className="mt-3 text-sm text-muted-foreground">
            You answered {result.score} out of {result.maxScore} questions correctly.
          </p>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Question Summary</h3>
          {result.questions.map((q, index) => (
            <div key={q.id} className="p-3 border rounded-md">
              <div className="flex gap-3">
                {q.isCorrect ? (
                  <CheckCircle className="text-green-500 h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="text-red-500 h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium mb-2">Q{index + 1}: {q.question}</p>
                  <p className="text-sm text-muted-foreground">
                    Your answer: <span className={q.isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {q.userAnswer}
                    </span>
                  </p>
                  {!q.isCorrect && (
                    <p className="text-sm text-green-600">
                      Correct answer: {q.correctAnswer}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between space-x-4 border-t pt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-2"
          data-testid="cancel-submit"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Quiz
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2"
          data-testid="submit-results"
        >
          {isSubmitting ? (
            <>Submitting...</>
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" />
              Submit Results
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
