"use client"

import React, { use, Suspense, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Play, Info } from "lucide-react"
import { LoadingOverlay, SkeletonLoader } from "../../components/LoadingComponents"
import { InitializingDisplay } from "../../components/QuizStateDisplay"
import EnhancedFlashCardComponent from "../components/EnhancedFlashCardComponent"
import { useAppDispatch } from "@/store"
import { checkAuthStatus } from "@/store/slices/authSlice"

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

// Wrapper component that handles data fetching
function FlashcardContent({ slug }: { slug: string }) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quizData, setQuizData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  
  // Fetch auth status and quiz data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Check authentication status
        const authResult = await dispatch(checkAuthStatus()).unwrap()
        setUserId(authResult.userId)
        
        // Fetch quiz data
        const response = await fetch(`/api/flashcard?slug=${slug}`)
        if (!response.ok) {
          throw new Error('Failed to fetch flashcard data')
        }
        
        const data = await response.json()
        setQuizData(data.data)
        setError(null)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [dispatch, slug])
  
  // Loading state with improved UX
  if (isLoading) {
    return <InitializingDisplay message="Loading flashcards..." />
  }
  
  // Error state with improved UX
  if (error) {
    return (
      <Card className="w-full max-w-3xl mx-auto border-destructive/20">
        <CardHeader>
          <CardTitle className="text-xl text-center text-destructive">Error Loading Flashcards</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="bg-destructive/10 rounded-full p-3">
              <Info className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <p className="mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Empty state with improved UX
  if (!quizData || !quizData.flashCards || quizData.flashCards.length === 0) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center">No Flashcards Available</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>This quiz doesn't contain any flashcards.</p>
          <Button onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  // Render the flashcard component with data
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">{quizData.quiz?.title || "Flashcard Quiz"}</h1>
        </div>
      </div>
      
      <Card className="w-full">
        <CardContent className="p-0">
          <Tabs defaultValue="cards" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Study Cards
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Quiz Info
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="cards" className="p-6">
              <EnhancedFlashCardComponent 
                cards={quizData.flashCards}
                quizId={quizData.quiz?.id || slug}
                slug={slug}
                title={quizData.quiz?.title || "Flashcard Quiz"}
                savedCardIds={quizData.savedCardIds || []}
                userId={userId}
              />
            </TabsContent>
            
            <TabsContent value="info" className="p-6">
              <div className="space-y-4">
                <h2 className="text-lg font-medium">About This Flashcard Set</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="font-medium">{quizData.quiz?.title || "Flashcard Quiz"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Cards</p>
                    <p className="font-medium">{quizData.flashCards?.length || 0} flashcards</p>
                  </div>
                  {quizData.quiz?.description && (
                    <div className="col-span-2 space-y-2">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p>{quizData.quiz.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={() => document.querySelector('[data-value="cards"]')?.click()}
                    className="w-full"
                  >
                    Start Studying
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default function FlashcardPage({ params, searchParams }: PageProps) {
  // Properly unwrap params using React.use()
  const { slug } = params instanceof Promise 
    ? use(params) 
    : params as { slug: string }
  
  // Check if slug exists
  if (!slug) {
    return (
      <div className="container py-6">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl text-center">Quiz Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">The requested flashcard quiz could not be found.</p>
            <Button 
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container py-6">
      <Suspense fallback={<InitializingDisplay message="Loading flashcards..." />}>
        <FlashcardContent slug={slug} />
      </Suspense>
    </div>
  )
}
