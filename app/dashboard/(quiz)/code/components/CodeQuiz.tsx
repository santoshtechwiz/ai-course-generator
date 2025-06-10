"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code } from "lucide-react"
import { motion } from "framer-motion"
import { useAppDispatch } from "@/store"
import { saveAnswer } from "@/store/slices/quizSlice"
import type { CodeQuestion } from "./types"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import CodeQuizOptions from "./CodeQuizOptions"
import { Button } from "@/components/ui/button"

interface CodeQuizProps {
  question: CodeQuestion
  onAnswer: (answer: string) => void
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  onNext?: () => void
  onFinish?: () => void
  showNavigation?: boolean
}

const CodeQuiz = ({
  question,
  onAnswer,
  isSubmitting = false,
  questionNumber = 1,
  totalQuestions = 1,
  existingAnswer,
  onNext,
  onFinish,
  showNavigation = true,
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

  const isLastQuestion = questionNumber === totalQuestions
  const hasAnswer = !!existingAnswer

  return (
    <motion.div
      data-testid="code-quiz"
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
                <Code className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Question {questionNumber}</CardTitle>
                <CardDescription className="text-sm">of {totalQuestions}</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Math.round((questionNumber / totalQuestions) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold select-none text-foreground max-w-3xl mx-auto">
              {question.text || question.question}
            </h3>
          </div>

          {question.codeSnippet && (
            <div className="rounded-md overflow-hidden">
              <SyntaxHighlighter
                language={question.language || "javascript"}
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  borderRadius: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                {question.codeSnippet}
              </SyntaxHighlighter>
            </div>
          )}

          <CodeQuizOptions
            options={question.options}
            selectedOption={existingAnswer ?? null}
            onSelect={handleAnswerSelection}
            disabled={isSubmitting}
          />

          {showNavigation && hasAnswer && (
            <div className="flex justify-center pt-4">
              {isLastQuestion ? (
                <Button onClick={onFinish} disabled={isSubmitting} size="lg" className="min-w-32">
                  {isSubmitting ? "Submitting..." : "Finish Quiz"}
                </Button>
              ) : (
                <Button onClick={onNext} disabled={isSubmitting} size="lg" className="min-w-32">
                  Next Question
                </Button>
              )}
            </div>
          )}

          {!hasAnswer && <div className="text-center text-sm text-muted-foreground">Select an answer to continue</div>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default CodeQuiz
