"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAppDispatch } from "@/store"
import { saveAnswer } from "@/store/slices/quiz-slice"
import type { CodeQuestion } from "./types"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import CodeQuizOptions from "./CodeQuizOptions"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { Code2, Terminal } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(existingAnswer || null)

  const handleAnswerSelection = (option: string) => {
    if (isSubmitting) return

    // Simple validation for plain array of options
    if (!Array.isArray(question.options)) return
    if (!question.options.includes(option)) return

    setSelectedAnswer(option)
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

  const progressPercentage = Math.round((questionNumber / totalQuestions) * 100)
  const hasAnswer = !!selectedAnswer

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      progressPercentage={progressPercentage}
      quizType="Code Challenge"
      animationKey={question.id}
    >
      <div className="space-y-6">
        {/* Question Header */}
        <motion.div
          className="text-center space-y-4 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h2
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-relaxed px-4 break-words whitespace-normal hyphens-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              wordWrap: "break-word",
              overflowWrap: "break-word",
              wordBreak: "break-word",
            }}
          >
            {question.text || question.question}
          </motion.h2>

          <motion.div
            className="h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full mx-auto max-w-32"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          />
        </motion.div>

        {/* Code Block */}
        {question.codeSnippet && (
          <motion.div
            className="rounded-3xl overflow-hidden shadow-2xl border border-border/30 group"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{
              scale: 1.01,
              transition: { duration: 0.2 },
            }}
          >
            {/* Code Header */}
            <motion.div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                {/* Terminal Dots */}
                <div className="flex gap-2">
                  <motion.div className="w-3 h-3 rounded-full bg-red-500" whileHover={{ scale: 1.1 }} />
                  <motion.div className="w-3 h-3 rounded-full bg-yellow-500" whileHover={{ scale: 1.1 }} />
                  <motion.div className="w-3 h-3 rounded-full bg-green-500" whileHover={{ scale: 1.1 }} />
                </div>

                {/* Language Badge */}
                <motion.div
                  className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-full"
                  whileHover={{ scale: 1.02 }}
                >
                  <Terminal className="w-4 h-4 text-slate-300" />
                  <span className="text-slate-300 text-sm font-mono font-medium">
                    {question.language || "javascript"}
                  </span>
                </motion.div>
              </div>

              {/* Language Badge with Glow */}
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30 font-semibold text-xs"
              >
                <Code2 className="w-3 h-3 mr-1" />
                {(question.language || "javascript").toUpperCase()}
              </Badge>
            </motion.div>

            {/* Code Content */}
            <motion.div className="relative overflow-hidden">
              <SyntaxHighlighter
                language={question.language || "javascript"}
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  borderRadius: "0",
                  fontSize: "0.9rem",
                  padding: "1.25rem",
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

              {/* Code overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          </motion.div>
        )}

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <CodeQuizOptions
            options={question.options}
            selectedOption={selectedAnswer}
            onSelect={handleAnswerSelection}
            disabled={isSubmitting}
          />
        </motion.div>

        {/* Footer */}
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
            hasAnswer={hasAnswer}
          />
        )}
      </div>
    </QuizContainer>
  )
}

export default CodeQuiz
