"use client"

import { useState, useCallback, memo, useMemo } from "react"
import { motion } from "framer-motion"
import { useAppDispatch } from "@/store"
import { saveAnswer } from "@/store/slices/quiz/quiz-slice"
import type { CodeQuestion } from "./types"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

import CodeQuizOptions from "./CodeQuizOptions"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { Code2, Terminal, Copy, Check, Play, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

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

// Enhanced animation variants
const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 250,
      damping: 25,
    },
  },
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
            ? [option.replace(/function/g, "def"), option.replace(/print/g, "output"), option.replace(/list/g, "array")]
            : []),
        ]
        return {
          id: option,
          text: optionVariations[0],
        }
      }) || [],
    [question.options, question.language],
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
    [isAnswering, isSubmitting, options, onAnswer, dispatch, question.id],
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

  const hasAnswer = !!selectedAnswer
  const language = question.language && question.language.trim() !== "" ? question.language : "JavaScript"

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      quizType="code"
      animationKey={`code-${question.id}`}
      difficulty={difficulty?.toLowerCase() as "easy" | "medium" | "hard"}
    >
      <div className="space-y-6">
        {/* Question Section */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <div className="text-center space-y-4 mb-6">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              >
                Code Analysis
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-relaxed break-words max-w-4xl mx-auto">
              {question.text || question.question}
            </h2>
          </div>
        </motion.div>

        {/* Code Display Section */}
        {question.codeSnippet && (
          <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Card className="overflow-hidden shadow-xl border-2 border-border/30 group">
              <motion.div
                className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700/50"
                whileHover={{ backgroundColor: "rgba(51, 65, 85, 0.9)" }}
                transition={{ duration: 0.2 }}
              >
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
                    <span className="text-slate-300 text-xs font-mono font-medium">{language}</span>
                  </motion.div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-300 border-green-500/30 font-semibold text-xs"
                  >
                    <Code2 className="w-3 h-3 mr-1" />
                    {language.toUpperCase()}
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

              <CardContent className="p-0 relative overflow-hidden">
                <SyntaxHighlighter
                  language={language.toLowerCase()}
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
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Options Section */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <Card className="shadow-lg border border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Play className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">Choose Your Answer</h3>
              </div>
            </CardHeader>
            <CardContent>
              <CodeQuizOptions
                options={options.map((o) => o.text)}
                selectedOption={selectedAnswer}
                onSelect={handleOptionSelect}
                disabled={isSubmitting || isAnswering}
                correctAnswer={question.correctAnswer}
                showCorrectAnswer={false}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation Section */}
        {showNavigation && (
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
        )}
      </div>
    </QuizContainer>
  )
}

export default memo(CodeQuiz)
