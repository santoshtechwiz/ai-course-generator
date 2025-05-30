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
  Code
} from "lucide-react"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { useAppDispatch } from "@/store"
import { saveAnswer } from "@/store/slices/quizSlice"
import { CodeQuestion } from "./types"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import CodeQuizOptions from "./CodeQuizOptions"

interface CodeQuizProps {
  question: CodeQuestion
  onAnswer: (answer: string) => void
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  feedbackType?: "correct" | "incorrect" | null
}

const CodeQuiz = ({
  question,
  onAnswer,
  isSubmitting = false,
  questionNumber = 1,
  totalQuestions = 1,
  existingAnswer,
  feedbackType,
}: CodeQuizProps) => {
  const dispatch = useAppDispatch()

  if (
    !question ||
    (!question.text && !question.question) ||
    !Array.isArray(question.options) ||
    question.options.length === 0
  ) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-xl border-0 bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-3">Question Unavailable</h3>
          <p className="text-muted-foreground mb-6">
            We're having trouble loading this question. Please try refreshing.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  const options = question.options
  const progressPercentage = (questionNumber / totalQuestions) * 100
  const language = question.language || "javascript"

  const handleAnswerSelection = (optionId: string) => {
    if (isSubmitting || existingAnswer) return

    onAnswer(optionId)

    try {
      const isCorrect = optionId === question.correctOptionId
      dispatch(saveAnswer({
        questionId: question.id,
        answer: {
          questionId: question.id,
          selectedOptionId: optionId,
          timestamp: Date.now(),
          type: "code",
          isCorrect,
        },
      }))
    } catch (error) {
      console.error("Redux dispatch failed:", error)
    }
  }

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
              <div className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-3 bg-muted/50" />
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/20 mb-6">
              <Code className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Select the correct code</span>
            </div>
            <h3 className="text-xl font-semibold select-none text-foreground max-w-3xl mx-auto">
              {question.text || question.question}
            </h3>
          </div>

          {question.codeSnippet && (
            <div className="rounded-md overflow-hidden">
              <SyntaxHighlighter
                language={language}
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

          {/* ✅ Refactored: Use reusable CodeQuizOptions */}
          <CodeQuizOptions
            options={options}
            selectedOption={existingAnswer ?? null}
            onSelect={handleAnswerSelection}
            feedbackType={feedbackType}
            disabled={isSubmitting || !!existingAnswer}
            language={language}
          />

          {/* Optional feedback message */}
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

export default CodeQuiz
