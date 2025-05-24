"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { useAuth } from "@/hooks/useAuth"
import { AppDispatch } from "@/store"
import { InitializingDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import CodeQuizWrapperRedux from "../components/CodeQuizWrapperRedux"
import { selectQuizId, fetchQuiz } from "@/store/slices/quizSlice"

export default function CodeQuizPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const router = useRouter()
  const { userId, status } = useAuth()
  const dispatch = useDispatch<AppDispatch>()
  const quizId = useSelector(selectQuizId)

  // Extract slug in a way that works in tests and in real usage
  const slug =
    params instanceof Promise
      ? use(params).slug // Real usage with Next.js
      : (params as { slug: string }).slug // Test usage

  // Load quiz data
  useEffect(() => {
    const loadQuizData = async () => {
      if (!quizId) {
        try {
          // Fetch quiz data from API
          const response = await fetch(`/api/quizzes/code/${slug}`)
          
          if (!response.ok) {
            throw new Error('Quiz not found')
          }
          
          const quizData = await response.json()
          
          // Now pass this data to the wrapper component
          return quizData
        } catch (error) {
          console.error("Error loading quiz:", error)
          return null
        }
      }
    }
    
    if (slug) {
      loadQuizData()
    }
  }, [slug, quizId, dispatch])

  // If still loading or waiting for auth status, show loading
  if (status === "loading") {
    return <InitializingDisplay />
  }

  // This is a placeholder for where you would normally fetch or access quiz data
  // In a real implementation, you would load this from an API or state management
  const quizData = {
    id: slug,
    title: "Code Quiz",
    questions: [],
  }

  return (
    <div className="container max-w-4xl py-6">
      <CodeQuizWrapperRedux
        slug={slug}
        quizId={quizData.id}
        userId={userId}
        quizData={quizData}
      />
    </div>
  )
}
