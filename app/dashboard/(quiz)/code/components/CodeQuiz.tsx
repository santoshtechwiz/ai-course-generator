"use client"

import { useState, useCallback, memo, useMemo } from "react"
import { motion } from "framer-motion"
import { useAppDispatch } from "@/store"
import { saveAnswer } from "@/store/slices/quiz-slice"
import type { CodeQuestion } from "./types"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

import CodeQuizOptions from "./CodeQuizOptions"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { Code2, Terminal, Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
  quizTitle?: string
  quizSubtitle?: string
  difficulty?: string
  category?: string
  timeLimit?: number
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
  quizTitle = "Code Challenge",
  quizSubtitle = "Analyze the code and choose the correct answer",
  difficulty = "Medium",
  category = "Programming",
  timeLimit,
}: CodeQuizProps) => {
  const dispatch = useAppDispatch()
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(existingAnswer || null)
  const [copied, setCopied] = useState(false)
  const [isAnswering, setIsAnswering] = useState(false)

  const options = useMemo(
    () =>
      question.options?.map((option) => {
        const optionVariations = [
          option,
          ...(question.language === "javascript"
            ? [
                option.replace(/function/g, "method"),
                option.replace(/variable/g, "identifier"),
                option.replace(/returns/g, "outputs"),
              ]
            : []),
          ...(question.language === "python"
            ? [
                option.replace(/function/g, "def"),
                option.replace(/print/g, "output"),
                option.replace(/list/g, "array"),
              ]
            : []),
        ]
        return {
          id: option,
          text: optionVariations[0],
        }
      }) || [],
    [question.options, question.language]
  )

  const handleOptionSelect = useCallback(
    async (optionId: string) => {
      if (isAnswering || isSubmitting) return

      setIsAnswering(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 150))

        const selected = options.find((o) => o.id === optionId)
        if (selected) {
          setSelectedAnswer(selected.text)
          dispatch(saveAnswer({ questionId: String(question.id), userAnswer: selected.text }))
          onAnswer(selected.text)
        }
      } catch (error) {
        console.error("Failed to select answer:", error)
      } finally {
        setIsAnswering(false)
      }
    },
    [isAnswering, isSubmitting, options, onAnswer, dispatch, question.id]
  )

  const handleCopyCode = useCallback(async () => {
    if (question.codeSnippet) {
      try {
        await navigator.clipboard.writeText(question.codeSnippet)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy code:", err)
      }
    }
  }, [question.codeSnippet])

  const progressPercentage = Math.round((questionNumber / totalQuestions) * 100)
  const hasAnswer = !!selectedAnswer

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      quizType="code"
      animationKey={question.id}
      quizTitle={quizTitle}
      quizSubtitle={quizSubtitle}
      difficulty={difficulty.toLowerCase()}
      category={category}
      timeLimit={timeLimit}
    >
      <div className="space-y-6">
        <motion.div
          className="text-center space-y-4 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h2
            className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-relaxed max-w-4xl mx-auto px-4 break-words"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              wordWrap: "break-word",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              hyphens: "auto",
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

        {question.codeSnippet && (
          <motion.div
            className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-lg border border-border/30 group"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{
              scale: 1.005,
              transition: { duration: 0.2 },
            }}
          >
            <motion.div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <motion.div
                    className="w-3 h-3 rounded-full bg-red-500/80"
                    whileHover={{ scale: 1.1, backgroundColor: "#ef4444" }}
                  />
                  <motion.div
                    className="w-3 h-3 rounded-full bg-yellow-500/80"
                    whileHover={{ scale: 1.1, backgroundColor: "#eab308" }}
                  />
                  <motion.div
                    className="w-3 h-3 rounded-full bg-green-500/80"
                    whileHover={{ scale: 1.1, backgroundColor: "#22c55e" }}
                  />
                </div>

                <motion.div
                  className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-lg backdrop-blur-sm"
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(51, 65, 85, 0.7)" }}
                >
                  <Terminal className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-slate-300 text-xs font-mono font-medium">
                    {question.language || "javascript"}
                  </span>
                </motion.div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30 font-semibold text-xs"
                >
                  <Code2 className="w-3 h-3 mr-1" />
                  {(question.language || "javascript").toUpperCase()}
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                >
                  <motion.div
                    key={copied ? "check" : "copy"}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </motion.div>
                </Button>
              </div>
            </motion.div>

            <motion.div className="relative overflow-hidden">
              <SyntaxHighlighter
                language={question.language || "javascript"}
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  borderRadius: "0",
                  fontSize: "0.875rem",
                  padding: "1.5rem",
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  lineHeight: "1.6",
                }}
                lineNumberStyle={{
                  color: "#64748b",
                  paddingRight: "1rem",
                  userSelect: "none",
                  fontSize: "0.75rem",
                }}
              >
                {question.codeSnippet}
              </SyntaxHighlighter>

              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          </motion.div>
        )}

        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <CodeQuizOptions
            options={options.map((o) => o.text)}
            selectedOption={selectedAnswer}
            onSelect={handleOptionSelect}
            disabled={isSubmitting}
            correctAnswer={question.correctAnswer}
            showCorrectAnswer={false}
          />
        </motion.div>

        {showNavigation && (
          <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <QuizFooter
              onNext={onNext}
              onSubmit={onSubmit}
              onRetake={onRetake}
              canGoNext={canGoNext && hasAnswer}
              canGoPrevious={canGoPrevious}
              isLastQuestion={isLastQuestion}
              showRetake={showRetake}
              isSubmitting={isSubmitting}
              hasAnswer={hasAnswer}
            />
          </motion.div>
        )}
      </div>
    </QuizContainer>
  )
}

export default memo(CodeQuiz)
