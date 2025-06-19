"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/tailwindUtils"
import { Eye, EyeOff, Star, Trash2, Settings, Share2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Rating } from "@/components/ui/rating"
import QuizPDFDownload from "@/app/dashboard/create/components/QuizPDFDownload"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import type { QuizType } from "@/app/types/quiz-types"
import useSubscription from "@/hooks/use-subscription"

interface QuizActionsProps {
  quizId: string
  quizSlug: string
  initialIsPublic: boolean
  initialIsFavorite: boolean
  userId: string
  ownerId: string
  quizType?: QuizType
  className?: string
  children?: React.ReactNode
}

export function QuizActions({
  quizId,
  quizSlug,
  initialIsPublic,
  initialIsFavorite,
  userId,
  ownerId,
  quizType,
  className,
  children,
}: QuizActionsProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [data, setData] = useState<any | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const router = useRouter()
  const { canDownloadPDF } = useSubscription()
  const isOwner = userId === ownerId

  useEffect(() => {
    const fetchQuizState = async () => {
      try {
        const [quizResponse, ratingResponse] = await Promise.all([
          fetch(`/api/quizzes/common/${quizSlug}`),
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

  const promptLogin = () => {
    toast({ title: "Authentication required", description: "Please log in to perform this action", variant: "destructive" })
  }

  const updateQuiz = async (field: string, value: boolean) => {
    if (!userId) return promptLogin()
    if (field === "isPublic" && !isOwner) return toast({ title: "Permission denied", description: "Only the quiz owner can change visibility", variant: "destructive" })

    try {
      if (field === "isPublic") setIsPublicLoading(true)
      if (field === "isFavorite") setIsFavoriteLoading(true)

      const response = await fetch(`/api/quizzes/common/${quizSlug}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) throw new Error("Failed to update quiz")

      field === "isPublic" ? setIsPublic(value) : setIsFavorite(value)
      toast({ title: "Success", description: `Quiz ${field === "isPublic" ? "visibility" : "favorite status"} updated` })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsPublicLoading(false)
      setIsFavoriteLoading(false)
    }
  }

  const handleRatingChange = async (value: number) => {
    if (!userId) return promptLogin()
    try {
      setRating(value)
      const res = await fetch(`/api/rating`, {
        method: "POST",
        body: JSON.stringify({ type: "quiz", id: quizId, rating: value }),
      })
      if (!res.ok) throw new Error("Failed to submit rating")
      toast({ title: "Thanks!", description: "Your rating was submitted." })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!isOwner) return toast({ title: "Permission denied", description: "Only the quiz owner can delete this quiz", variant: "destructive" })
    setIsDeleteLoading(true)
    try {
      const response = await fetch(`/api/quizzes/common/${quizSlug}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete quiz")
      router.push("/")
      toast({ title: "Deleted", description: "Quiz was deleted" })
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/quiz/${quizType || ""}/${quizSlug}`
      if (navigator.share) {
        await navigator.share({ title: `Quiz: ${data?.title || "Quiz"}`, url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({ title: "Copied", description: "Link copied to clipboard." })
      }
    } catch (error) {
      console.error("Share error:", error)
    }
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto my-6 space-y-4", className)}>
      <div className="flex flex-wrap gap-4 justify-center sm:justify-between">
        {isOwner && (
          <button onClick={() => updateQuiz("isPublic", !isPublic)} disabled={isPublicLoading} className="btn">
            {isPublic ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
            {isPublic ? "Make Private" : "Make Public"}
          </button>
        )}

        <button onClick={() => updateQuiz("isFavorite", !isFavorite)} disabled={isFavoriteLoading} className="btn">
          <Star className={cn("mr-2 h-4 w-4", isFavorite ? "fill-yellow-500 text-yellow-500" : "")}/>
          {isFavorite ? "Unfavorite" : "Favorite"}
        </button>

        <button onClick={handleShare} className="btn">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </button>

        {canDownloadPDF && data && (
          <QuizPDFDownload quizData={data} config={{ showOptions: true, showAnswerSpace: true, answerSpaceHeight: 40, showAnswers: true }} />
        )}

        <Dialog>
          <DialogTrigger asChild>
            <button className="btn">
              <Star className="mr-2 h-4 w-4" />
              Rate
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate this Quiz</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center p-4">
              <Rating value={rating} onValueChange={handleRatingChange} />
            </div>
          </DialogContent>
        </Dialog>

        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="btn text-red-600 border-red-600 hover:bg-red-100">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the quiz.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleteLoading}>
                  {isDeleteLoading ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}

export default QuizActions
