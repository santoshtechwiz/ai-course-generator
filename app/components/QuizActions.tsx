"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, Star, Trash2, Share2, Facebook, Twitter, Linkedin } from "lucide-react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"

import QuizPDFDownload from "../dashboard/course/components/QuizPDFDownload"
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
  const pdfConfig = {
    showOptions: true,
    showAnswerSpace: true,
    answerSpaceHeight: 40,
    showAnswers: true,
  }
  const isOwner = userId === ownerId

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
    if (!isPublic) {
      toast({
        title: "Cannot share private quiz",
        description: "Make the quiz public to share it.",
        variant: "danger",
      })
      return
    }

    const shareUrl = `${window.location.origin}/dashboard/${quizType}/${quizSlug}`
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Share link copied",
      description: "The quiz link has been copied to your clipboard.",
      variant: "success",
    })
  }

  const handleSocialShare = (platform: string) => {
    if (!isPublic) {
      toast({
        title: "Cannot share private quiz",
        description: "Make the quiz public to share it.",
        variant: "danger",
      })
      return
    }

    const shareUrl = `${window.location.origin}/dashboard/${quizType}/${quizSlug}`
    let shareLink = ""

    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Check out this quiz!")}`
        break
      case "linkedin":
        shareLink = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent("Check out this quiz!")}`
        break
      default:
        break
    }

    if (shareLink) {
      window.open(shareLink, "_blank")
    }
  }

  if (!isOwner) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-1 sm:gap-x-2 gap-y-2 bg-muted p-2 sm:p-4 rounded-md">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isPublic ? "secondary" : "destructive"}
                size="sm"
                onClick={togglePublic}
                disabled={isPublicLoading}
                className="w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2"
              >
                {isPublicLoading ? (
                  <span className="loader"></span>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline-block sm:ml-2">{isPublic ? "Public" : "Private"}</span>
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

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isFavorite ? "secondary" : "outline"}
                size="sm"
                onClick={toggleFavorite}
                disabled={isFavoriteLoading}
                className="w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2"
              >
                {isFavoriteLoading ? (
                  <span className="loader"></span>
                ) : (
                  <>
                    <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                    <span className="hidden sm:inline-block sm:ml-2">{isFavorite ? "Favorited" : "Favorite"}</span>
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

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2">
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline-block sm:ml-2">Share</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Copy Link</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSocialShare("facebook")}>
                    <Facebook className="mr-2 h-4 w-4" />
                    <span>Facebook</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSocialShare("twitter")}>
                    <Twitter className="mr-2 h-4 w-4" />
                    <span>Twitter</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSocialShare("linkedin")}>
                    <Linkedin className="mr-2 h-4 w-4" />
                    <span>LinkedIn</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share - Click to see sharing options</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-10 h-10 sm:w-auto sm:h-auto">
                <QuizPDFDownload quizData={data} config={pdfConfig} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download - Click to download as PDF</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleteLoading}
              className="w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2"
            >
              {isDeleteLoading ? (
                <span className="loader"></span>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline-block sm:ml-2">Delete</span>
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
              <div className="w-10 h-10 sm:w-auto sm:h-auto flex items-center justify-center">
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

