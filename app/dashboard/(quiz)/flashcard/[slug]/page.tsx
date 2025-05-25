"use client"

import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Loader } from "@/components/ui/loader"
import { ResolvingMetadata, Metadata } from "next"
import EnhancedFlashCardComponent from "../components/EnhancedFlashCardComponent"
import { useEffect, useState } from "react"
import { useAppDispatch } from "@/store"
import { checkAuthStatus } from "@/store/slices/authSlice"

interface PageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function FlashcardPage({ params, searchParams }: PageProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quizData, setQuizData] = useState<any>(null)
  const dispatch = useAppDispatch()
  
  // Check if slug exists
  if (!params.slug) {
    return notFound()
  }
  
  // Fetch auth status and quiz data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check authentication status
        const authResult = await dispatch(checkAuthStatus()).unwrap()
        setUserId(authResult.userId)
        
        // Fetch quiz data
        const response = await fetch(`/api/flashcard?slug=${params.slug}`)
        if (!response.ok) {
          throw new Error('Failed to fetch flashcard data')
        }
        
        const data = await response.json()
        setQuizData(data.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [dispatch, params.slug])
  
  if (isLoading) {
    return (
      <div className="container py-6">
        <Loader />
      </div>
    )
  }
  
  if (!quizData || !quizData.flashCards || quizData.flashCards.length === 0) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">No flashcards found</h2>
          <p className="text-muted-foreground">This quiz doesn't contain any flashcards.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-6">
      <EnhancedFlashCardComponent 
        cards={quizData.flashCards}
        quizId={quizData.quiz?.id || params.slug}
        slug={params.slug}
        title={quizData.quiz?.title || "Flashcard Quiz"}
        savedCardIds={quizData.savedCardIds || []}
        userId={userId}
      />
    </div>
  )
}
