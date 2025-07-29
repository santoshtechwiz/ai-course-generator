"use client"

import type React from "react"
import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Share2, Trash2, Download, Heart, Settings, Users, Star, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/modules/auth"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ConfirmDialog } from "./ConfirmDialog"

interface QuizActionsProps {
  quizSlug: string
  quizData?: any
  initialIsPublic: boolean
  initialIsFavorite: boolean
  isOwner: boolean
  className?: string
}

interface ActionButton {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
  onClick: (() => void) | (() => Promise<void>)
  disabled: boolean
  active?: boolean
  premium?: boolean
  destructive?: boolean
  variant?: "default" | "outline" | "ghost"
}

export function QuizActions({
  quizSlug,
  quizData,
  initialIsPublic,
  initialIsFavorite,
  isOwner,
  className,
}: QuizActionsProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const router = useRouter()
  const { user, subscription, isAuthenticated } = useAuth()

  const currentUserId = user?.id || null
  const canDownloadPDF = subscription?.status?.toLowerCase() === "active"

  const promptLogin = useCallback(
    () =>
      toast({
        title: "Authentication required",
        description: "Please log in to perform this action",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push("/signin")}>
            Sign In
          </Button>
        ),
      }),
    [router],
  )

  const promptUpgrade = useCallback(
    () =>
      toast({
        title: "Premium feature",
        description: "Upgrade to Premium to download PDFs",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/subscription")}>
            Upgrade
          </Button>
        ),
      }),
    [router],
  )

  const updateQuiz = async (field: "isPublic" | "isFavorite", value: boolean) => {
    const setLoading = field === "isPublic" ? setIsPublicLoading : setIsFavoriteLoading
    if (!isAuthenticated || !currentUserId) return promptLogin()

    if (field === "isPublic" && !isOwner) {
      toast({
        title: "Permission denied",
        description: "Only the quiz owner can change visibility",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`/api/quizzes/common/${quizSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (!res.ok) throw new Error("Update failed")

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
        description:
          field === "isPublic"
            ? value
              ? "Others can now discover your quiz"
              : "Only you can access this quiz"
            : value
              ? "Quiz saved to favorites"
              : "Quiz removed from favorites",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/quiz/${quizSlug}`
      if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        await navigator.share({
          title: quizData?.title || "Check out this quiz!",
          text: "Test your knowledge with this quiz",
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link copied!",
          description: "Quiz link copied to clipboard",
        })
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast({
          title: "Sharing failed",
          description: "Please try again",
          variant: "destructive",
        })
      }
    }
  }

  const handlePdfDownload = async () => {
    if (!isAuthenticated) return promptLogin()
    if (!canDownloadPDF) return promptUpgrade()

    try {
      setIsPdfGenerating(true)
      const response = await fetch(`/api/quizzes/${quizSlug}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizData,
          includeAnswers: true,
          format: "A4",
        }),
      })

      if (!response.ok) throw new Error("Failed to generate PDF")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${quizSlug}-quiz.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "PDF Downloaded!",
        description: "Quiz PDF downloaded successfully",
      })
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download PDF",
        variant: "destructive",
      })
    } finally {
      setIsPdfGenerating(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/quizzes/common/${quizSlug}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete quiz")

      toast({
        title: "Quiz deleted",
        description: "Redirecting to dashboard...",
      })
      setTimeout(() => router.push("/dashboard"), 500)
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete quiz",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const primaryActions = useMemo(
    (): ActionButton[] => [
      {
        id: "share",
        label: "Share",
        icon: Share2,
        loading: false,
        onClick: handleShare,
        disabled: false,
        variant: "outline",
      },
      {
        id: "favorite",
        label: isFavorite ? "Unfavorite" : "Favorite",
        icon: Heart,
        loading: isFavoriteLoading,
        onClick: isAuthenticated ? () => updateQuiz("isFavorite", !isFavorite) : promptLogin,
        disabled: !isAuthenticated,
        active: isFavorite,
        variant: isFavorite ? "default" : "outline",
      },
    ],
    [isAuthenticated, isFavorite, isFavoriteLoading, promptLogin],
  )

  const ownerActions = useMemo(
    (): ActionButton[] => [
      {
        id: "visibility",
        label: isPublic ? "Make Private" : "Make Public",
        icon: isPublic ? Eye : EyeOff,
        loading: isPublicLoading,
        onClick: () => updateQuiz("isPublic", !isPublic),
        disabled: !isOwner || isPublicLoading,
        active: isPublic,
        variant: "outline",
      },
      {
        id: "download",
        label: "Download PDF",
        icon: Download,
        loading: isPdfGenerating,
        onClick: handlePdfDownload,
        disabled: !isAuthenticated || !canDownloadPDF,
        premium: !canDownloadPDF,
        variant: "outline",
      },
      {
        id: "delete",
        label: "Delete",
        icon: Trash2,
        loading: isDeleting,
        onClick: () => setShowDeleteDialog(true),
        disabled: !isOwner || isDeleting,
        destructive: true,
        variant: "outline",
      },
    ],
    [isAuthenticated, isPublic, isPublicLoading, isDeleting, isPdfGenerating, canDownloadPDF, isOwner],
  )

  return (
    <TooltipProvider>
      <Card className={cn("w-full relative", className)}>
        {/* Add prominent status badge in top-right corner */}
        <div className="absolute top-2 right-2">
          <Badge 
            variant={isPublic ? "default" : "secondary"}
            className={cn(
              "font-medium",
              isPublic 
                ? "bg-green-500/10 text-green-600 border-green-300" 
                : "bg-yellow-500/10 text-yellow-600 border-yellow-300"
            )}
          >
            {isPublic ? "Live" : "Draft"}
          </Badge>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Quiz Actions</h3>
            </div>

            {/* Status Indicators with enhanced styling */}
            <div className="flex items-center gap-2">
              {isFavorite && (
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-red-500/10 text-red-600 border-red-300"
                >
                  <Heart className="h-3 w-3 mr-1 fill-current text-red-500" />
                  Favorite
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Primary Actions with enhanced styling */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              {primaryActions.map((action) => (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={action.variant as any}
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-2 transition-all",
                        action.id === "favorite" && isFavorite && 
                          "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300",
                        action.id === "share" && 
                          "hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600",
                        action.disabled && "opacity-50"
                      )}
                      onClick={!action.disabled ? action.onClick : undefined}
                      disabled={action.disabled || action.loading}
                    >
                      <action.icon
                        className={cn(
                          "h-4 w-4",
                          action.id === "favorite" && isFavorite && "fill-current text-red-500",
                          action.id === "share" && "text-blue-500"
                        )}
                      />
                      {action.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Owner Actions with enhanced styling */}
          {isOwner && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Owner Actions</h4>
              <div className="space-y-2">
                {ownerActions.map((action) => (
                  <Tooltip key={action.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={action.variant as any}
                        size="sm"
                        className={cn(
                          "w-full justify-start gap-2 transition-all",
                          action.id === "visibility" && isPublic && 
                            "bg-green-50 border-green-200 text-green-600 hover:bg-green-100",
                          action.id === "download" && 
                            "hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600",
                          action.premium && "border-amber-200 bg-amber-50 hover:bg-amber-100",
                          action.destructive && "text-red-600 hover:bg-red-50 hover:border-red-200",
                          action.disabled && "opacity-50"
                        )}
                        onClick={!action.disabled ? action.onClick : undefined}
                        disabled={action.disabled || action.loading}
                      >
                        <action.icon className={cn(
                          "h-4 w-4",
                          action.id === "visibility" && isPublic && "text-green-500",
                          action.id === "download" && "text-blue-500",
                          action.destructive && "text-red-500"
                        )} />
                        {action.label}
                        {action.premium && (
                          <Crown className="h-3 w-3 ml-auto text-amber-500" />
                        )}
                        {action.loading && (
                          <div className="ml-auto animate-spin">
                            <Settings className="h-3 w-3" />
                          </div>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{action.label}</p>
                      {action.premium && (
                        <p className="text-xs text-muted-foreground">Premium feature</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {/* Quiz Stats with enhanced styling */}
          {quizData && (
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quiz Stats</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {quizData.rating && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium text-yellow-700">{quizData.rating.toFixed(1)}</span>
                  </div>
                )}
                {quizData.attempts && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-700">{quizData.attempts}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {/* Keep existing ConfirmDialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
          title="Delete Quiz"
          description="Are you sure you want to delete this quiz? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </Card>
    </TooltipProvider>
  )
}
