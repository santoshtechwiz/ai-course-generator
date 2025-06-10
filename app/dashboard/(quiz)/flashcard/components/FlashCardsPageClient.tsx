"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCcw } from "lucide-react"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { FlashCardWrapper } from "./FlashCardWrapper"
import {
  fetchFlashCards,
  toggleSaveCard,
  selectFlashCards,
  selectSavedCardIds,
  selectFlashCardsLoading,
  selectFlashCardsError,
  selectOwnerId,
  selectQuizId
} from "@/store/slices/flashcardSlice"
import { AppDispatch } from "@/store"

interface FlashCardPageClientProps {
  slug: string
  userId?: string
}

export default function FlashCardsPageClient({ slug, userId }: FlashCardPageClientProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { data: session, status: authStatus } = useSession()

  // Get state from Redux with memoization
  const cards = useSelector(selectFlashCards)
  const savedCardIds = useSelector(selectSavedCardIds)
  const isLoading = useSelector(selectFlashCardsLoading)
  const error = useSelector(selectFlashCardsError)
  const ownerId = useSelector(selectOwnerId)
  const quizId = useSelector(selectQuizId)
  
  // Local state
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [fetchAttempted, setFetchAttempted] = useState(false)

  // Fetch flashcards with optimized loading state management
  useEffect(() => {
    // Skip if we already successfully fetched data
    if (cards.length > 0 && !error) return;

    // Skip if we already attempted a fetch
    if (fetchAttempted) return;
    
    // Improved fetch with abort controller for cleanup
    const controller = new AbortController();
    
    const fetchCards = async () => {
      setIsLoadingCards(true)
      setFetchAttempted(true)
      
      try {
        await dispatch(fetchFlashCards({ 
          slug,
          signal: controller.signal 
        })).unwrap()
        setLoadingError(null)
      } catch (err: any) {
        // Don't set error if aborted
        if (err.name !== 'AbortError') {
          setLoadingError(err.message || "Failed to load flashcards")
        }
      } finally {
        // Only change loading state if component is still mounted
        setIsLoadingCards(false)
      }
    }

    // Use requestIdleCallback if available for non-critical fetch
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      // @ts-ignore - TypeScript doesn't recognize requestIdleCallback
      window.requestIdleCallback(() => fetchCards(), { timeout: 1000 });
    } else {
      // Small timeout as fallback
      const timerId = setTimeout(fetchCards, 10);
      return () => clearTimeout(timerId);
    }
    
    // Clean up fetch request on unmount
    return () => controller.abort();
  }, [dispatch, slug, cards.length, error, fetchAttempted])

  // Handle save/unsave card with useCallback to prevent rerenders
  const handleSaveCard = useCallback(async (card: any) => {
    if (!session) return

    const cardId = card.id.toString()
    const isSaved = savedCardIds.includes(cardId)

    try {
      await dispatch(toggleSaveCard({ 
        cardId, 
        isSaved 
      })).unwrap()
    } catch (error) {
      console.error("Failed to toggle card save status", error)
    }
  }, [session, savedCardIds, dispatch])

  // Handle retry on error with useCallback
  const handleRetry = useCallback(() => {
    setFetchAttempted(false)
    dispatch(fetchFlashCards({ slug }))
  }, [dispatch, slug])

  // Memoize loading state to prevent re-renders
  const isPageLoading = useMemo(() => 
    isLoadingCards || isLoading
  , [isLoadingCards, isLoading])

  if (isPageLoading) {
    return <QuizLoader message="Loading flashcards..." subMessage="Preparing your study materials" />
  }

  if (loadingError || error) {
    return (
      <div className="container max-w-4xl py-6">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error loading flashcards</AlertTitle>
          <AlertDescription>
            {loadingError || error}. Please try again.
          </AlertDescription>
        </Alert>
        <Button onClick={handleRetry} className="mx-auto flex gap-2">
          <RefreshCcw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
      </div>
    )
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="container max-w-4xl py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">No Flashcards Available</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            This quiz has no flashcards, or they could not be loaded.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <FlashCardWrapper
        cards={cards}
        slug={slug}
        quizId={quizId || slug}
        title={cards[0]?.title || "Flashcard Quiz"}
        onSaveCard={handleSaveCard}
        savedCardIds={savedCardIds}
      />
    </div>
  )
}
