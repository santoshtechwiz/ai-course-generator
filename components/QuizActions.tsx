'use client'
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Eye,
  EyeOff,
  Star,
  Trash2,
  Share2,
  FileDown,
  Lock,
  Facebook,
  Twitter,
  Linkedin,
  Settings,
  X,
} from "lucide-react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Rating } from "@/components/ui/rating"

import useSubscriptionStore from "@/store/useSubscriptionStore"

import QuizPDFDownload from "./features/course/QuizPDFDownload"

declare global {
  interface Window {
    scrollTimeout: number
  }
}

interface FloatingQuizToolbarProps {
  quizId: string
  quizSlug: string
  initialIsPublic: boolean
  initialIsFavorite: boolean
  userId: string
  ownerId: string
  quizType?: string
  className?: string
  children?: React.ReactNode
}

const shadowPulse = "shadow-md hover:shadow-lg transition-shadow duration-200"

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
}: FloatingQuizToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isScrolling, setIsScrolling] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [data, setData] = useState<any | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const router = useRouter()
  const { subscriptionStatus, canDownloadPDF, isLoading } = useSubscriptionStore()

  const pdfConfig = {
    showOptions: true,
    showAnswerSpace: true,
    answerSpaceHeight: 40,
    showAnswers: true,
  }

  const isOwner = userId === ownerId

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (Math.abs(currentScrollY - lastScrollY) > 10) {
        setIsVisible(false)
        setIsOpen(false)
        setIsScrolling(true)
        if (window.scrollTimeout) {
          clearTimeout(window.scrollTimeout)
        }
        window.scrollTimeout = setTimeout(() => {
          setIsScrolling(false)
          setIsVisible(true)
        }, 1000)
      }
      setLastScrollY(currentScrollY)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX < 100 && !isVisible) {
        setIsVisible(true)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("mousemove", handleMouseMove)

    const visibilityInterval = setInterval(() => {
      if (!isVisible && !isScrolling) {
        setIsVisible(true)
      }
    }, 5000)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
      clearInterval(visibilityInterval)
      if (window.scrollTimeout) {
        clearTimeout(window.scrollTimeout)
      }
    }
  }, [lastScrollY, isVisible, isScrolling])

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

  const handleShare = () => {
    if (!userId) {
      promptLogin()
      return
    }

    navigator.clipboard.writeText(`${window.location.origin}/quiz/${quizSlug}`).then(() => {
      toast({
        title: "Copied!",
        description: "Quiz link copied to clipboard.",
      })
    })
  }

  const handleSocialShare = (platform: string) => {
    let url = ""
    const shareUrl = `${window.location.origin}/quiz/${quizSlug}`

    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`
        break
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      default:
        break
    }

    window.open(url, "_blank")
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
          type: 'quiz',
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

  if (!userId) {
    return <>{children}</>
  }

  return (
    <>
      {children}

      <div
        className={cn(
          "fixed left-4 top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ease-in-out",
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20 pointer-events-none",
          isScrolling && !isVisible ? "animate-pulse" : "",
          className,
        )}
      >
        {!isOpen && !isVisible && (
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-16 bg-primary/60 rounded-full animate-pulse transition-all duration-300" />
        )}
        {!isOpen ? (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsOpen(true)}
            className={cn(
              "h-12 w-12 rounded-full bg-primary text-primary-foreground",
              shadowPulse,
              "hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "transition-all duration-200 ease-in-out"
            )}
            aria-label="Open quiz settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        ) : (
          <div className={cn(
            "bg-background/95 backdrop-blur-md border rounded-xl",
            shadowPulse,
            "p-4 w-[100px] animate-in slide-in-from-left duration-300 ease-in-out"
          )}>
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 rounded-full self-end hover:bg-gray-200 dark:hover:bg-gray-800 focus:ring-2 focus:ring-gray-400"
                aria-label="Close quiz settings"
              >
                <X className="h-4 w-4" />
              </Button>

              <TooltipProvider delayDuration={200}>
                <div className="flex flex-col items-center gap-2 w-full">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Manage</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={togglePublic}
                        disabled={!isOwner || isPublicLoading}
                        className={cn(
                          "h-12 w-12 rounded-xl",
                          shadowPulse,
                          "focus:ring-2 focus:ring-offset-1",
                          isPublic
                            ? "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400"
                            : "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400",
                          !isOwner && "opacity-60 cursor-not-allowed"
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
                    <TooltipContent side="right" className="text-sm py-1.5 px-2">
                      {!isOwner
                        ? "Only owner can change visibility"
                        : isPublic
                          ? "Public - Click to make private"
                          : "Private - Click to make public"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFavorite}
                        disabled={isFavoriteLoading}
                        className={cn(
                          "h-12 w-12 rounded-xl",
                          shadowPulse,
                          "focus:ring-2 focus:ring-offset-1",
                          isFavorite
                            ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800/60 dark:text-gray-400"
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
                    <TooltipContent side="right" className="text-sm py-1.5 px-2">
                      {isFavorite ? "Remove from favorites" : "Add to favorites"}
                    </TooltipContent>
                  </Tooltip>
                </div>

                <Separator className="my-2 w-16 bg-gray-200 dark:bg-gray-700/50" />

                <div className="flex flex-col items-center gap-2 w-full">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Share</span>
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-12 w-12 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200",
                              "dark:bg-blue-900/40 dark:text-blue-400 dark:hover:bg-blue-900/60",
                              shadowPulse,
                              "focus:ring-2 focus:ring-offset-1"
                            )}
                            aria-label="Share quiz options"
                          >
                            <Share2 className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-sm py-1.5 px-2">
                        Share quiz
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent side="right" align="start" className="w-48 rounded-lg shadow-lg">
                      <DropdownMenuItem onClick={handleShare} className="py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Share2 className="mr-2 h-4 w-4" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSocialShare("facebook")}
                        className="py-1.5 text-sm text-[#1877F2] hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Facebook className="mr-2 h-4 w-4" />
                        Facebook
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSocialShare("twitter")}
                        className="py-1.5 text-sm text-[#1DA1F2] hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Twitter className="mr-2 h-4 w-4" />
                        Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSocialShare("linkedin")}
                        className="py-1.5 text-sm text-[#0A66C2] hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Linkedin className="mr-2 h-4 w-4" />
                        LinkedIn
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <QuizPDFDownload
                        quizData={data}
                        config={pdfConfig}
                        canDownloadPDF={canDownloadPDF}
                        
                      ></QuizPDFDownload>
                        
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-sm py-1.5 px-2">
                      {canDownloadPDF() ? "Download as PDF" : "Upgrade to download PDF"}
                    </TooltipContent>
                  </Tooltip>
                </div>

                <Separator className="my-2 w-16 bg-gray-200 dark:bg-gray-700/50" />

                <div className="flex flex-col items-center gap-2 w-full">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Actions</span>
                  <Dialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-12 w-12 rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-200",
                              "dark:bg-amber-900/40 dark:text-amber-400 relative",
                              shadowPulse,
                              "focus:ring-2 focus:ring-offset-1"
                            )}
                            aria-label="Rate this quiz"
                          >
                            <Star className="h-5 w-5 fill-amber-500" />
                            {rating && (
                              <span className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full ring-1 ring-white dark:ring-gray-900">
                                {rating}
                              </span>
                            )}
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-sm py-1.5 px-2">
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
                            variant="ghost"
                            size="icon"
                            disabled={!isOwner || isDeleteLoading}
                            className={cn(
                              "h-12 w-12 rounded-xl bg-red-100 text-red-600 hover:bg-red-200",
                              "dark:bg-red-900/40 dark:text-red-400",
                              shadowPulse,
                              "focus:ring-2 focus:ring-offset-1",
                              !isOwner && "opacity-60 cursor-not-allowed"
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
                      <TooltipContent side="right" className="text-sm py-1.5 px-2">
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
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-md text-sm py-1">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>
      {!isVisible && (
        <div
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer"
          onClick={() => setIsVisible(true)}
          aria-label="Show quiz settings"
        >
          <div className="bg-primary/20 hover:bg-primary/30 p-2 rounded-r-lg transition-all duration-200">
            <Settings className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}
    </>
  )
}

export default QuizActions