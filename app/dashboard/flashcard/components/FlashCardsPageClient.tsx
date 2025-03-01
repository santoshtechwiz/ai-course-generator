"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { FlashCard } from "@/app/types/types"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Plus, Sparkles } from "lucide-react"
import axios from "axios"
import { FlashCardComponent } from "./FlashCardComponent"

interface FlashCardsPageClientProps {
  slug: string
}

export default function FlashCardsPageClient({ slug }: FlashCardsPageClientProps) {
  const [flashCards, setFlashCards] = useState<FlashCard[]>([])
  const [savedCardIds, setSavedCardIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchFlashCards = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await axios.get(`/api/flashcard?slug=${slug}`)

        if (response.data.flashcards) {
          setFlashCards(response.data.flashcards)

          // Extract saved card IDs
          const savedIds = response.data.flashcards
            .filter((card: FlashCard) => card.isSaved)
            .map((card: FlashCard) => card.id)

          setSavedCardIds(savedIds)
        } else {
          setFlashCards([])
          setSavedCardIds([])
        }
      } catch (error) {
        console.error("Error fetching flash cards:", error)
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
        setSavedCardIds([...savedCardIds, card.id || ""])
      }

      // Call API to update saved status
      await axios.patch(`/api/flashcard/${card.id}`, {
        isSaved: !isSaved,
      })

      toast({
        title: isSaved ? "Card unsaved" : "Card saved",
        description: isSaved ? "Card removed from your saved collection" : "Card added to your saved collection",
      })
    } catch (error) {
      console.error("Error saving card:", error)

      // Revert the UI change since the API call failed
      if (savedCardIds.includes(card.id || "")) {
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
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">My Flash Cards</h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/quizzes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <Link href="/dashboard/flashcard">
              <Button size="sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate New Cards
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <Card className="w-full max-w-md mx-auto h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your flash cards...</p>
            </div>
          </Card>
        ) : error ? (
          <Card className="w-full max-w-md mx-auto">
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
          <FlashCardComponent cards={flashCards} onSaveCard={handleSaveCard} savedCardIds={savedCardIds} />
        ) : (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>No Flash Cards Yet</CardTitle>
              <CardDescription>
                You haven't created any flash cards yet. Generate some with AI or create them manually.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/flashcard">
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Flash Cards
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

