"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, EyeOff, Star, Trash2, X, ChevronDown, ChevronUp, Download } from "lucide-react"
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
import { motion, AnimatePresence } from "framer-motion"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import QuizPDFDownload from "@/app/dashboard/create/components/QuizPDFDownload"


interface QuizActionsProps {
  quizId: string
  quizSlug: string
  initialIsPublic: boolean
  initialIsFavorite: boolean
  userId: string
  ownerId: string
  quizType?: string
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
  const { canDownloadPDF } = useSubscriptionStore()
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

  if (!userId) {
    return <>{children}</>
  }

  // Custom styles based on props
  const customBgColor = backgroundColor || "bg-primary"
  const customTextColor = textColor || "text-primary-foreground"

  return (
    <>
      {children}

      <div ref={toolbarRef} className={cn("fixed z-50 flex flex-col items-end", positionClasses[position], className)}>
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="toolbar"
              className="w-full mb-2 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 w-full max-w-[280px] ml-auto">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Quiz Actions</h3>
                    {!isOwner && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">Some actions limited to owner</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-7 w-7 rounded-full hover:bg-muted"
                      aria-label="Close quiz settings"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <TooltipProvider delayDuration={0}>
                    <div className="grid grid-cols-5 gap-2">
                      {/* Public/Private Toggle */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={togglePublic}
                            disabled={!isOwner || isPublicLoading}
                            className={cn(
                              "h-12 w-12 rounded-full flex items-center justify-center",
                              isPublic
                                ? "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400 dark:hover:bg-green-900/60"
                                : "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60",
                              !isOwner && "opacity-60 cursor-not-allowed",
                            )}
                            aria-label={isPublic ? "Make quiz private" : "Make quiz public"}
                          >
                            {isPublicLoading ? (
                              <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isPublic ? (
                              <Eye className="h-5 w-5" />
                            ) : (
                              <EyeOff className="h-5 w-5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs py-1 px-2">
                          {!isOwner
                            ? "Only the quiz owner can change visibility"
                            : isPublic
                              ? "Make quiz private (only you can see it)"
                              : "Make quiz public (anyone can see it)"}
                        </TooltipContent>
                      </Tooltip>

                      {/* Favorite Toggle */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={toggleFavorite}
                            disabled={isFavoriteLoading}
                            className={cn(
                              "h-12 w-12 rounded-full flex items-center justify-center",
                              isFavorite
                                ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:hover:bg-yellow-900/60"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
                            )}
                            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            {isFavoriteLoading ? (
                              <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Star className={cn("h-5 w-5", isFavorite ? "fill-yellow-500" : "")} />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs py-1 px-2">
                          {isFavorite ? "Remove from favorites" : "Add to favorites"}
                        </TooltipContent>
                      </Tooltip>

                      {/* Download PDF */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <div>
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
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs py-1 px-2">
                          {canDownloadPDF() ? "Download as PDF" : "Upgrade to download PDF"}
                        </TooltipContent>
                      </Tooltip>

                      {/* Rate Quiz */}
                      <Dialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-12 w-12 rounded-full flex items-center justify-center",
                                  "bg-amber-100 text-amber-600 hover:bg-amber-200",
                                  "dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60",
                                )}
                                aria-label="Rate this quiz"
                              >
                                <Star className="h-5 w-5 fill-amber-500" />
                              </Button>
                            </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs py-1 px-2">
                            Rate this quiz {rating ? `(${rating})` : ""}
                          </TooltipContent>
                        </Tooltip>
                        <DialogContent className="sm:max-w-md rounded-lg">
                          <DialogHeader>
                            <DialogTitle className="text-lg">Rate this Quiz</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center p-4">
                            <Rating value={rating} onValueChange={handleRatingChange} className="scale-125" />
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Delete Quiz */}
                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                disabled={!isOwner || isDeleteLoading}
                                className={cn(
                                  "h-12 w-12 rounded-full flex items-center justify-center",
                                  "bg-red-100 text-red-600 hover:bg-red-200",
                                  "dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60",
                                  !isOwner && "opacity-60 cursor-not-allowed",
                                )}
                                aria-label="Delete quiz"
                              >
                                {isDeleteLoading ? (
                                  <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="h-5 w-5" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs py-1 px-2">
                            {!isOwner ? "Only owner can delete" : "Delete quiz"}
                          </TooltipContent>
                        </Tooltip>
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
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TooltipProvider>
                </div>
              </div>
            </motion.div>
          ) : null}

          {/* Toolbar indicator button */}
          <motion.div
            key="indicator"
            className={cn("flex flex-col items-center", isOpen ? "mb-0" : "mb-0")}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              disabled={isPublicLoading || isFavoriteLoading || isDeleteLoading}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full shadow-lg",
                customBgColor,
                customTextColor,
                "hover:shadow-xl transition-all duration-200",
                "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                (isPublicLoading || isFavoriteLoading || isDeleteLoading) && "opacity-70",
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={!hasBeenSeen && !isOpen ? { y: [0, -5, 0] } : {}}
              transition={
                !hasBeenSeen && !isOpen
                  ? {
                      y: { repeat: 3, duration: 1, repeatType: "reverse" },
                      scale: { type: "spring", damping: 15, stiffness: 300 },
                    }
                  : {
                      scale: { type: "spring", damping: 15, stiffness: 300 },
                    }
              }
              aria-label={isOpen ? "Close quiz settings" : "Open quiz settings"}
            >
              <span className="font-medium">Quiz Settings</span>
              {isPublicLoading || isFavoriteLoading || isDeleteLoading ? (
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </motion.button>

            {/* Attention indicator for new users */}
            {!hasBeenSeen && !isOpen && (
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
                  zIndex: -1,
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}

export default QuizActions

