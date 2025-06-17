"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { cn } from "@/lib/utils"
import { PenTool, Lightbulb, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BlanksQuestion {
  id: string | number
  question?: string
  text?: string
  answer?: string
  hint?: string
  keywords?: string[]
}

interface BlanksQuizProps {
  question: BlanksQuestion
  onAnswer: (answer: string) => boolean
  onNext?: () => void
  onPrevious?: () => void
  onSubmit?: () => void
  onRetake?: () => void
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  isSubmitting?: boolean
  showRetake?: boolean
}

const BlanksQuiz = ({
  question,
  onAnswer,
  onNext,
  onPrevious,
  onSubmit,
  onRetake,
  questionNumber = 1,
  totalQuestions = 1,
  existingAnswer = "",
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  isSubmitting = false,
  showRetake = false,
}: BlanksQuizProps) => {
  const [answer, setAnswer] = useState(existingAnswer)
  const [showHint, setShowHint] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    setAnswer(existingAnswer)
  }, [existingAnswer])

  const handleAnswerChange = (value: string) => {
    setAnswer(value)
    setHasInteracted(true)
    onAnswer(value)
  }

  const questionText = question.question || question.text || "Fill in the blank"
  const progressPercentage = Math.round((questionNumber / totalQuestions) * 100)
  const hasAnswer = answer.trim().length > 0

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      progressPercentage={progressPercentage}
      quizType="Fill in the Blanks"
      animationKey={question.id}
    >
      <div className="space-y-8">
        {/* Question Header */}
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-foreground leading-tight px-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {questionText}
          </motion.h2>

          <motion.div
            className="h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full mx-auto max-w-32"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          />
        </motion.div>

        {/* Answer Input Section */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Input Field */}
          <div className="relative">
            <motion.div
              className={cn(
                "relative overflow-hidden rounded-2xl border-2 transition-all duration-300",
                hasAnswer
                  ? "border-primary bg-gradient-to-r from-primary/5 to-primary/2 shadow-lg shadow-primary/10"
                  : "border-border/50 bg-gradient-to-r from-card/80 to-card/40 hover:border-primary/30 focus-within:border-primary/50",
              )}
              whileHover={{ scale: 1.01 }}
              whileFocus={{ scale: 1.01 }}
            >
              {/* Input Icon */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <PenTool className="w-5 h-5" />
              </div>

              <Input
                type="text"
                value={answer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here..."
                className="pl-12 pr-16 py-6 text-lg font-medium border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                disabled={isSubmitting}
              />

              {/* Answer Status Indicator */}
              <AnimatePresence>
                {hasAnswer && (
                  <motion.div
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary"
                    initial={{ scale: 0, opacity: 0, rotate: -180 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, rotate: 180 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                  ease: "linear",
                }}
                style={{
                  transform: "translateX(-100%)",
                }}
              />
            </motion.div>

            {/* Character Counter */}
            <AnimatePresence>
              {hasInteracted && (
                <motion.div
                  className="absolute -bottom-6 right-0 text-xs text-muted-foreground"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {answer.length} characters
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hint Section */}
          {question.hint && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(!showHint)}
                className="group text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl px-4 py-2 transition-all duration-200"
              >
                <Lightbulb className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                {showHint ? "Hide Hint" : "Show Hint"}
              </Button>

              <AnimatePresence>
                {showHint && (
                  <motion.div
                    className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4"
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800 mb-1">Hint</p>
                        <p className="text-sm text-amber-700">{question.hint}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Keywords Helper */}
          {question.keywords && question.keywords.length > 0 && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <p className="text-sm font-medium text-muted-foreground">Keywords to consider:</p>
              <div className="flex flex-wrap gap-2">
                {question.keywords.map((keyword, index) => (
                  <motion.span
                    key={keyword}
                    className="px-3 py-1 bg-gradient-to-r from-muted/80 to-muted/60 text-muted-foreground text-xs font-medium rounded-full border border-border/50"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.6 + index * 0.1,
                      duration: 0.3,
                      type: "spring",
                      stiffness: 300,
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {keyword}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <QuizFooter
          onNext={onNext}
          onPrevious={canGoPrevious ? onPrevious : undefined}
          onSubmit={isLastQuestion ? onSubmit : undefined}
          onRetake={onRetake}
          canGoNext={hasAnswer && canGoNext}
          canGoPrevious={canGoPrevious}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          showRetake={showRetake}
          hasAnswer={hasAnswer}
        />
      </div>
    </QuizContainer>
  )
}

export default BlanksQuiz
