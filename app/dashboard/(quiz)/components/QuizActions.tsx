"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  Share2,
  Trash2,
  Download,
  Heart,
  Lock,
  Settings,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/tailwindUtils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import QuizPDFDownload from "@/app/dashboard/create/components/QuizPDFDownload"
import useSubscription from "@/hooks/use-subscription"

import { useSession } from "next-auth/react"
import { ConfirmDialog } from "./ConfirmDialog"

interface QuizActionsProps {
  quizId: string
  quizSlug: string
  initialIsPublic: boolean
  initialIsFavorite: boolean
  userId: string
  ownerId: string
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
  className,
  children,
}: QuizActionsProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const router = useRouter()
  const { isSubscribedToAnyPaidPlan } = useSubscription()
  const canDownloadPDF = isSubscribedToAnyPaidPlan
  const currentUserId = useSession().data?.user?.id || null
  const isOwner = currentUserId === ownerId

  const promptLogin = () => {
    toast({
      title: "Authentication required",
      description: "Please log in to perform this action",
      variant: "destructive",
    })
  }

  const updateQuiz = async (field: string, value: boolean) => {
    if (!userId) return promptLogin()
    if (field === "isPublic" && !isOwner) {
      toast({
        title: "Permission denied",
        description: "Only the quiz owner can change visibility",
        variant: "destructive",
      })
      return
    }

    const loadingSetter = field === "isPublic" ? setIsPublicLoading : setIsFavoriteLoading
    try {
      loadingSetter(true)
      const response = await fetch(`/api/quizzes/common/${quizSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) throw new Error(response.statusText || "Update failed")

      field === "isPublic" ? setIsPublic(value) : setIsFavorite(value)

      toast({
        title:
          field === "isPublic"
            ? value
              ? "Quiz is now public"
              : "Quiz is now private"
            : value
            ? "Added to favorites"
            : "Removed from favorites",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      loadingSetter(false)
    }
  }

  if (!currentUserId) return null

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/quiz/${quizSlug}`

      if (navigator.share) {
        await navigator.share({
          title: "Check out this quiz!",
          text: "I found this awesome quiz you might like:",
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link copied",
          description: "Quiz link copied to clipboard",
        })
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          title: "Sharing failed",
          description: "Please try again",
          variant: "destructive",
        })
      }
    }
  }

  const buttonBase =
    "group transition-all duration-200 ease-in-out flex flex-col items-center justify-center min-w-[90px] h-[80px] sm:min-w-[56px] sm:h-[56px] sm:rounded-md relative hover:scale-[1.02] active:scale-[0.98]"

  const textStyle = "text-xs font-medium sm:hidden text-muted-foreground"

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("w-full", className)}>
        <div className="bg-white dark:bg-slate-900 border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Quiz Actions
            </h2>
          </div>

          <div className="p-4 space-y-4 bg-muted/10">
            <div className="flex flex-wrap gap-2">
              {/* Favorite */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => updateQuiz("isFavorite", !isFavorite)}
                    disabled={isFavoriteLoading || !userId}
                    variant="outline"
                    className={cn(
                      buttonBase,
                      isFavorite &&
                        "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                    )}
                  >
                    {isFavoriteLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Heart
                        className={cn(
                          "h-5 w-5",
                          isFavorite && "fill-red-500 text-red-500 dark:fill-red-300 dark:text-red-300"
                        )}
                      />
                    )}
                    <span className={textStyle}>{isFavorite ? "Favorited" : "Favorite"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {!userId
                    ? "Login required"
                    : isFavorite
                    ? "Remove from favorites"
                    : "Add to favorites"}
                </TooltipContent>
              </Tooltip>

              {/* Share */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleShare} variant="outline" className={buttonBase}>
                    <Share2 className="h-5 w-5 text-blue-600" />
                    <span className={textStyle}>Share</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Share this quiz</TooltipContent>
              </Tooltip>

              {/* PDF Download */}
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <DialogTrigger asChild>
                        <Button
                          disabled={!canDownloadPDF}
                          variant="outline"
                          className={cn(
                            buttonBase,
                            !canDownloadPDF && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          <Download className="h-5 w-5 text-green-600" />
                          <span className={textStyle}>PDF</span>
                          {!canDownloadPDF && (
                            <Lock className="absolute top-1 right-1 h-3 w-3 text-gray-400" />
                          )}
                        </Button>
                      </DialogTrigger>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {canDownloadPDF ? "Download as PDF" : "Upgrade required"}
                  </TooltipContent>
                </Tooltip>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Download Quiz PDF</DialogTitle>
                  </DialogHeader>
                  <QuizPDFDownload quizId={quizId} />
                </DialogContent>
              </Dialog>

              {/* Delete */}
              {isOwner && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <ConfirmDialog
                        onConfirm={async () => {
                          try {
                            const response = await fetch(`/api/quizzes/common/${quizSlug}`, {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                            })
                            if (!response.ok) throw new Error("Deletion failed")

                            toast({
                              title: "Deleted",
                              description: "Quiz was successfully deleted",
                            })
                            router.push("/dashboard")
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message || "Failed to delete quiz",
                              variant: "destructive",
                            })
                          }
                        }}
                        trigger={
                          <Button variant="destructive" className={buttonBase}>
                            <Trash2 className="h-5 w-5" />
                            <span className={textStyle}>Delete</span>
                          </Button>
                        }
                      >
                        <div>
                          <div className="font-semibold text-lg mb-2">Delete Quiz</div>
                          <div>This action is irreversible. Do you want to proceed?</div>
                        </div>
                      </ConfirmDialog>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Delete quiz permanently</TooltipContent>
                </Tooltip>
              )}

              {/* Visibility */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => updateQuiz("isPublic", !isPublic)}
                    disabled={isPublicLoading || !isOwner}
                    variant="outline"
                    className={cn(
                      buttonBase,
                      isPublic
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
                      (isPublicLoading || !isOwner) && "opacity-70"
                    )}
                  >
                    {isPublicLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isPublic ? (
                      <Eye className="h-5 w-5 text-green-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-blue-600" />
                    )}
                    <span className={textStyle}>{isPublic ? "Public" : "Private"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isOwner
                    ? isPublic
                      ? "Make private"
                      : "Make public"
                    : "Only owner can change"}
                </TooltipContent>
              </Tooltip>
            </div>

            {children && <div className="pt-4 border-t">{children}</div>}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
