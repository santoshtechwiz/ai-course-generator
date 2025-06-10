"use client"

import { useEffect, useState } from "react"
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

  // Get state from Redux
  const cards = useSelector(selectFlashCards)
  const savedCardIds = useSelector(selectSavedCardIds)
  const isLoading = useSelector(selectFlashCardsLoading)
  const error = useSelector(selectFlashCardsError)
  const ownerId = useSelector(selectOwnerId)
  const quizId = useSelector(selectQuizId)
  
  // Local state
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)

  // Fetch flashcards on mount
  useEffect(() => {
    const fetchCards = async () => {
      setIsLoadingCards(true)
      try {
        await dispatch(fetchFlashCards({ slug })).unwrap()
        setLoadingError(null)
      } catch (err: any) {
        setLoadingError(err.message || "Failed to load flashcards")
      } finally {
        setIsLoadingCards(false)
      }
    }

    fetchCards()
  }, [dispatch, slug])

  // Handle save/unsave card
  const handleSaveCard = async (card: any) => {
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
  }

  // Handle retry on error
  const handleRetry = () => {
    dispatch(fetchFlashCards({ slug }))
  }

  if (isLoadingCards || isLoading) {
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
