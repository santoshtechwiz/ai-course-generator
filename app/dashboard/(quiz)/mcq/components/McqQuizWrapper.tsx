"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { notFound } from "next/navigation"
import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"

import { Loader } from "@/components/ui/loader"
import QuizActions from "../../components/QuizActions"
import { AuthModal } from "@/components/ui/auth-modal"
import { QuizBase } from "../../components/QuizBase"
import McqQuiz from "./McqQuiz"
import { McqQuizProps } from "./types"


// Fetch quiz data from API
async function getQuizData(slug: string): Promise<McqQuizProps | null> {
  try {
    const response = await axios.get<McqQuizProps>(`/api/mcq/${slug}`)
    if (response.status !== 200) {
      throw new Error(`Failed to fetch quiz data: ${response.statusText}`)
    }
    console.log("Quiz data fetched successfully:", response.data);
    return response.data
  } catch (error) {
    console.error("Error fetching quiz data:", error)
    return null
  }
}

interface McqQuizWrapperProps {
  slug: string
  userId: string
}

export default function McqQuizWrapper({ slug, userId }: McqQuizWrapperProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { status } = useSession()
  const isAuthenticated = status === "authenticated"

  const {
    data: quizData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["mcqQuizData", slug],
    queryFn: () => getQuizData(slug),
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
  })

  const handleQuizComplete = useCallback(() => {
    // If user is not authenticated, show auth modal
    if (!isAuthenticated) {
      setShowAuthModal(true)
    }
  }, [isAuthenticated])

  const handleAuthModalClose = useCallback(() => {
    setShowAuthModal(false)
  }, [])

  if (isLoading) {
    return <Loader />
  }

  if (isError || !quizData) {
    console.error("Error loading quiz:", error)
    return notFound()
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <QuizActions
        quizId={quizData?.quizId?.toString()}
        quizSlug={quizData.slug}
        initialIsPublic={quizData.isPublic}
        initialIsFavorite={quizData.isFavorite}
        userId={userId}
        ownerId={quizData?.ownerId || ""}
        position="left-center"
      />

      <QuizBase
        quizId={quizData?.quizId?.toString()}
        slug={quizData.slug}
        title={quizData.title}
        type="mcq"
        totalQuestions={quizData?.questions?.length}
      >
        <McqQuiz
          questions={quizData?.questions}
          quizId={quizData?.quizId}
          slug={quizData?.slug}
          title={quizData?.title}
          onComplete={handleQuizComplete}
        />
      </QuizBase>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        title="Sign in to save your results"
        description="Please sign in to save your quiz results and track your progress."
        callbackUrl={`/dashboard/mcq/${slug}`}
      />
    </div>
  )
}
