"use client"

import { motion } from "framer-motion"
import { useAppDispatch } from "@/store"
import { saveAnswer } from "@/store/slices/quiz-slice"
import type { CodeQuestion } from "./types"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import CodeQuizOptions from "./CodeQuizOptions"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { Code2 } from "lucide-react"

interface CodeQuizProps {
  question: CodeQuestion
  onAnswer: (answer: string) => void
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  onNext?: () => void
  onSubmit?: () => void
  onRetake?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  showNavigation?: boolean
  showRetake?: boolean
}

const CodeQuiz = ({
  question,
  onAnswer,
  isSubmitting = false,
  questionNumber = 1,
  totalQuestions = 1,
  existingAnswer,
  onNext,
  onSubmit,
  onRetake,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  showNavigation = true,
  showRetake = false,
}: CodeQuizProps) => {
  const dispatch = useAppDispatch()

  const handleAnswerSelection = (option: string) => {
    if (isSubmitting) return

    // Simple validation for plain array of options
    if (!Array.isArray(question.options)) return
    if (!question.options.includes(option)) return

    onAnswer(option)

    try {
      dispatch(
        saveAnswer({
          questionId: String(question.id),
          answer: {
            questionId: question.id,
            selectedOptionId: option,
            timestamp: Date.now(),
            type: "code",
          },
        }),
      )
    } catch (error) {
      console.error("Redux dispatch failed:", error)
    }
  }

  const hasAnswer = !!existingAnswer

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      quizType="Code"
      animationKey={question.id}
    >
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Enhanced Question Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent leading-relaxed">
            {question.text || question.question}
          </h3>
          <motion.div
            className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full mx-auto max-w-md"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          />
        </motion.div>

        {/* Enhanced Code Block */}
        {question.codeSnippet && (
          <motion.div
            className="rounded-3xl overflow-hidden shadow-2xl border-2 border-muted/30 group"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{
              scale: 1.01,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              transition: { duration: 0.3 },
            }}
          >
            {/* Enhanced Code Header */}
            <motion.div
              className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-4 flex items-center justify-between border-b border-slate-700"
              whileHover={{
                background: "linear-gradient(90deg, rgb(30 41 59), rgb(15 23 42), rgb(30 41 59))",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <motion.div
                    className="w-3 h-3 rounded-full bg-red-500"
                    whileHover={{ scale: 1.2, boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)" }}
                  />
                  <motion.div
                    className="w-3 h-3 rounded-full bg-yellow-500"
                    whileHover={{ scale: 1.2, boxShadow: "0 0 8px rgba(234, 179, 8, 0.6)" }}
                  />
                  <motion.div
                    className="w-3 h-3 rounded-full bg-green-500"
                    whileHover={{ scale: 1.2, boxShadow: "0 0 8px rgba(34, 197, 94, 0.6)" }}
                  />
                </div>
                <motion.div
                  className="flex items-center gap-2 bg-slate-700/50 px-3 py-1 rounded-full"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(51, 65, 85, 0.7)" }}
                >
                  <Code2 className="w-4 h-4 text-slate-300" />
                  <span className="text-slate-300 text-sm font-mono font-medium">
                    {question.language || "javascript"}
                  </span>
                </motion.div>
              </div>

              {/* Language Badge with Glow */}
              <motion.div
                className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/30"
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(var(--primary), 0)",
                    "0 0 0 4px rgba(var(--primary), 0.1)",
                    "0 0 0 0 rgba(var(--primary), 0)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                {(question.language || "javascript").toUpperCase()}
              </motion.div>
            </motion.div>

            {/* Code Content with Glow Effect */}
            <motion.div
              className="relative"
              whileHover={{
                boxShadow: "inset 0 0 20px rgba(var(--primary), 0.1)",
              }}
            >
              <SyntaxHighlighter
                language={question.language || "javascript"}
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  borderRadius: "0",
                  fontSize: "0.95rem",
                  padding: "2rem",
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                }}
                lineNumberStyle={{
                  color: "#64748b",
                  paddingRight: "1rem",
                  userSelect: "none",
                }}
              >
                {question.codeSnippet}
              </SyntaxHighlighter>

              {/* Subtle overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          </motion.div>
        )}

        {/* Enhanced Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <CodeQuizOptions
            options={question.options}
            selectedOption={existingAnswer ?? null}
            onSelect={handleAnswerSelection}
            disabled={isSubmitting}
          />
        </motion.div>
      </motion.div>

      {/* Enhanced Footer */}
      {showNavigation && (
        <QuizFooter
          onNext={onNext}
          onPrevious={canGoPrevious ? () => {} : undefined}
          onSubmit={onSubmit}
          onRetake={onRetake}
          canGoNext={hasAnswer && canGoNext}
          canGoPrevious={canGoPrevious}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          showRetake={showRetake}
          className="mt-8"
        />
      )}
    </QuizContainer>
  )
}

export default CodeQuiz
