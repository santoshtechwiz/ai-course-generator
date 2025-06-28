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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import QuizPDFDownload from "@/app/dashboard/create/components/QuizPDFDownload"
import useSubscription from "@/hooks/use-subscription"

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
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const router = useRouter()
  const { isSubscribedToAnyPaidPlan } = useSubscription()
  const canDownloadPDF = isSubscribedToAnyPaidPlan
  const isOwner = userId === ownerId

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

    try {
      if (field === "isPublic") setIsPublicLoading(true)
      if (field === "isFavorite") setIsFavoriteLoading(true)

      const response = await fetch(`/api/quizzes/common/${quizSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) throw new Error("Update failed")

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
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsPublicLoading(false)
      setIsFavoriteLoading(false)
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

    const confirmed = window.confirm(
      "Are you sure you want to delete this quiz? This action cannot be undone."
    )
    if (!confirmed) return

    setIsDeleteLoading(true)

    try {
      const response = await fetch(`/api/quizzes/common/${quizSlug}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error("Deletion failed")

      toast({ title: "Deleted", description: "Quiz was deleted" })
      router.push("/dashboard")
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

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/quiz/${quizSlug}`

      if (navigator.share) {
        await navigator.share({ title: "Check out this quiz!", url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({ title: "Link copied", description: "Quiz link copied to clipboard" })
      }
    } catch (error) {
      toast({
        title: "Sharing failed",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  return (
    <TooltipProvider>
      <div className={cn("w-full", className)}>
        <div className="bg-white dark:bg-slate-900 border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Quiz Actions
            </h2>
          </div>

          <div className="p-4 space-y-6">
            <div className="flex gap-3 w-full overflow-x-auto flex-nowrap md:flex-wrap">
              {/* Favorite */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => updateQuiz("isFavorite", !isFavorite)}
                    disabled={isFavoriteLoading || !userId}
                    variant="outline"
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[80px]",
                      isFavorite &&
                        "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                    )}
                  >
                    {isFavoriteLoading ? (
                      <div className="h-5 w-5 animate-spin mb-1" />
                    ) : (
                      <Heart
                        className={cn(
                          "h-5 w-5 mb-1",
                          isFavorite &&
                            "fill-red-500 text-red-500 dark:fill-red-300 dark:text-red-300"
                        )}
                      />
                    )}
                    <span className="text-xs font-medium">Favorite</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
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
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="flex flex-col items-center justify-center min-w-[80px]"
                  >
                    <Share2 className="h-5 w-5 mb-1 text-blue-600" />
                    <span className="text-xs font-medium">Share</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share this quiz</TooltipContent>
              </Tooltip>

              {/* Download PDF */}
              <Dialog>
                <DialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={!canDownloadPDF}
                        variant="outline"
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[80px]",
                          !canDownloadPDF && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <Download className="h-5 w-5 mb-1 text-green-600" />
                        <span className="text-xs font-medium">Download PDF</span>
                        {!canDownloadPDF && (
                          <Lock className="absolute top-1 right-1 h-3 w-3 text-gray-400" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {canDownloadPDF ? "Download as PDF" : "Upgrade required"}
                    </TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Download Quiz PDF</DialogTitle>
                  </DialogHeader>
                  <QuizPDFDownload quizId={quizId} />
                </DialogContent>
              </Dialog>

              {/* Delete (simple confirm) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleDelete}
                    disabled={!isOwner || isDeleteLoading}
                    variant="destructive"
                    className="flex flex-col items-center justify-center min-w-[80px]"
                  >
                    <Trash2 className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">
                      {isDeleteLoading ? "Deleting..." : "Delete"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isOwner ? "Delete quiz permanently" : "Only the owner can delete"}
                </TooltipContent>
              </Tooltip>

              {/* Visibility */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => updateQuiz("isPublic", !isPublic)}
                    disabled={isPublicLoading || !isOwner}
                    variant="outline"
                    className={cn(
                      "flex items-center justify-between min-w-[160px]",
                      isPublic
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
                      (isPublicLoading || !isOwner) && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isPublicLoading ? (
                        <div className="h-5 w-5 animate-spin" />
                      ) : isPublic ? (
                        <Eye className="h-5 w-5 text-green-600" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-blue-600" />
                      )}
                      <div className="text-left">
                        <div className="font-medium text-sm">
                          {isPublic ? "Public Quiz" : "Private Quiz"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isPublic
                            ? "Visible to everyone"
                            : "Only visible to you"}
                        </div>
                      </div>
                    </div>
                    <Badge variant={isPublic ? "default" : "secondary"}>
                      {isPublic ? "Public" : "Private"}
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isOwner
                    ? isPublic
                      ? "Make private"
                      : "Make public"
                    : "Only the owner can change visibility"}
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
