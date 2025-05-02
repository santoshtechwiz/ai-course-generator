"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/tailwindUtils"
import { Eye, EyeOff, Star, Trash2, Settings, Share2 } from "lucide-react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Rating } from "@/components/ui/rating"
import { motion } from "framer-motion"
// import { useSubscriptionStore } from "@/app/store/subscriptionStore"
import QuizPDFDownload from "@/app/dashboard/create/components/QuizPDFDownload"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { QuizType } from "@/app/types/quiz-types"
import { useSubscription } from "../../subscription/hooks/use-subscription"

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
  icon?: React.ReactNode
  backgroundColor?: string
  textColor?: string
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "left-center" | "right-center"
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
  icon,
  backgroundColor,
  textColor,
  position = "bottom-right",
}: QuizActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [data, setData] = useState<any | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [hasBeenSeen, setHasBeenSeen] = useState(false)
  const router = useRouter()
  const { canDownloadPDF } = useSubscription()
  const toolbarRef = useRef<HTMLDivElement>(null)

  const isOwner = userId === ownerId

  // Position mapping for the toolbar indicator
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "left-center": "top-1/2 -translate-y-1/2 left-4",
    "right-center": "top-1/2 -translate-y-1/2 right-4",
  }

  // Fetch quiz data
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

  // Mark as seen after 3 seconds to reduce animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasBeenSeen(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const promptLogin = () => {
    toast({
      title: "Authentication required",
      description: "Please log in to perform this action",
      variant: "destructive",
    })
  }

  const updateQuiz = async (field: string, value: boolean) => {
    if (!userId) {
      promptLogin()
      return
    }

    // Check if user is trying to change visibility but is not the owner
    if (field === "isPublic" && !isOwner) {
      toast({
        title: "Permission denied",
        description: "Only the quiz owner can change visibility settings",
        variant: "destructive",
      })
      return
    }

    try {
      setIsPublicLoading(field === "isPublic" ? true : isPublicLoading)
      setIsFavoriteLoading(field === "isFavorite" ? true : isFavoriteLoading)

      const response = await fetch(`/api/quiz/${quizSlug}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) {
        throw new Error("Failed to update quiz")
      }

      if (field === "isPublic") {
        setIsPublic(value)
      } else {
        setIsFavorite(value)
      }

      toast({
        title: "Success",
        description: `Quiz ${field === "isPublic" ? "visibility" : "favorite status"} updated`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsPublicLoading(false)
      setIsFavoriteLoading(false)
    }
  }

  const togglePublic = () => {
    updateQuiz("isPublic", !isPublic)
  }

  const toggleFavorite = () => {
    updateQuiz("isFavorite", !isFavorite)
  }

  const handleRatingChange = async (value: number) => {
    if (!userId) {
      promptLogin()
      return
    }

    try {
      setRating(value)
      const response = await fetch(`/api/rating`, {
        method: "POST",
        body: JSON.stringify({
          type: "quiz",
          id: quizId,
          rating: value,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit rating")
      }

      toast({
        title: "Success",
        description: "Thank you for rating this quiz!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!isOwner) {
      toast({
        title: "Permission denied",
        description: "Only the quiz owner can delete this quiz",
        variant: "destructive",
      })
      return
    }

    setIsDeleteLoading(true)
    try {
      const response = await fetch(`/api/quiz/${quizSlug}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete quiz")
      }

      router.push("/")
      router.refresh()

      toast({
        title: "Success",
        description: "Quiz deleted successfully",
      })
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      const shareText = `Check out this quiz: ${data?.title || "Quiz"}`
      const shareUrl = `${window.location.origin}/quiz/${quizType || ""}/${quizSlug}`

      if (navigator.share) {
        await navigator.share({
          title: `Quiz: ${data?.title || "Quiz"}`,
          text: shareText,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
        toast({
          title: "Link copied!",
          description: "Share it with your friends",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  if (!userId) {
    return <>{children}</>
  }

  // Custom styles based on props
  const customBgColor = backgroundColor || "bg-primary"
  const customTextColor = textColor || "text-primary-foreground"

  return (
    <>
      {children}

      <div ref={toolbarRef} className={cn("fixed z-40", positionClasses[position], className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full shadow-lg",
                customBgColor,
                customTextColor,
                "hover:shadow-xl transition-all duration-300",
                "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "relative overflow-hidden", // Add this for the ripple effect
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={!hasBeenSeen ? { y: [0, -5, 0] } : {}}
              transition={
                !hasBeenSeen
                  ? {
                      y: { repeat: 3, duration: 1, repeatType: "reverse" },
                      scale: { type: "spring", damping: 15, stiffness: 300 },
                    }
                  : {
                      scale: { type: "spring", damping: 15, stiffness: 300 },
                    }
              }
              aria-label="Quiz actions"
              aria-expanded={isOpen}
              aria-haspopup="true"
            >
              {icon || <Settings className="h-5 w-5" />}
              {!hasBeenSeen && (
                <span
                  className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full animate-pulse"
                  aria-hidden="true"
                />
              )}
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 p-2 rounded-lg border border-border shadow-lg animate-in fade-in-50 slide-in-from-top-5 duration-200"
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-sm font-medium">Quiz Actions</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />

            {/* Visibility Toggle */}
            {isOwner && (
              <DropdownMenuItem
                onClick={togglePublic}
                disabled={isPublicLoading}
                className="flex justify-between items-center px-2 py-2.5 rounded-md focus:bg-accent hover:bg-accent/50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  {isPublic ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                  <span>{isPublic ? "Make Private" : "Make Public"}</span>
                </div>
                {isPublicLoading && (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
              </DropdownMenuItem>
            )}

            {/* Favorite Toggle */}
            <DropdownMenuItem
              onClick={toggleFavorite}
              disabled={isFavoriteLoading}
              className="flex justify-between items-center px-2 py-2.5 rounded-md focus:bg-accent hover:bg-accent/50 transition-colors duration-200"
            >
              <div className="flex items-center">
                <Star
                  className={cn(
                    "mr-2 h-4 w-4 transition-colors duration-300",
                    isFavorite ? "fill-yellow-500 text-yellow-500" : "",
                  )}
                />
                <span>{isFavorite ? "Remove from Favorites" : "Add to Favorites"}</span>
              </div>
              {isFavoriteLoading && (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
            </DropdownMenuItem>

            {/* Share */}
            <DropdownMenuItem
              onClick={handleShare}
              className="flex items-center px-2 py-2.5 rounded-md focus:bg-accent hover:bg-accent/50 transition-colors duration-200"
            >
              <Share2 className="mr-2 h-4 w-4" />
              <span>Share Quiz</span>
            </DropdownMenuItem>

            {/* Download PDF */}
            {canDownloadPDF && (
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="flex items-center px-2 py-2.5 rounded-md focus:bg-accent hover:bg-accent/50 transition-colors duration-200"
              >
                <div className="w-full">
                  <QuizPDFDownload
                    quizData={data}
                    config={{
                      showOptions: true,
                      showAnswerSpace: true,
                      answerSpaceHeight: 40,
                      showAnswers: true,
                    }}
                  />
                </div>
              </DropdownMenuItem>
            )}

            {/* Rate Quiz */}
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="flex items-center px-2 py-2.5 rounded-md focus:bg-accent hover:bg-accent/50 transition-colors duration-200"
                >
                  <Star className="mr-2 h-4 w-4 fill-amber-500" />
                  <span>Rate Quiz {rating ? `(${rating})` : ""}</span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-lg">Rate this Quiz</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center p-4">
                  <p className="text-sm text-muted-foreground mb-4">How would you rate this quiz?</p>
                  <Rating value={rating} onValueChange={handleRatingChange} className="scale-125" />
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenuSeparator className="my-1" />

            {/* Delete Quiz */}
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 px-2 py-2.5 rounded-md focus:bg-red-50 dark:focus:bg-red-950/20 hover:bg-red-50/70 dark:hover:bg-red-950/10 transition-colors duration-200"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Quiz</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg">Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      This action cannot be undone. This will permanently delete your quiz.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-md text-sm py-1">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90 rounded-md text-sm py-1"
                    >
                      {isDeleteLoading ? (
                        <div className="flex items-center">
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Deleting...
                        </div>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Attention indicator for new users */}
        {!hasBeenSeen && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{
              repeat: 3,
              duration: 1.5,
              ease: "easeOut",
            }}
            style={{
              border: `2px solid ${backgroundColor || "var(--primary)"}`,
              boxShadow: `0 0 10px 0 ${backgroundColor || "var(--primary)"}`,
              zIndex: -1,
            }}
          />
        )}
      </div>
    </>
  )
}

export default QuizActions
