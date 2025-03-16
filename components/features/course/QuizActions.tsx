"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, EyeOff, Star, Trash2, Settings, X, Download } from "lucide-react"
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
import { useMediaQuery } from "@/hooks/use-media-query"
import { motion, AnimatePresence } from "framer-motion"
import useSubscriptionStore from "@/store/useSubscriptionStore"

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
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  alwaysVisible?: boolean
}

// Component to handle PDF download
const QuizPDFDownload = ({ quizData, config, className, children }: any) => {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!quizData) return

    setIsDownloading(true)
    try {
      // Simulate PDF download
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "PDF Downloaded",
        description: "Your quiz PDF has been downloaded successfully",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error downloading the PDF",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button onClick={handleDownload} className={className} disabled={isDownloading}>
      {isDownloading ? (
        <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </Button>
  )
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
  alwaysVisible = false,
}: QuizActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [data, setData] = useState<any | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [lastInteraction, setLastInteraction] = useState(Date.now())
  const router = useRouter()
  const { canDownloadPDF } = useSubscriptionStore()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const fabRef = useRef<HTMLDivElement>(null)
  const visibilityTimeoutRef = useRef<number | null>(null)

  const pdfConfig = {
    showOptions: true,
    showAnswerSpace: true,
    answerSpaceHeight: 40,
    showAnswers: true,
  }

  const isOwner = userId === ownerId

  // Position mapping
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  }

  // Reset visibility timer
  const resetVisibilityTimer = useCallback(() => {
    setIsVisible(true)

    if (visibilityTimeoutRef.current) {
      window.clearTimeout(visibilityTimeoutRef.current)
    }

    if (!alwaysVisible && !isOpen) {
      visibilityTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false)
      }, 5000)
    }
  }, [alwaysVisible, isOpen])

  // Handle user activity
  useEffect(() => {
    const handleActivity = () => {
      setLastInteraction(Date.now())
      resetVisibilityTimer()
    }

    // Add event listeners for user activity
    window.addEventListener("scroll", handleActivity, { passive: true })
    window.addEventListener("mousemove", handleActivity)
    window.addEventListener("keydown", handleActivity)
    window.addEventListener("click", handleActivity)
    window.addEventListener("touchstart", handleActivity)

    // Initial setup
    handleActivity()

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleActivity)
      window.removeEventListener("mousemove", handleActivity)
      window.removeEventListener("keydown", handleActivity)
      window.removeEventListener("click", handleActivity)
      window.removeEventListener("touchstart", handleActivity)

      if (visibilityTimeoutRef.current) {
        window.clearTimeout(visibilityTimeoutRef.current)
      }
    }
  }, [resetVisibilityTimer])

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsDeleteLoading(false)
    }
  }

  // Show FAB when user hovers near it
  const handleShowFab = () => {
    if (!isVisible) {
      setIsVisible(true)
      resetVisibilityTimer()
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

      <AnimatePresence>
        {(isVisible || alwaysVisible || isOpen) && (
          <motion.div
            ref={fabRef}
            className={cn("fixed z-50", positionClasses[position], className)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { type: "spring", stiffness: 300, damping: 25 },
            }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            whileHover={{ scale: isOpen ? 1 : 1.05 }}
          >
            {!isOpen ? (
              <motion.button
                onClick={() => setIsOpen(true)}
                className={cn(
                  "h-12 w-12 rounded-full",
                  customBgColor,
                  customTextColor,
                  "shadow-lg hover:shadow-xl transition-all duration-200",
                  "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  "flex items-center justify-center",
                )}
                whileTap={{ scale: 0.95 }}
                aria-label="Open quiz settings"
              >
                {icon || <Settings className="h-5 w-5" />}
              </motion.button>
            ) : (
              <motion.div
                className={cn(
                  "bg-card/95 backdrop-blur-md border rounded-xl shadow-lg",
                  "p-4 w-[280px] md:w-[320px] max-h-[90vh] overflow-y-auto",
                )}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-sm font-medium text-card-foreground">Quiz Actions</h3>
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

                  <TooltipProvider delayDuration={200}>
                    <div className="flex flex-col gap-3 w-full">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={togglePublic}
                            disabled={!isOwner || isPublicLoading}
                            className={cn(
                              "h-10 w-full rounded-lg flex items-center justify-between px-3",
                              "focus:ring-2 focus:ring-offset-1",
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
                              <>
                                <Eye className="h-5 w-5" />
                                <span>Public</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-5 w-5" />
                                <span>Private</span>
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs py-1 px-2">
                          {!isOwner
                            ? "Only owner can change visibility"
                            : isPublic
                              ? "Click to make private"
                              : "Click to make public"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={toggleFavorite}
                            disabled={isFavoriteLoading}
                            className={cn(
                              "h-10 w-full rounded-lg flex items-center justify-between px-3",
                              "focus:ring-2 focus:ring-offset-1",
                              isFavorite
                                ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:hover:bg-yellow-900/60"
                                : "bg-muted text-muted-foreground hover:bg-muted/80",
                            )}
                            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            {isFavoriteLoading ? (
                              <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Star className={cn("h-5 w-5", isFavorite ? "fill-yellow-500" : "")} />
                                <span>{isFavorite ? "Favorited" : "Add to favorites"}</span>
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs py-1 px-2">
                          {isFavorite ? "Remove from favorites" : "Add to favorites"}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex flex-col gap-3 w-full mt-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-10 w-full">
                            <QuizPDFDownload
                              quizData={data}
                              config={pdfConfig}
                              className={cn(
                                "h-10 w-full rounded-lg flex items-center justify-between px-3",
                                "bg-purple-100 text-purple-600 hover:bg-purple-200",
                                "dark:bg-purple-900/40 dark:text-purple-400 dark:hover:bg-purple-900/60",
                                "focus:ring-2 focus:ring-offset-1 shadow-sm hover:shadow transition-all",
                                !canDownloadPDF() && "opacity-60 cursor-not-allowed",
                              )}
                            >
                              <Download className="h-5 w-5" />
                              <span>Download PDF</span>
                            </QuizPDFDownload>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs py-1 px-2">
                          {canDownloadPDF() ? "Download as PDF" : "Upgrade to download PDF"}
                        </TooltipContent>
                      </Tooltip>

                      <Dialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-10 w-full rounded-lg flex items-center justify-between px-3",
                                  "bg-amber-100 text-amber-600 hover:bg-amber-200",
                                  "dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60",
                                  "relative focus:ring-2 focus:ring-offset-1",
                                )}
                                aria-label="Rate this quiz"
                              >
                                <Star className="h-5 w-5 fill-amber-500" />
                                <span>Rate Quiz {rating ? `(${rating})` : ""}</span>
                              </Button>
                            </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs py-1 px-2">
                            Rate this quiz
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

                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                disabled={!isOwner || isDeleteLoading}
                                className={cn(
                                  "h-10 w-full rounded-lg flex items-center justify-between px-3",
                                  "bg-red-100 text-red-600 hover:bg-red-200",
                                  "dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60",
                                  "focus:ring-2 focus:ring-offset-1",
                                  !isOwner && "opacity-60 cursor-not-allowed",
                                )}
                                aria-label="Delete quiz"
                              >
                                {isDeleteLoading ? (
                                  <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-5 w-5" />
                                    <span>Delete Quiz</span>
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs py-1 px-2">
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger area to show FAB when hidden */}
      {!isVisible && !alwaysVisible && (
        <div
          className={cn("fixed z-40 w-16 h-16", positionClasses[position])}
          onMouseEnter={handleShowFab}
          onClick={handleShowFab}
          aria-hidden="true"
        />
      )}
    </>
  )
}

export default QuizActions

