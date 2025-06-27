"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/tailwindUtils"
import { 
  Eye, EyeOff, Star, Trash2, Settings, Share2, 
  Download, HelpCircle, LoaderCircle, Heart,
  Lock, Shield, FileText, MessageSquare, ThumbsUp
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import { Rating } from "@/components/ui/rating"
import { motion, AnimatePresence } from "framer-motion"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
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

// Animation variants for smoother UI feedback
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
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
  const [showFeedback, setShowFeedback] = useState<string | null>(null)
  const router = useRouter()
  const { data: subscriptionData, isSubscribedToAnyPaidPlan } = useSubscription()
  const canDownloadPDF = isSubscribedToAnyPaidPlan
  const isOwner = userId === ownerId

  // Clear feedback message after animation completes
  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => setShowFeedback(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [showFeedback])

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
    if (field === "isPublic" && !isOwner) return toast({ 
      title: "Permission denied", 
      description: "Only the quiz owner can change visibility", 
      variant: "destructive" 
    })

    try {
      if (field === "isPublic") setIsPublicLoading(true)
      if (field === "isFavorite") setIsFavoriteLoading(true)

      const response = await fetch(`/api/quizzes/common/${quizSlug}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) throw new Error("Failed to update quiz")

      field === "isPublic" ? setIsPublic(value) : setIsFavorite(value)
      
      // Show temporary feedback message
      setShowFeedback(field === "isPublic" 
        ? (value ? "Made public" : "Made private") 
        : (value ? "Added to favorites" : "Removed from favorites"))
      
      // Enhanced feedback with specific messaging and icons
      if (field === "isPublic") {
        toast({ 
          title: value ? "Quiz is now public" : "Quiz is now private", 
          description: value 
            ? "Anyone can now view this quiz" 
            : "Only you can now view this quiz",
          variant: "default"
        })
      } else {
        toast({ 
          title: value ? "Added to favorites" : "Removed from favorites", 
          description: value 
            ? "Quiz added to your favorites" 
            : "Quiz removed from your favorites",
          variant: "default"
        })
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: `Failed to update ${field === "isPublic" ? "visibility" : "favorite status"}: ${error.message}`, 
        variant: "destructive" 
      })
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
      
      setShowFeedback("Rating submitted")
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
      const quizTitle = data?.title || "Quiz";
      
      if (navigator.share) {
        await navigator.share({ 
          title: `Quiz: ${quizTitle}`, 
          url: shareUrl 
        })
        
        setShowFeedback("Shared successfully")
        toast({ 
          title: "Shared successfully", 
          description: "Quiz shared through your device's share menu",
          variant: "default" 
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        
        setShowFeedback("Link copied")
        toast({ 
          title: "Link copied", 
          description: `Link to "${quizTitle}" copied to clipboard`, 
          variant: "default"
        })
      }
    } catch (error) {
      console.error("Share error:", error)
      toast({ 
        title: "Sharing failed", 
        description: "Unable to share this quiz. Please try again.",
        variant: "destructive"
      })
    }
  }
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("w-full max-w-2xl mx-auto my-6 space-y-4", className)}>
        <motion.div 
          className="flex flex-col gap-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Group owner actions separately with a label and improved visuals */}
          {isOwner && (
            <motion.section
              className="p-5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 shadow-sm"
              variants={itemVariants}
              role="region"
              aria-labelledby="owner-actions-heading"
            >
              <h2 
                id="owner-actions-heading"
                className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-3"
              >
                <Shield className="h-4 w-4 mr-1" aria-hidden="true" />
                Owner Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button 
                      onClick={() => updateQuiz("isPublic", !isPublic)} 
                      disabled={isPublicLoading} 
                      className={cn(
                        "btn flex items-center gap-2 transition-all rounded-md px-4 py-2 border",
                        isPublic 
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30" 
                          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30",
                        isPublicLoading && "opacity-70 cursor-wait"
                      )}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      aria-live="polite"
                      // Improved keyboard focus indication
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          updateQuiz("isPublic", !isPublic);
                        }
                      }}
                    >
                      {isPublicLoading ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : isPublic ? (
                        <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                      ) : (
                        <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" />
                      )}
                      <span>{isPublic ? "Make Private" : "Make Public"}</span>
                      {showFeedback === "Made public" && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="ml-2 text-xs bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-300 px-1.5 py-0.5 rounded-full"
                        >
                          ✓
                        </motion.span>
                      )}
                      {showFeedback === "Made private" && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="ml-2 text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded-full"
                        >
                          ✓
                        </motion.span>
                      )}
                      <VisuallyHidden>
                        {isPublic ? "This quiz is currently public. Click to make it private." : "This quiz is currently private. Click to make it public."}
                      </VisuallyHidden>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-center max-w-[200px]">
                    {isPublic 
                      ? "Make this quiz private (only accessible by you)" 
                      : "Make this quiz public (visible to everyone)"}
                  </TooltipContent>
                </Tooltip>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button 
                          className="btn text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500/20 rounded-md px-4 py-2 border"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          aria-label="Delete this quiz"
                          // Improved keyboard focus indication
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              // AlertDialog will handle the rest
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Delete
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Permanently delete this quiz
                      </TooltipContent>
                    </Tooltip>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete the quiz and cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete} 
                        disabled={isDeleteLoading}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      >
                        {isDeleteLoading ? (
                          <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            Deleting...
                          </>
                        ) : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.section>
          )}

          {/* User actions accessible to everyone with improved visuals */}
          <motion.section
            variants={itemVariants}
            className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg"
            role="region"
            aria-label="Quiz actions"
          >
            <h2 className="sr-only">Quiz Actions</h2>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button 
                    onClick={() => updateQuiz("isFavorite", !isFavorite)} 
                    disabled={isFavoriteLoading} 
                    className={cn(
                      "flex items-center gap-2 rounded-md px-4 py-2 border shadow-sm transition-all",
                      isFavorite 
                        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300" 
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                      isFavoriteLoading && "opacity-70 cursor-wait"
                    )}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    aria-pressed={isFavorite}
                    // Improved keyboard focus indication
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updateQuiz("isFavorite", !isFavorite);
                      }
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isFavoriteLoading ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <motion.div
                          key={isFavorite ? "favorite" : "unfavorite"}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Star className={cn("mr-2 h-4 w-4", isFavorite ? "fill-yellow-500 text-yellow-500" : "")} aria-hidden="true" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <span>{isFavorite ? "Unfavorite" : "Favorite"}</span>
                    {showFeedback === "Added to favorites" && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-300 px-1.5 py-0.5 rounded-full"
                      >
                        ✓
                      </motion.span>
                    )}
                    {showFeedback === "Removed from favorites" && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="ml-2 text-xs bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded-full"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isFavorite ? "Remove from favorites" : "Add to your favorites"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button 
                    onClick={handleShare} 
                    className="flex items-center gap-2 rounded-md px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Share this quiz"
                    // Improved keyboard focus indication
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleShare();
                      }
                    }}
                  >
                    <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Share</span>
                    {showFeedback === "Link copied" && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="ml-2 text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded-full"
                      >
                        Copied
                      </motion.span>
                    )}
                    {showFeedback === "Shared successfully" && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="ml-2 text-xs bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-300 px-1.5 py-0.5 rounded-full"
                      >
                        Shared
                      </motion.span>
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Share this quiz with others
                </TooltipContent>
              </Tooltip>

              <Dialog>
                <DialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button 
                        className="flex items-center gap-2 rounded-md px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        aria-label="Rate this quiz"
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>Rate</span>
                        {showFeedback === "Rating submitted" && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="ml-2 text-xs bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-300 px-1.5 py-0.5 rounded-full"
                          >
                            Submitted
                          </motion.span>
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Rate this quiz
                    </TooltipContent>
                  </Tooltip>
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

              {canDownloadPDF && data && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-block"
                    >
                      <QuizPDFDownload 
                        quizData={data} 
                        config={{ 
                          showOptions: true, 
                          showAnswerSpace: true, 
                          answerSpaceHeight: 40, 
                          showAnswers: true 
                        }}
                      />
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Download this quiz as a PDF
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            
            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {isOwner && (
                <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
                  Owner
                </Badge>
              )}
              {isPublic ? (
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                  <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  <Lock className="h-3 w-3 mr-1" aria-hidden="true" />
                  Private
                </Badge>
              )}
              {isFavorite && (
                <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
                  <Star className="h-3 w-3 mr-1 fill-yellow-500" aria-hidden="true" />
                  Favorite
                </Badge>
              )}
              {quizType && (
                <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  <FileText className="h-3 w-3 mr-1" aria-hidden="true" />
                  {quizType === "mcq" ? "Multiple Choice" : 
                   quizType === "openended" ? "Open Ended" : 
                   quizType === "fill-blanks" ? "Fill in Blanks" : 
                   quizType === "code" ? "Code" : 
                   quizType}
                </Badge>
              )}
            </div>
          </motion.section>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}

export default QuizActions
