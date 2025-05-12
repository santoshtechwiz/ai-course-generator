"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { FlashCard } from "@/app/types/types"
import { useToast } from "@/hooks/use-toast"
import { Sparkles } from "lucide-react"
import axios from "axios"

import QuizActions from "../../components/QuizActions"
import { FlashCardWrapper } from "./FlashCardWrapper"

interface FlashCardsPageClientProps {
  slug: string
  userId: string
}

export default function FlashCardsPageClient({ slug, userId }: FlashCardsPageClientProps) {
  const [flashCards, setFlashCards] = useState<FlashCard[]>([])
  const [savedCardIds, setSavedCardIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [ownerId, setOwnerId] = useState<string>("")
  const [quizId, setQuizId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    const fetchFlashCards = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await axios.get(`/api/flashcard?slug=${slug}`)
        if (response.data.data.flashCards) {
          setOwnerId(response.data.data.quiz?.userId)
          setQuizId(response.data.data.quiz?.id)
          setFlashCards(response.data.data.flashCards)

          // Extract saved card IDs
          const savedIds = response.data.data.flashCards
            .filter((card: FlashCard) => card.isSaved)
            .map((card: FlashCard) => card.id)

          setSavedCardIds(savedIds)
        } else {
          setFlashCards([])
          setSavedCardIds([])
        }
      } catch (error) {
        console.warn("Error fetching flash cards:", error)
        setError("Failed to load your flash cards")
        toast({
          title: "Error",
          description: "Failed to load your flash cards. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFlashCards()
  }, [slug, toast])

  const handleSaveCard = async (card: FlashCard) => {
    try {
      // Toggle saved status
      const isSaved = savedCardIds.includes(card.id || "")

      // Update UI immediately for better UX
      if (isSaved) {
        setSavedCardIds(savedCardIds.filter((id) => id !== card.id))
      } else {
        setSavedCardIds([...savedCardIds, String(card.id) || ""])
      }

      // Call API to update saved status
      await axios.patch(`/api/flashcard`, {
        id: card.id,
        isSaved: !isSaved,
      })

      toast({
        title: isSaved ? "Card unsaved" : "Card saved",
        description: isSaved ? "Card removed from your saved collection" : "Card added to your saved collection",
      })
    } catch (error) {
      console.error("Error saving card:", error)

      // Revert the UI change since the API call failed
      if (savedCardIds.includes(String(card.id))) {
        setSavedCardIds(savedCardIds.filter((id) => id !== card.id))
      } else {
        setSavedCardIds([...savedCardIds, card.id || ""])
      }

      toast({
        title: "Error",
        description: "Failed to save the card. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto  max-w-3xl">
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
            <Button className="w-full" onClick={() => window.location.reload()}>
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
