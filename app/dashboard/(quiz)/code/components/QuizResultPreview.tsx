"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check, X, Send, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/tailwindUtils"

interface QuizResultPreviewProps {
  result: {
    title: string
    score: number
    maxScore: number
    percentage: number
    questions: Array<{
      id: string
      question: string
      userAnswer: string
      correctAnswer: string
      isCorrect: boolean
    }>
    slug: string
  }
  onSubmit: (answers: any[], elapsedTime: number) => void
  onCancel: () => void
  userAnswers: any[]
}

export default function QuizResultPreview({ 
  result, 
  onSubmit, 
  onCancel,
  userAnswers
}: QuizResultPreviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = () => {
    setIsSubmitting(true)
    // Calculate approximate time spent based on number of questions
    const approximateTimePerQuestion = 60 // seconds per question
    const elapsedTime = result.questions.length * approximateTimePerQuestion
    onSubmit(userAnswers, elapsedTime)
  }
  
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Quiz Results Preview</span>
          <span className={cn(
            "text-lg px-3 py-1 rounded-full",
            result.percentage >= 70 
              ? "bg-green-100 text-green-700" 
              : "bg-amber-100 text-amber-700"
          )}>
            {result.score}/{result.maxScore} ({result.percentage}%)
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
            {result.percentage >= 90 ? 
              "Excellent work! You've mastered this topic." :
            result.percentage >= 70 ?
              "Well done! You have a good understanding of the material." :
            result.percentage >= 50 ?
              "You're on the right track, but might need to review some concepts." :
              "You might need to spend more time studying this topic."}
          </p>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Question Summary</h3>
          {result.questions.map((q, i) => (
            <div 
              key={q.id} 
              className={cn(
                "p-4 border rounded-lg",
                q.isCorrect 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              )}
            >
              <div className="flex gap-2">
                <div className="mt-0.5">
                  {q.isCorrect ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Question {i + 1}</p>
                  <p className="text-sm mt-1">{q.question}</p>
                  <div className="mt-2 text-sm">
                    <div className="flex flex-col gap-1">
                      <div>
                        <span className="font-medium">Your answer: </span>
                        <span className={q.isCorrect ? "text-green-600" : "text-red-600"}>
                          {q.userAnswer || "(No answer provided)"}
                        </span>
                      </div>
                      {!q.isCorrect && (
                        <div>
                          <span className="font-medium">Correct answer: </span>
                          <span className="text-green-600">
                            {q.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
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
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go Back</span>
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Submit Results</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
