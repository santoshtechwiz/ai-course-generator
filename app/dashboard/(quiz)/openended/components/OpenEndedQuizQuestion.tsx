"use client"

import { useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SendIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { OpenEndedQuestion } from "@/types/quiz"
import { selectQuizStatus, saveAnswer, selectAnswerForQuestion } from "@/store/slices/quizSlice"


interface QuizQuestionProps {
  question: OpenEndedQuestion
  questionNumber: number
  totalQuestions: number
  isLastQuestion: boolean
  onAnswer: (answer: string, elapsedTime: number, hintsUsed: boolean) => void
}

export function OpenEndedQuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  onAnswer,
}: QuizQuestionProps) {
  const dispatch = useAppDispatch()

  // Get current answer from Redux store
  const currentAnswer = useAppSelector((state) => selectAnswerForQuestion(state, question.id))
  const quizStatus = useAppSelector(selectQuizStatus)

  // Parse hints from question data
  const hints = useMemo(() => {
    if (!question?.keywords) return []
    return Array.isArray(question.keywords) ? question.keywords : []
  }, [question?.keywords])

  const isSubmitting = quizStatus === "submitting"
  const answerText = currentAnswer ? (currentAnswer as any).text || "" : ""

  const handleAnswerChange = useCallback(
    (newAnswer: string) => {
      // Save answer to Redux immediately on change
      dispatch(
        saveAnswer({
          questionId: question.id,
          answer: {
            questionId: question.id,
            text: newAnswer,
            timestamp: Date.now(),
          } as any,
        }),
      )
    },
    [dispatch, question.id],
  )

  const handleSubmitAnswer = useCallback(() => {
    if (!answerText.trim() || isSubmitting) return

    // Call parent handler with current answer
    onAnswer(answerText, 0, false) // Timer and hints managed elsewhere
  }, [answerText, isSubmitting, onAnswer])

  const getDifficultyColor = (difficulty = "medium") => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "hard":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      data-testid="openended-quiz-question"
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
                <ChevronRightIcon className="h-4 w-4" />
                <span>{totalQuestions}</span>
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn("text-white", getDifficultyColor("medium"))}>
                Medium
              </Badge>
            </div>
          </div>
          <motion.h2
            className="text-2xl font-bold leading-tight text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            data-testid="question-text"
          >
            {question.text}
          </motion.h2>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            value={answerText}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[150px] resize-none transition-all duration-200 focus:min-h-[200px] focus:ring-2 focus:ring-primary"
            data-testid="answer-textarea"
          />

          {hints.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Keywords to consider:</p>
              <div className="flex flex-wrap gap-2">
                {hints.map((hint, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {hint}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleSubmitAnswer}
            disabled={!answerText.trim() || isSubmitting}
            className="w-full sm:w-auto ml-auto bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="submit-button"
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

export default OpenEndedQuizQuestion
