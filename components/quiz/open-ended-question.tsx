"use client"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OpenEndedQuestionProps {
  question: string
  answer: string
  onChange: (value: string) => void
  onCheck?: () => void
  feedback?: {
    score?: number
    explanation?: string
  }
  className?: string
  placeholder?: string
  minLength?: number
  showWordCount?: boolean
  isCheckingAnswer?: boolean
}

export const OpenEndedQuestion = ({
  question,
  answer,
  onChange,
  onCheck,
  feedback,
  className,
  placeholder = "Type your answer here...",
  minLength = 0,
  showWordCount = true,
  isCheckingAnswer = false,
}: OpenEndedQuestionProps) => {
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0
  const hasMinLength = wordCount >= minLength

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-lg font-medium text-gray-900 dark:text-white">{question}</div>

      <Textarea
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[150px] resize-y"
      />

      <div className="flex items-center justify-between">
        {showWordCount && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {wordCount} {wordCount === 1 ? "word" : "words"}
            {minLength > 0 && <span className={!hasMinLength ? "text-amber-500" : ""}> (minimum: {minLength})</span>}
          </div>
        )}

        {onCheck && (
          <Button onClick={onCheck} disabled={!hasMinLength || !answer.trim() || isCheckingAnswer} size="sm">
            {isCheckingAnswer ? "Checking..." : "Check Answer"}
          </Button>
        )}
      </div>

      {feedback && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          {typeof feedback.score === "number" && (
            <div className="flex items-center mb-2">
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-300 mr-2">Score:</span>
              <span className="text-sm text-blue-700 dark:text-blue-200">{feedback.score}/10</span>
            </div>
          )}

          {feedback.explanation && (
            <div>
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Feedback</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200">{feedback.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

