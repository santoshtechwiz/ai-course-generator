"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, Star, Trash2, Share2, Facebook, Linkedin, Twitter, Copy } from "lucide-react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

  const handleShare = async (platform: "facebook" | "twitter" | "linkedin" | "copy") => {
    if (!isPublic) {
      toast({
        title: "Cannot share private quiz",
        description: "Make the quiz public to share it.",
        variant: "destructive",
      })
      return
    }

    setIsShareLoading(true)
    const shareUrl = `${window.location.origin}/dashboard/${quizType}/${quizSlug}`

    try {
      switch (platform) {
        case "facebook":
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")
          break
        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Check out this quiz!")}`,
            "_blank",
          )
          break
        case "linkedin":
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank")
          break
        case "copy":
          await navigator.clipboard.writeText(shareUrl)
          toast({
            title: "Share link copied",
            description: "The quiz link has been copied to your clipboard.",
          })
          break
      }
    } catch (error) {
      console.error("Error sharing quiz:", error)
      toast({
        title: "Error",
        description: "Failed to share quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsShareLoading(false)
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
      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted p-4 rounded-lg">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isPublic ? "secondary" : "destructive"}
                size="sm"
                onClick={togglePublic}
                disabled={isPublicLoading}
              >
                {isPublicLoading ? (
                  <span className="loader"></span>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {isPublic ? "Public" : "Private"}
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
              >
                {isFavoriteLoading ? (
                  <span className="loader"></span>
                ) : (
                  <>
                    <Star className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                    {isFavorite ? "Favorited" : "Favorite"}
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
                  <Button variant="outline" size="sm" disabled={isShareLoading}>
                    {isShareLoading ? (
                      <span className="loader"></span>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleShare("facebook")}>
                    <Facebook className="mr-2 h-4 w-4" />
                    <span>Facebook</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("twitter")}>
                    <Twitter className="mr-2 h-4 w-4" />
                    <span>Twitter</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("linkedin")}>
                    <Linkedin className="mr-2 h-4 w-4" />
                    <span>LinkedIn</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("copy")}>
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Copy Link</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share - Click to open sharing options</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <QuizPDFDownload quizData={data} config={pdfConfig} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Download - Click to download as PDF</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleteLoading}>
              {isDeleteLoading ? (
                <span className="loader"></span>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
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
              <div className="flex items-center justify-center">
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

