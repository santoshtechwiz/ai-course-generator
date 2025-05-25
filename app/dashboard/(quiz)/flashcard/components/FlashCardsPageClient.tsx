"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Sparkles } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"

import QuizActions from "../../components/QuizActions"
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


interface FlashCardsPageClientProps {
  slug: string
  userId: string
}

export default function FlashCardsPageClient({ slug, userId }: FlashCardsPageClientProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { toast } = useToast()
  
  // Get data from Redux state
  const flashCards = useSelector(selectFlashCards)
  const savedCardIds = useSelector(selectSavedCardIds)
  const loading = useSelector(selectFlashCardsLoading)
  const error = useSelector(selectFlashCardsError)
  const ownerId = useSelector(selectOwnerId)
  const quizId = useSelector(selectQuizId)

  // Fetch flashcards when component mounts or slug changes
  useEffect(() => {
    dispatch(fetchFlashCards(slug))
  }, [slug, dispatch])

  // Handle saving/unsaving cards
  const handleSaveCard = async (card: any) => {
    try {
      // Toggle save status and update Redux state
      dispatch(toggleSaveCard({
        cardId: card.id || "",
        isSaved: !savedCardIds.includes(card.id || ""),
        toast
      }))
    } catch (error) {
      console.error("Error saving card:", error)
      toast({
        title: "Error",
        description: "Failed to save the card. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <QuizActions
        quizId={quizId}
        quizSlug={slug}
        initialIsPublic={false}
        initialIsFavorite={false}
        userId={userId}
        ownerId={ownerId}
        quizType="flashcard"
        position="left-center"
      />
      
      {loading ? (
        <Card className="w-full h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your flash cards...</p>
          </div>
        </Card>
      ) : error ? (
        <Card className="w-full mx-auto">
          <CardHeader>
            <CardTitle>Error Loading Flash Cards</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => dispatch(fetchFlashCards(slug))}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : flashCards.length > 0 ? (
        <FlashCardWrapper
          cards={flashCards}
          onSaveCard={handleSaveCard}
          savedCardIds={savedCardIds}
          quizId={quizId}
          slug={slug}
          title="Flash Cards"
        />
      ) : (
        <Card className="w-full mx-auto">
          <CardHeader>
            <CardTitle>No Flash Cards Yet</CardTitle>
            <CardDescription>
              You haven't created any flash cards yet. Generate some with AI or create them manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/flashcard">
              <Button className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Create Flash Cards
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
