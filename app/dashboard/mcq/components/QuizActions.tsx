"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Star, Trash2, Share2 } from "lucide-react"
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

interface QuizActionsToolbarProps {
  quizId: string
  quizSlug: string
  initialIsPublic: boolean
  initialIsFavorite: boolean
  userId: string
  ownerId: string
}

export function QuizActions({
  quizId,
  quizSlug,
  initialIsPublic,
  initialIsFavorite,
  userId,
  ownerId,
}: QuizActionsToolbarProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isShareLoading, setIsShareLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchQuizState = async () => {
      try {
        const response = await fetch(`/api/quiz/${quizSlug}`)
        if (response.ok) {
          const quizData = await response.json()
          setIsPublic(quizData.isPublic)
          setIsFavorite(quizData.isFavorite)
        }
      } catch (error) {
        console.error("Error fetching quiz state:", error)
      }
    }

    fetchQuizState()
  }, [quizSlug])

  if (userId !== ownerId) {
    return null
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
        const shareUrl = `${window.location.origin}/dashboard/openended/${quizSlug}`
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
      className="flex flex-wrap items-center gap-2 mb-5 mt-5 p-3 bg-card rounded-lg shadow-md"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isPublic ? "default" : "secondary"}
              size="sm"
              onClick={togglePublic}
              disabled={isPublicLoading}
              className={`w-28 transition-all duration-300 ${
                isPublic
                  ? "bg-green-500 hover:bg-green-600 active:bg-green-700"
                  : "bg-gray-500 hover:bg-gray-600 active:bg-gray-700"
              }`}
            >
              {isPublicLoading ? (
                <span className="loader"></span>
              ) : (
                <>
                  {isPublic ? (
                    <Eye className="mr-2 h-4 w-4 text-white" />
                  ) : (
                    <EyeOff className="mr-2 h-4 w-4 text-white" />
                  )}
                  <span className="font-medium text-white">{isPublic ? "Public" : "Private"}</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPublic ? "Make quiz private" : "Make quiz public"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isFavorite ? "default" : "secondary"}
              size="sm"
              onClick={toggleFavorite}
              disabled={isFavoriteLoading}
              className={`w-28 transition-all duration-300 ${
                isFavorite
                  ? "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700"
                  : "bg-gray-500 hover:bg-gray-600 active:bg-gray-700"
              }`}
            >
              {isFavoriteLoading ? (
                <span className="loader"></span>
              ) : (
                <>
                  <Star className={`mr-2 h-4 w-4 ${isFavorite ? "fill-white text-white" : "text-white"}`} />
                  <span className="font-medium text-white">{isFavorite ? "Favorited" : "Favorite"}</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              disabled={isShareLoading}
              className="w-28 transition-all duration-300 hover:bg-gray-100 active:bg-gray-200"
            >
              {isShareLoading ? (
                <span className="loader"></span>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  <span className="font-medium">Share</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy share link</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleteLoading}
            className="w-28 transition-all duration-300 hover:bg-red-600 active:bg-red-700 ml-auto"
          >
            {isDeleteLoading ? (
              <span className="loader"></span>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                <span className="font-medium">Delete</span>
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
    </motion.div>
  )
}

