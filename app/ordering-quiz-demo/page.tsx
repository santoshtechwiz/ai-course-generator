"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { OrderingQuizForm, type OrderingQuizFormData } from "@/components/quiz/OrderingQuizForm"
import { OrderingQuiz } from "@/components/quiz/OrderingQuiz"
import { OrderingQuizResult } from "@/components/quiz/OrderingQuizResult"
import { AppLoader } from "@/components/ui/loader"
import type { OrderingQuizQuestion } from "@/app/types/quiz-types"
import { OrderingQuizMetrics } from "@/lib/ordering-quiz/scoring-service"
import { AlertCircle } from "lucide-react"

type PageState = "form" | "loading" | "quiz" | "result" | "error"

interface PageData {
  state: PageState
  quiz?: OrderingQuizQuestion
  metrics?: OrderingQuizMetrics
  error?: string
  startTime?: number
  formData?: OrderingQuizFormData
}

export default function OrderingQuizDemo() {
  const [pageData, setPageData] = useState<PageData>({ state: "form" })
  const [quizzesGeneratedToday, setQuizzesGeneratedToday] = useState(0)

  /**
   * Handle form submission - call API to generate quiz
   */
  const handleGenerateQuiz = async (formData: OrderingQuizFormData) => {
    setPageData({ state: "loading", formData })

    try {
      const response = await fetch("/api/ordering-quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate quiz")
      }

      setQuizzesGeneratedToday(data.remainingQuizzes || 0)
      setPageData({
        state: "quiz",
        quiz: data.quiz,
        startTime: Date.now(),
        formData,
      })
    } catch (error) {
      console.error("Error generating quiz:", error)
      setPageData({
        state: "error",
        error: error instanceof Error ? error.message : "Failed to generate quiz",
      })
    }
  }

  /**
   * Handle quiz submission
   */
  const handleSubmitQuiz = async (userOrder: number[], isCorrect: boolean) => {
    if (!pageData.quiz || !pageData.startTime) return

    const timeTakenMs = Date.now() - pageData.startTime
    const correctOrder = pageData.quiz.steps.map((_: any, idx: number) => idx)
    const stepLabels = pageData.quiz.steps.map((s: any) => s.description)

    try {
      const response = await fetch("/api/ordering-quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: `quiz_${pageData.quiz.id}`,
          userOrder,
          timeTakenMs,
          correctOrder,
          stepLabels,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit quiz")
      }

      setPageData({
        state: "result",
        quiz: pageData.quiz,
        metrics: data.metrics,
        formData: pageData.formData,
      })
    } catch (error) {
      console.error("Error submitting quiz:", error)
      setPageData({
        state: "error",
        error: error instanceof Error ? error.message : "Failed to submit quiz",
      })
    }
  }

  /**
   * Handle retry - go back to form
   */
  const handleRetryQuiz = () => {
    setPageData({ state: "form" })
  }

  return (
    <div className="min-h-screen bg-black/90 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-amber-400">⚡ ORDERING QUIZ</h1>
          <p className="text-white/70">
            Generate AI-powered sequencing quizzes and test your knowledge
          </p>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {pageData.state === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <OrderingQuizForm
                userPlan="FREE"
                quizzesGeneratedToday={quizzesGeneratedToday}
                onSubmit={handleGenerateQuiz}
                isLoading={false}
              />
            </motion.div>
          )}

          {pageData.state === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <AppLoader message={`Generating quiz about "${pageData.formData?.topic}"...`} />
            </motion.div>
          )}

          {pageData.state === "quiz" && pageData.quiz && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <OrderingQuiz
                question={pageData.quiz}
                onSubmit={handleSubmitQuiz}
              />
            </motion.div>
          )}

          {pageData.state === "result" && pageData.quiz && pageData.metrics && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <OrderingQuizResult
                metrics={pageData.metrics}
                topic={pageData.quiz.topic}
                difficulty={pageData.quiz.difficulty}
                onRetry={handleRetryQuiz}
                userStats={{
                  averageScore: 75,
                  bestScore: 100,
                  totalAttempts: 1,
                }}
              />
            </motion.div>
          )}

          {pageData.state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 border-2 border-red-600 bg-red-900/20 rounded-none flex items-start gap-4"
            >
              <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-red-300 mb-2">Error</h3>
                <p className="text-red-300/80 mb-4">{pageData.error}</p>
                <button
                  onClick={handleRetryQuiz}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-none transition-colors"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Section */}
        <div className="space-y-3 border-t border-white/10 pt-6">
          <h2 className="text-sm font-black text-amber-400 uppercase">✨ Features</h2>
          <ul className="space-y-2 text-white/70 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">✓</span>
              <span>AI-powered quiz generation for any technical topic</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">✓</span>
              <span>Drag-and-drop and keyboard navigation support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">✓</span>
              <span>Detailed scoring, accuracy metrics, and feedback</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">✓</span>
              <span>Subscription-based daily limits (FREE/PREMIUM/PRO)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">✓</span>
              <span>Speed analytics and improvement suggestions</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
