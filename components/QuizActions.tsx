"use client"

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

import { pdf } from "@react-pdf/renderer"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import ConfigurableQuizPDF from "./features/course/ConfigurableQuizPDF"

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

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // If we're scrolling, hide the toolbar
      if (Math.abs(currentScrollY - lastScrollY) > 10) {
        setIsVisible(false)
        setIsOpen(false)
        setIsScrolling(true)

        // Clear any existing timeout
        if (window.scrollTimeout) {
          clearTimeout(window.scrollTimeout)
        }

        // Set a timeout to show the toolbar again after scrolling stops
        window.scrollTimeout = setTimeout(() => {
          setIsScrolling(false)
          setIsVisible(true)
        }, 1000)
      }

      setLastScrollY(currentScrollY)
    }

    // Add a visibility check when user moves mouse to left side of screen
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX < 100 && !isVisible) {
        setIsVisible(true)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("mousemove", handleMouseMove)

    // Add a fallback to ensure toolbar reappears
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

  const updateQuiz = async (field: string, value: boolean) => {
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

  const handleShare = () => {
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

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/quiz/${quizId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch quiz data")
      }
      const quizData = await response.json()
      setData(quizData)

      const doc = (
        <ConfigurableQuizPDF
          quiz={quizData}
          showOptions={pdfConfig.showOptions}
          showAnswerSpace={pdfConfig.showAnswerSpace}
          answerSpaceHeight={pdfConfig.answerSpaceHeight}
          showAnswers={pdfConfig.showAnswers}
        />
      )

      const pdfBlob = await pdf(doc).toBlob()

      // Trigger the download
      const blobUrl = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `${quizData.title}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)

      toast({
        title: "Download started",
        description: "Your quiz is downloading now.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRatingChange = async (value: number) => {
    try {
      setRating(value)
      const response = await fetch(`/api/quiz/${quizId}/rating`, {
        method: "POST",
        body: JSON.stringify({ rating: value }),
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
    setIsDeleteLoading(true)
    try {
      const response = await fetch(`/api/quiz/${quizId}`, {
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

  if (!isOwner) {
    return <>{children}</>
  }

  return (
    <>
      {children}

      <div
        className={cn(
          "fixed left-4 top-1/2 -translate-y-1/2 z-50 transition-all duration-500",
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20 pointer-events-none",
          isScrolling && !isVisible ? "animate-pulse" : "",
          className,
        )}
      >
        {!isOpen && !isVisible && (
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-16 bg-primary/50 rounded-full animate-pulse" />
        )}
        {!isOpen ? (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform animate-pulse"
          >
            <Settings className="h-6 w-6" />
          </Button>
        ) : (
          <div className="bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg p-4 w-[90px] animate-in slide-in-from-left duration-300 ease-in-out">
            <div className="flex flex-col items-center">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full self-end mb-2 hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>

              <TooltipProvider>
                {/* Visibility Group */}
                <div className="flex flex-col items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={togglePublic}
                        disabled={isPublicLoading}
                        className={cn(
                          "h-14 w-14 rounded-xl transition-colors",
                          isPublic
                            ? "bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                            : "bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50",
                        )}
                      >
                        {isPublicLoading ? (
                          <span className="h-6 w-6 border-3 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isPublic ? (
                          <Eye className="h-6 w-6" />
                        ) : (
                          <EyeOff className="h-6 w-6" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-base">
                      <p>{isPublic ? "Public - Click to make private" : "Private - Click to make public"}</p>
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
                          "h-14 w-14 rounded-xl transition-colors",
                          isFavorite
                            ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 hover:text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:bg-gray-800/70",
                        )}
                      >
                        {isFavoriteLoading ? (
                          <span className="h-6 w-6 border-3 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Star className={cn("h-6 w-6", isFavorite ? "fill-yellow-500" : "")} />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-base">
                      <p>{isFavorite ? "Favorited - Click to remove" : "Add to favorites"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <Separator className="my-4 w-16 bg-gray-300 dark:bg-gray-700" />

                {/* Share Group */}
                <div className="flex flex-col items-center gap-3">
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-14 w-14 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                          >
                            <Share2 className="h-6 w-6" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-base">
                        <p>Share quiz</p>
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent side="right" align="start" className="w-48">
                      <DropdownMenuItem onClick={handleShare} className="py-3 text-base">
                        <Share2 className="mr-3 h-5 w-5" />
                        <span>Copy Link</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSocialShare("facebook")}
                        className="py-3 text-base text-[#1877F2]"
                      >
                        <Facebook className="mr-3 h-5 w-5" />
                        <span>Facebook</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSocialShare("twitter")}
                        className="py-3 text-base text-[#1DA1F2]"
                      >
                        <Twitter className="mr-3 h-5 w-5" />
                        <span>Twitter</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSocialShare("linkedin")}
                        className="py-3 text-base text-[#0A66C2]"
                      >
                        <Linkedin className="mr-3 h-5 w-5" />
                        <span>LinkedIn</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDownload}
                        disabled={isDownloading || !canDownloadPDF()}
                        className={cn(
                          "h-14 w-14 rounded-xl transition-colors",
                          canDownloadPDF()
                            ? "bg-purple-100 text-purple-600 hover:bg-purple-200 hover:text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:bg-gray-800/70",
                        )}
                      >
                        {isDownloading ? (
                          <span className="h-6 w-6 border-3 border-current border-t-transparent rounded-full animate-spin" />
                        ) : canDownloadPDF() ? (
                          <FileDown className="h-6 w-6" />
                        ) : (
                          <Lock className="h-6 w-6" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-base">
                      <p>{canDownloadPDF() ? "Download as PDF" : "Upgrade to download PDF"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <Separator className="my-4 w-16 bg-gray-300 dark:bg-gray-700" />

                {/* Rating & Delete Group */}
                <div className="flex flex-col items-center gap-3">
                  <Dialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-14 w-14 rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-200 hover:text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 relative"
                          >
                            <Star className="h-6 w-6 fill-amber-500" />
                            {rating && (
                              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-sm font-bold h-6 w-6 flex items-center justify-center rounded-full">
                                {rating}
                              </span>
                            )}
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-base">
                        <p>Rate this quiz</p>
                      </TooltipContent>
                    </Tooltip>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-xl">Rate this Quiz</DialogTitle>
                      </DialogHeader>
                      <div className="flex justify-center p-6">
                        <Rating value={rating} onValueChange={handleRatingChange} className="scale-150" />
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
                            disabled={isDeleteLoading}
                            className="h-14 w-14 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                          >
                            {isDeleteLoading ? (
                              <span className="h-6 w-6 border-3 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="h-6 w-6" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-base">
                        <p>Delete quiz</p>
                      </TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                          This action cannot be undone. This will permanently delete your quiz and remove it from our
                          servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
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
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 transition-all duration-300 opacity-70 hover:opacity-100"
          onClick={() => setIsVisible(true)}
        >
          <div className="bg-primary/20 hover:bg-primary/40 p-2 rounded-r-lg cursor-pointer transition-colors">
            <Settings className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      )}
    </>
  )
}

