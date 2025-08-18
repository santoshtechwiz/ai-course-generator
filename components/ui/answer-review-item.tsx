"use client"
import { getSimilarityLevel } from "@/lib/utils/string"
const formatQuizTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}m ${secs}s`
}
import { motion } from "framer-motion"

import { CheckCircle, XCircle, Clock, HelpCircle } from "lucide-react"

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"

interface AnswerReviewItemProps {
  index: number
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  timeSpent: number
  similarity?: number
  hintsUsed?: boolean
  language?: string
  formatQuestionText?: (text: string) => string
  delay?: number
  showSimilarityDetails?: boolean
}

export function AnswerReviewItem({
  index,
  question,
  userAnswer,
  correctAnswer,
  isCorrect,
  timeSpent,
  similarity,
  hintsUsed,
  language = "javascript",
  formatQuestionText,
  delay = 0,
  showSimilarityDetails = false,
}: AnswerReviewItemProps) {
  const formattedQuestion = formatQuestionText ? formatQuestionText(question) : question
  const similarityLevel = similarity !== undefined ? getSimilarityLevel(similarity) : undefined

  // Determine if this is a code answer
  const isCodeAnswer = language && language.toLowerCase() !== "text" && language.toLowerCase() !== "plaintext"

  // Render code with syntax highlighting
  const renderCode = (code: string, lang: string) => {
    if (!code) return <span className="text-muted-foreground italic">No code provided</span>

    return (
      <SyntaxHighlighter
        language={lang}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.9rem",
          borderRadius: "0.375rem",
          maxHeight: "200px",
        }}
        showLineNumbers={true}
      >
        {code}
      </SyntaxHighlighter>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`border rounded-lg overflow-hidden ${
        isCorrect ? "border-green-200 dark:border-green-900" : "border-red-200 dark:border-red-900"
      }`}
    >
      <div className={`h-1 ${isCorrect ? "bg-green-500" : "bg-red-500"}`}></div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isCorrect
                ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
            }`}
          >
            {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          </div>

          <div className="space-y-2 w-full">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-base">Question {index + 1}</h4>
              <div className="flex items-center gap-2">
                {hintsUsed && (
                  <span
                    className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center"
                    title="Hint was used"
                  >
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Hint used
                  </span>
                )}
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatQuizTime(timeSpent)}
                </span>
              </div>
            </div>

            <div
              className="text-sm text-muted-foreground mb-3"
              dangerouslySetInnerHTML={{ __html: formattedQuestion }}
            ></div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium mb-1">Your answer:</p>
                <div
                  className={`rounded-md text-sm ${
                    isCorrect
                      ? "bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900"
                      : "bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900"
                  }`}
                >
                  {isCodeAnswer ? (
                    renderCode(userAnswer, language)
                  ) : (
                    <div className="p-2">
                      {userAnswer || <span className="text-muted-foreground italic">No answer provided</span>}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Correct answer:</p>
                <div className="rounded-md text-sm bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900">
                  {isCodeAnswer ? (
                    renderCode(correctAnswer, language)
                  ) : (
                    <div className="p-2">
                      {correctAnswer || <span className="text-muted-foreground italic">No answer available</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {similarity !== undefined && (
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">Similarity score:</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      similarityLevel === "high" || similarityLevel === "exact"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : similarityLevel === "medium"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {Math.round(similarity)}%
                  </span>
                </div>

                {showSimilarityDetails && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          similarityLevel === "high" || similarityLevel === "exact"
                            ? "bg-green-500"
                            : similarityLevel === "medium"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, similarity))}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on Levenshtein distance and Jaro-Winkler similarity
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
