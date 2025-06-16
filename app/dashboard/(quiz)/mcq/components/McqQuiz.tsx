"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { cn } from "@/lib/utils"

interface McqQuizProps {
  question: {
    id: string
    text?: string
    question?: string
    options: string[]
  }
  onAnswer: (answer: string) => void
  onNext?: () => void
  onSubmit?: () => void
  onRetake?: () => void
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  canGoNext?: boolean
  isLastQuestion?: boolean
  showRetake?: boolean
}

const McqQuiz = ({
  question,
  onAnswer,
  onNext,
  onSubmit,
  onRetake,
  isSubmitting = false,
  questionNumber = 1,
  totalQuestions = 1,
  existingAnswer,
  canGoNext = false,
  isLastQuestion = false,
  showRetake = false,
}: McqQuizProps) => {
  // Calculate progress percentage
  const progressPercentage = Math.round((questionNumber / totalQuestions) * 100)

  // Ensure options are properly formatted dynamically
  const options = useMemo(() => {
    return (question?.options || []).map((option) => ({
      id: option,
      text: option,
    }))
  }, [question?.options])

  // Animation variants
  const optionsVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const optionVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  const questionText = question.text || question.question || "Question not available"

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      progressPercentage={progressPercentage}
      quizType="mcq"
      animationKey={question.id}
    >
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-foreground mb-4 leading-relaxed">{questionText}</h3>
          <motion.div
            className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full mx-auto max-w-lg"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          />
        </motion.div>

        <RadioGroup value={existingAnswer} onValueChange={onAnswer} className="space-y-4 pt-6">
          <motion.div variants={optionsVariants} initial="hidden" animate="show" className="space-y-4">
            {options.map((option, index) => (
              <motion.div
                key={option.id}
                variants={optionVariants}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className={cn(
                    "flex items-start space-x-4 rounded-2xl border-2 p-6 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                    "hover:bg-gradient-to-r hover:from-muted/30 hover:to-muted/10 hover:border-primary/40 hover:shadow-lg",
                    existingAnswer === option.id &&
                      "border-primary bg-gradient-to-r from-primary/10 to-primary/5 shadow-lg ring-2 ring-primary/20",
                  )}
                  onClick={() => onAnswer(option.id)}
                  whileHover={{
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  {/* Animated background gradient on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  />

                  <RadioGroupItem
                    value={option.id}
                    id={`option-${option.id}`}
                    disabled={isSubmitting}
                    className={cn(
                      "transition-all duration-300 mt-1 relative z-10",
                      existingAnswer === option.id
                        ? "text-primary border-primary shadow-md"
                        : "group-hover:border-primary/60 group-hover:shadow-sm",
                    )}
                  />

                  <Label
                    htmlFor={`option-${option.id}`}
                    className={cn(
                      "flex-1 cursor-pointer text-lg font-medium leading-relaxed transition-all duration-300 relative z-10",
                      existingAnswer === option.id && "text-primary font-semibold",
                      "group-hover:text-foreground",
                    )}
                  >
                    <motion.span
                      initial={false}
                      animate={existingAnswer === option.id ? { x: 4 } : { x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      {option.text}
                    </motion.span>
                  </Label>

                  {/* Selection indicator */}
                  <AnimatePresence>
                    {existingAnswer === option.id && (
                      <motion.div
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </RadioGroup>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <QuizFooter
          onNext={onNext}
          onPrevious={undefined}
          onSubmit={isLastQuestion ? onSubmit : undefined}
          onRetake={onRetake}
          canGoNext={!!existingAnswer && canGoNext}
          canGoPrevious={false}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          showRetake={showRetake}
          className="mt-8"
        />
      </motion.div>
    </QuizContainer>
  )
}

export default McqQuiz
