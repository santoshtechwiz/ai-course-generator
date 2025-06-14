"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { FlashCardComponent } from "./FlashCardComponent"

import {
  fetchFlashCards,
  resetFlashCards,
  toggleSaveCard,
  selectFlashCards,
  selectSavedCardIds,
  selectFlashCardsLoading,
  selectFlashCardsError,
  selectOwnerId,
  selectQuizId,
} from "@/store/slices/flashcard-slice"

import type { FlashCard } from "@/app/types/types"
import type { AppDispatch } from "@/store"

interface FlashCardsWrapperProps {
  slug: string
  userId?: string
}

export default function FlashCardsWrapper({ slug, userId }: FlashCardsWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { data: session } = useSession()
  const searchParams = useSearchParams()

  const cards = useSelector(selectFlashCards)
  const savedCardIds = useSelector(selectSavedCardIds)
  const isLoading = useSelector(selectFlashCardsLoading)
  const error = useSelector(selectFlashCardsError)
  const quizId = useSelector(selectQuizId)

  const [localLoading, setLocalLoading] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)
  const [fetchAttempted, setFetchAttempted] = useState(false)
  const [key, setKey] = useState<number>(() => Date.now())

  const handleSaveCard = useCallback(async (card: FlashCard) => {
    if (!session) return
    const cardId = card.id.toString()
    const isSaved = savedCardIds.includes(cardId)

    try {
      await dispatch(toggleSaveCard({ cardId, isSaved })).unwrap()
    } catch (error) {
      console.error("Failed to toggle card save status", error)
    }
  }, [session, savedCardIds, dispatch])

  const fetchCards = useCallback(async () => {
    setLocalLoading(true)
    setFetchAttempted(true)

    const controller = new AbortController()
    try {
      await dispatch(fetchFlashCards({ slug, signal: controller.signal })).unwrap()
      setLocalError(null)
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setLocalError(err.message || "Failed to load flashcards")
      }
    } finally {
      setLocalLoading(false)
    }

    return () => controller.abort()
  }, [dispatch, slug])

  useEffect(() => {
    if ((cards.length > 0 && !error) || fetchAttempted) return

    if ("requestIdleCallback" in window) {
      // @ts-ignore
      window.requestIdleCallback(() => fetchCards(), { timeout: 1000 })
    } else {
      const timer = setTimeout(fetchCards, 10)
      return () => clearTimeout(timer)
    }
  }, [cards.length, error, fetchCards, fetchAttempted])



  const handleRetry = () => {
    setFetchAttempted(false)
    fetchCards()
  }

  const isPageLoading = useMemo(() => localLoading || isLoading, [localLoading, isLoading])

  if (isPageLoading) {
    return <QuizLoader message="Loading flashcards..." subMessage="Preparing your study materials" />
  }

  if (localError || error) {
    return (
      <div className="container max-w-4xl py-6">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error loading flashcards</AlertTitle>
          <AlertDescription>
            {localError || error}. Please try again.
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
      <FlashCardComponent
        key={key}
        cards={cards}
        quizId={quizId || slug}
        slug={slug}
        title={cards[0]?.title || "Flashcard Quiz"}
        onSaveCard={handleSaveCard}
        savedCardIds={savedCardIds}
      />
    </div>
  )
}
