"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Check,
  Clock,
  HelpCircle,
  CheckCircle2,
  X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { useAppDispatch, useAppSelector } from "@/store"
import { saveAnswer } from "@/store/slices/quizSlice"


interface Option {
  id: string
  text: string
}

interface McqQuizProps {
  question: {
    id: string
    text?: string
    question?: string
    options: (string | Option)[]
  }
  onAnswer: (answer: string) => void
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  feedbackType?: "correct" | "incorrect" | null
}

const McqQuiz = ({
  question,
  onAnswer,
  isSubmitting = false,
  questionNumber = 1,
  totalQuestions = 1,
  existingAnswer,
  feedbackType,
}: McqQuizProps) => {
  // Remove all local state and logic, just render UI and call onAnswer

  if (!question) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-xl border-0 bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-3">Question Unavailable</h3>
          <p className="text-muted-foreground mb-6">
            We’re having trouble loading this question. Please try refreshing.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Prepare options for rendering
  const options = (question?.options || []).map((option, index) => {
    if (typeof option === "string") {
      return { id: option, text: option }
    }
    if (option && typeof option === "object" && option.id && option.text) {
      return option
    }
    return { id: `option_${index}`, text: `Option ${index + 1}` }
  })

  const progressPercentage = (questionNumber / totalQuestions) * 100

  if (!question || (!question.text && !question.question) || !options.length) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-xl border-0 bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-3">Question Unavailable</h3>
          <p className="text-muted-foreground mb-6">
            We’re having trouble loading this question. Please try refreshing.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      data-testid="mcq-quiz"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="shadow-xl border-0 bg-gradient-to-br from-background via-background to-muted/10 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/50 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Question {questionNumber}</CardTitle>
                <CardDescription className="text-sm">of {totalQuestions}</CardDescription>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>

          <div className="mt-4">
            <Progress value={progressPercentage} className="h-3 bg-muted/50" />
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/20 mb-6">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Choose the best answer</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground max-w-3xl mx-auto">
              {question.text || question.question || "Question text unavailable"}
            </h3>
          </motion.div>

          <motion.div
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            role="radiogroup"
            aria-label="Answer options"
          >
            {options.map((option, index) => {
              const isSelected = existingAnswer === option.id
              const isAnswered = !!existingAnswer
              let optionFeedback = ""
              if (isAnswered) {
                if (isSelected && feedbackType === "correct") optionFeedback = "correct"
                else if (isSelected && feedbackType === "incorrect") optionFeedback = "incorrect"
                else optionFeedback = ""
              }
              return (
                <motion.div
                  key={option.id}
                  data-testid={`option-${index}`}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 }
                  }}
                >
                  <div
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                      ${
                        isSelected
                          ? optionFeedback === "correct"
                            ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                            : optionFeedback === "incorrect"
                            ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                            : "border-primary bg-primary/5 shadow-lg"
                          : "border-border bg-card hover:bg-muted/30"
                      }
                      ${isSubmitting || isAnswered ? "opacity-70 pointer-events-none" : ""}
                    `}
                    tabIndex={0}
                    role="radio"
                    aria-checked={isSelected}
                    aria-disabled={isSubmitting || isAnswered}
                    onClick={() => !isSubmitting && !isAnswered && onAnswer(option.id)}
                    onKeyDown={e => {
                      if (
                        !isSubmitting &&
                        !isAnswered &&
                        (e.key === "Enter" || e.key === " ")
                      ) {
                        onAnswer(option.id)
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 ${
                        isSelected
                          ? optionFeedback === "correct"
                            ? "border-green-500 bg-green-500"
                            : optionFeedback === "incorrect"
                            ? "border-red-500 bg-red-500"
                            : "border-primary bg-primary"
                          : "border-muted-foreground/30 bg-background"
                      } flex items-center justify-center`}>
                        {isSelected && (
                          <motion.div
                            className="w-2 h-2 rounded-full bg-white"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          />
                        )}
                      </div>
                      <span className={`text-base font-medium ${
                        isSelected
                          ? optionFeedback === "correct"
                            ? "text-green-700 dark:text-green-400"
                            : optionFeedback === "incorrect"
                            ? "text-red-700 dark:text-red-400"
                            : "text-primary"
                          : "text-foreground"
                      }`}>
                        {option.text}
                      </span>
                      {isSelected && feedbackType === "correct" && (
                        <Check className="ml-2 w-5 h-5 text-green-600" aria-label="Correct" />
                      )}
                      {isSelected && feedbackType === "incorrect" && (
                        <X className="ml-2 w-5 h-5 text-red-600" aria-label="Incorrect" />
                      )}
                    </div>
                    <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
                      ${isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"}
                    `}>
                      {String.fromCharCode(65 + index)}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
          {/* Feedback message */}
          {feedbackType && (
            <div className="flex justify-center mt-4">
              <span
                className={`px-4 py-2 rounded-lg font-semibold text-lg ${
                  feedbackType === "correct"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                }`}
                role="status"
                aria-live="polite"
              >
                {feedbackType === "correct" ? "Correct!" : "Incorrect"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default McqQuiz
