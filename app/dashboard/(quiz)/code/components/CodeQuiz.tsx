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
import { Code2, Terminal, Copy, Check, Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
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
  difficulty = "Medium",
}: CodeQuizProps) => {
  const dispatch = useAppDispatch()
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(existingAnswer || null)
  const [copied, setCopied] = useState(false)
  const [isAnswering, setIsAnswering] = useState(false)

  const options = useMemo(() => {
    return question.options?.map((option) => ({ 
      id: option, 
      text: option 
    })) || []
  }, [question.options])

  const handleOptionSelect = useCallback(
    async (optionId: string) => {
      if (isAnswering || isSubmitting) return

      setIsAnswering(true)
      try {
        const selected = options.find(o => o.id === optionId)
        if (selected) {
          setSelectedAnswer(selected.text)
          dispatch(saveAnswer({ 
            questionId: String(question.id), 
            answer: selected.text 
          }))
          onAnswer(selected.text)
        }
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
  const language = question.language?.trim() || "javascript"

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      quizType="code"
      animationKey={`code-${question.id}`}
      difficulty={difficulty?.toLowerCase() as "easy" | "medium" | "hard"}
      fullWidth={true}
    >
      <div className="space-y-8">
        {/* Question Section */}
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <h2 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight text-foreground mx-auto max-w-3xl px-4">
            {question.text || question.question}
          </h2>
          
          <div className="h-1 w-24 bg-green-500 rounded-full mx-auto mt-6 mb-8" />
        </motion.div>

        {/* Code Display Section */}
        {question.codeSnippet && (
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="overflow-hidden rounded-lg border border-border shadow-lg"
          >
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>

                <div className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-md">
                  <Terminal className="w-4 h-4 text-slate-300" />
                  <span className="text-slate-300 text-sm font-mono">{language}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCode}
                  className="h-8 w-8 text-slate-300 hover:text-white"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="relative overflow-hidden max-h-[500px] overflow-y-auto">
              <SyntaxHighlighter
                language={language.toLowerCase()}
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  padding: "1.5rem",
                  fontSize: "0.875rem",
                  background: "#0f172a",
                  lineHeight: "1.6",
                }}
                lineNumberStyle={{
                  color: "#64748b",
                  paddingRight: "1rem",
                  minWidth: "2.5em"
                }}
              >
                {question.codeSnippet}
              </SyntaxHighlighter>
            </div>
          </motion.div>
        )}

        {/* Options Section */}
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
         
          
          <Card className="border border-border bg-card">
            <CardContent className="p-6">
              <CodeQuizOptions
                options={options.map(o => o.text)}
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