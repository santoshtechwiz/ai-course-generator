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
  HelpCircle,
  Clock
} from "lucide-react"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { useMemo } from "react"

interface McqQuizProps {
  question: {
    id: string
    text?: string
    question?: string
    options: string[] // Simplified options structure
  }
  onAnswer: (answer: string) => void
  onNext?: () => void // Add onNext prop for navigation
  onSubmit?: () => void // Add onSubmit prop for quiz submission
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  canGoNext?: boolean // Add canGoNext prop to control Next button visibility
  isLastQuestion?: boolean // Add isLastQuestion prop to control Submit button visibility
}

const McqQuiz = ({
  question,
  onAnswer,
  onNext, // Accept onNext prop
  onSubmit, // Accept onSubmit prop
  isSubmitting = false,
  questionNumber = 1,
  totalQuestions = 1,
  existingAnswer,
  canGoNext = false, // Default to false
  isLastQuestion = false, // Default to false
}: McqQuizProps) => {
  // Calculate progress percentage
  const progressPercentage = Math.round((questionNumber / totalQuestions) * 100)

  // Ensure options are properly formatted dynamically
  const options = useMemo(() => {
    return (question?.options || []).map((option, index) => ({
      id: option,
      text: option,
    }))
  }, [question?.options])

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
                <CardTitle className="text-xl font-bold text-foreground">Question {questionNumber}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">of {totalQuestions}</CardDescription>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{progressPercentage}%</div>
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
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            role="radiogroup"
            aria-label="Answer options"
          >
            {options.map((option, index) => {
              const isSelected = existingAnswer === option.id
              const isAnswered = !!existingAnswer
              return (
                <motion.div
                  key={option.id}
                  data-testid={`option-${index}`}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 },
                  }}
                >
                  <div
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-border bg-card hover:bg-muted/30"
                    } ${isSubmitting || isAnswered ? "opacity-70 pointer-events-none" : ""}`}
                    tabIndex={0}
                    role="radio"
                    aria-checked={isSelected}
                    aria-disabled={isSubmitting || isAnswered}
                    onClick={() => !isSubmitting && !isAnswered && onAnswer(option.id)}
                    onKeyDown={(e) => {
                      if (!isSubmitting && !isAnswered && (e.key === "Enter" || e.key === " ")) {
                        onAnswer(option.id)
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30 bg-background"
                        } flex items-center justify-center`}
                      >
                        {isSelected && (
                          <motion.div
                            className="w-2 h-2 rounded-full bg-white"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          />
                        )}
                      </div>
                      <span
                        className={`text-base font-medium ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {option.text}
                      </span>
                    </div>
                    <div
                      className={`absolute -top-2 -left-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
          {/* Add Next and Submit buttons */}
          <div className="flex justify-end mt-4 gap-4">
            {canGoNext && !isLastQuestion && (
              <Button
                onClick={onNext}
                className="bg-primary text-white rounded-lg px-6 py-2 shadow-md"
              >
                Next
              </Button>
            )}
            {isLastQuestion && (
              <Button
                onClick={onSubmit}
                className="bg-green-600 text-white rounded-lg px-6 py-2 shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default McqQuiz
