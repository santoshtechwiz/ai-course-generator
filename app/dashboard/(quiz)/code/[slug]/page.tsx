"use client"

import { useEffect } from "react"
import { use } from "react" // Import use from React
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuizState"
import CodeQuizWrapper from "../components/CodeQuizWrapper"

interface CodeQuizPageProps {
  params: {
    slug: string
  }
}

export default function CodeQuizPage({ params: paramsPromise }: CodeQuizPageProps) {
  // Unwrap params with React.use()
  const params = use(paramsPromise)
  const slug = params.slug
  
  const router = useRouter()
  const { userId, isAuthenticated, status } = useAuth()
  const { loadQuiz, quizData, isLoading, quizError } = useQuiz()
  
  // Load quiz from Redux state
  useEffect(() => {
    if (!isLoading && !quizData && slug) {
      loadQuiz(slug, "code")
        .catch(error => {
          console.error("Error loading quiz:", error)
        })
    }
  }, [slug, loadQuiz, isLoading, quizData])

  // Loading state
  if (isLoading || status === 'loading') {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (quizError) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Error Loading Quiz</h1>
        <p>{quizError}</p>
        <p className="mt-4">
          <button 
            onClick={() => router.push("/dashboard/quizzes")}
            className="text-primary underline"
          >
            Return to quizzes
          </button>
        </p>
      </div>
    )
  }
  
  // Quiz found - render the wrapper
  if (quizData) {
    return (
      <div className="container max-w-4xl py-6">
        <CodeQuizWrapper 
          slug={slug} 
          quizId={quizData.id} 
          userId={userId} 
          quizData={quizData}
          isPublic={quizData.isPublic}
          isFavorite={quizData.isFavorite}
          ownerId={quizData.ownerId}
        />
      </div>
    )
  }
  
  // Default loading state
  return (
    <div className="container max-w-4xl py-10">
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading quiz...</p>
      </div>
    </div>
  )
}
