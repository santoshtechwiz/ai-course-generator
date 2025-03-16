"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, EyeOff, Star, Trash2, Settings, X } from "lucide-react"
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
import QuizPDFDownload from "./features/course/QuizPDFDownload"

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
  const [isPulsing, setIsPulsing] = useState(true)
  const router = useRouter()
  const { canDownloadPDF } = useSubscriptionStore()
  const fabRef = useRef<HTMLDivElement>(null)

  const isOwner = userId === ownerId

  // Position mapping
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

  // Stop pulsing animation after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPulsing(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node) && isOpen) {
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
    if (!isOwner) {
      toast({
        title: "Permission denied",
        description: "Only the quiz owner can change visibility settings",
        variant: "destructive",
      })
      return
    }
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

      <div ref={fabRef} className={cn("fixed z-50", positionClasses[position], className)}>
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: isPulsing ? [1, 1.1, 1] : 1,
                rotate: isPulsing ? [0, -5, 5, -5, 0] : 0,
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 0.3,
                scale: {
                  repeat: isPulsing ? Number.POSITIVE_INFINITY : 0,
                  repeatType: "reverse",
                  duration: isPulsing ? 1.5 : 0.3,
                },
                rotate: {
                  repeat: isPulsing ? Number.POSITIVE_INFINITY : 0,
                  repeatDelay: 3,
                  duration: isPulsing ? 0.5 : 0.3,
                },
              }}
            >
              <motion.button
                onClick={() => setIsOpen(true)}
                className={cn(
                  "h-14 w-14 rounded-full",
                  customBgColor,
                  customTextColor,
                  "shadow-lg hover:shadow-xl transition-all duration-200",
                  "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  "flex items-center justify-center",
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Open quiz settings"
              >
                {icon || <Settings className="h-6 w-6" />}
              </motion.button>

              {/* Attention ring animation */}
              {isPulsing && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.5 }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
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
          ) : (
            <motion.div
              key="menu"
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 w-[280px]"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Quiz Actions</h3>
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
                        {!isOwner ? "Only owner can change visibility" : isPublic ? "Make private" : "Make public"}
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
                          <QuizPDFDownload
                            quizData={data}
                            config={{
                              showOptions: true,
                              showAnswerSpace: true,
                              answerSpaceHeight: 40,
                              showAnswers: true,
                            }}
                          ></QuizPDFDownload>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export default QuizActions

