"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, Star, Trash2, Share2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"

import QuizPDFDownload from "../../course/components/QuizPDFDownload"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { Rating } from "@/components/ui/rating"

interface QuizActionsToolbarProps {
  quizId: string
  quizSlug: string
  initialIsPublic: boolean
  initialIsFavorite: boolean
  userId: string
  ownerId: string
  quizType?: string
}

export function QuizActions({
  quizId,
  quizSlug,
  initialIsPublic,
  initialIsFavorite,
  userId,
  ownerId,
  quizType,
}: QuizActionsToolbarProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isShareLoading, setIsShareLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [data, setData] = useState<any | null>(null)
  const router = useRouter()
  const { subscriptionStatus, isLoading } = useSubscriptionStore()
  const [rating, setRating] = useState<number | null>(null)

  useEffect(() => {
    const fetchQuizState = async () => {
      try {
        const [quizResponse, ratingResponse] = await Promise.all([
          fetch(`/api/quiz/${quizSlug}`),
          fetch(`/api/rating?type=quiz&id=${quizId}`),
        ])

        if (quizResponse.ok) {
          const quizData = await quizResponse.json()
          setData(quizData.quizData)
          setIsPublic(quizData.isPublic)
          setIsFavorite(quizData.isFavorite)
        }

        if (ratingResponse.ok) {
          const ratingData = await ratingResponse.json()
          setRating(ratingData.data?.rating || null)
        }
      } catch (error) {
        console.error("Error fetching quiz state:", error)
      }
    }

    fetchQuizState()
  }, [quizSlug, quizId])

  if (!userId || !ownerId || userId !== ownerId) {
    return null
  }

  const handleRatingChange = async (newRating: number) => {
    try {
      const response = await fetch("/api/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "quiz", id: quizId, rating: newRating }),
      })

      if (response.ok) {
        setRating(newRating)
        toast({
          title: "Rating updated",
          description: "Your rating has been successfully updated.",
          variant: "success",
        })
      } else {
        throw new Error("Failed to update rating")
      }
    } catch (error) {
      console.error("Error updating rating:", error)
      toast({
        title: "Error",
        description: "Failed to update rating. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateQuiz = async (data: { isPublic?: boolean; isFavorite?: boolean }) => {
    const loadingState = data.isPublic !== undefined ? setIsPublicLoading : setIsFavoriteLoading
    loadingState(true)
    try {
      const response = await fetch(`/api/quiz/${quizSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        const updatedQuiz = await response.json()
        setData(updatedQuiz.quizData)
        setIsPublic(updatedQuiz.isPublic)
        setIsFavorite(updatedQuiz.isFavorite)
        toast({
          title: "Quiz updated",
          description: `Your quiz is now ${updatedQuiz.isPublic ? "public" : "private"}${
            data.isFavorite !== undefined ? ` and ${updatedQuiz.isFavorite ? "favorited" : "unfavorited"}` : ""
          }.`,
          variant: "success",
        })
      } else {
        throw new Error("Failed to update quiz")
      }
    } catch (error) {
      console.error("Error updating quiz:", error)
      toast({
        title: "Error",
        description: "Failed to update quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      loadingState(false)
    }
  }

  const togglePublic = () => updateQuiz({ isPublic: !isPublic })
  const toggleFavorite = () => updateQuiz({ isFavorite: !isFavorite })

  const handleDelete = async () => {
    setIsDeleteLoading(true)
    try {
      const response = await fetch(`/api/quiz/${quizSlug}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })
      if (response.ok) {
        toast({
          title: "Quiz deleted",
          description: "Your quiz has been successfully deleted.",
          variant: "success",
        })
        router.push("/dashboard/quizzes")
      } else {
        throw new Error("Failed to delete quiz")
      }
    } catch (error) {
      console.error("Error deleting quiz:", error)
      toast({
        title: "Error",
        description: "Failed to delete quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const handleShare = () => {
    setIsShareLoading(true)
    setTimeout(() => {
      if (isPublic) {
        const shareUrl = `${window.location.origin}/dashboard/${quizType}/${quizSlug}`
        navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Share link copied",
          description: "The quiz link has been copied to your clipboard.",
          variant: "success",
        })
      } else {
        toast({
          title: "Cannot share private quiz",
          description: "Make the quiz public to share it.",
          variant: "danger",
        })
      }
      setIsShareLoading(false)
    }, 500) // Simulate a short delay for better UX
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-start space-x-2 bg-muted p-2 rounded-md overflow-x-auto">
        {/* Public/Private Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isPublic ? "secondary" : "destructive"}
                size="sm"
                onClick={togglePublic}
                disabled={isPublicLoading}
                className="transition-all duration-300 w-[100px] justify-center"
              >
                {isPublicLoading ? (
                  <span className="loader"></span>
                ) : (
                  <>
                    <Eye className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">{isPublic ? "Public" : "Private"}</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isPublic ? "Public" : "Private"} - Click to {isPublic ? "make private" : "make public"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Favorite/Unfavorite Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isFavorite ? "link" : "secondary"}
                size="sm"
                onClick={toggleFavorite}
                disabled={isFavoriteLoading}
                className="transition-all duration-300 w-[100px] justify-center"
              >
                {isFavoriteLoading ? (
                  <span className="loader"></span>
                ) : (
                  <>
                    <Star className={`h-4 w-4 md:mr-2 ${isFavorite ? "fill-current" : ""}`} />
                    <span className="hidden md:inline">{isFavorite ? "Favorited" : "Favorite"}</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isFavorite ? "Favorited" : "Favorite"} - Click to{" "}
                {isFavorite ? "remove from favorites" : "add to favorites"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Share Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={isShareLoading}
                className="transition-all duration-300 w-[100px] justify-center"
              >
                {isShareLoading ? (
                  <span className="loader"></span>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Share</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share - Click to copy share link</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* PDF Download Button (PRO only) */}
        {subscriptionStatus?.subscriptionPlan === "PRO" && !isLoading && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <QuizPDFDownload quizData={data} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Download - Click to download as PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleteLoading}
              className="transition-all duration-300 w-[100px] justify-center"
            >
              {isDeleteLoading ? (
                <span className="loader"></span>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Delete</span>
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your quiz and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Rating value={rating} onValueChange={handleRatingChange} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Rate this quiz</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  )
}

