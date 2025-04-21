"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { notFound } from "next/navigation"
import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"

import type { CodingQuizProps } from "@/app/types/types"

import { Loader } from "@/components/ui/loader"
import QuizActions from "../../components/QuizActions"
import { AuthModal } from "@/components/ui/auth-modal"
import CodingQuiz from "./CodingQuiz"

// Improved error handling for API requests
async function getQuizData(slug: string): Promise<CodingQuizProps | null> {
  try {
    const response = await axios.get<CodingQuizProps>(`/api/code-quiz/${slug}`)
    if (response.status !== 200) {
      throw new Error(`Failed to fetch quiz data: ${response.statusText}`)
    }
    return response.data
  } catch (error) {
    console.error("Error fetching quiz data:", error)
    return null
  }
}

interface CodingQuizWrapperProps {
  slug: string
  userId: string
}

export default function CodeQuizWrapper({ slug, userId }: CodingQuizWrapperProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { status } = useSession()
  const isAuthenticated = status === "authenticated"

  const {
    data: quizData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["quizData", slug],
    queryFn: () => getQuizData(slug),
    retry: 1, // Limit retries to avoid excessive API calls
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
        quizId={quizData.quizId.toString()}
        quizSlug={quizData.slug}
        initialIsPublic={quizData.isPublic}
        initialIsFavorite={quizData.isFavorite}
        userId={userId}
        ownerId={quizData?.ownerId || ""}
        position="left-center"
      />

      <CodingQuiz
        quizId={quizData.quizId.toString()}
        slug={quizData.slug}
        isFavorite={quizData.isFavorite}
        isPublic={quizData.isPublic}
        userId={userId}
        ownerId={quizData?.ownerId || ""}
        quizData={quizData.quizData}
        onComplete={handleQuizComplete}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        title="Sign in to save your results"
        description="Please sign in to save your quiz results and track your progress."
        callbackUrl={`/dashboard/code/${slug}`}
      />
    </div>
  )
}
