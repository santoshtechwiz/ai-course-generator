"use client"

import React from "react"

import type { ReactElement } from "react"
import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  Share2,
  Trash2,
  Download,
  Heart,
  BarChart2,
  MoreHorizontal,
  Sparkles,
  Copy,
  Settings,
  Users,
  Star,
  TrendingUp,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/modules/auth"
import { ConfirmDialog } from "./ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  category: "share" | "stats" | "personal" | "utility"
  priority: "primary" | "secondary"
}

const categoryConfig = {
  share: {
    label: "Share & Export",
    color: "blue",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    hoverColor: "hover:bg-blue-100 dark:hover:bg-blue-900/30",
  },
  stats: {
    label: "Stats & Progress",
    color: "green",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
    hoverColor: "hover:bg-green-100 dark:hover:bg-green-900/30",
  },
  personal: {
    label: "Personal Tools",
    color: "pink",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    borderColor: "border-pink-200 dark:border-pink-800",
    iconColor: "text-pink-600 dark:text-pink-400",
    hoverColor: "hover:bg-pink-100 dark:hover:bg-pink-900/30",
  },
  utility: {
    label: "Settings",
    color: "gray",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    borderColor: "border-gray-200 dark:border-gray-800",
    iconColor: "text-gray-600 dark:text-gray-400",
    hoverColor: "hover:bg-gray-100 dark:hover:bg-gray-900/30",
  },
}

export function QuizActions({
  quizSlug,
  quizData,
  initialIsPublic,
  initialIsFavorite,
  isOwner,
  className,
}: QuizActionsProps): ReactElement {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const router = useRouter()
  const { user, subscription, isAuthenticated } = useAuth()

  // Check if mobile on mount
  const checkMobile = () => setIsMobile(window.innerWidth < 768)
  React.useEffect(() => {
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

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
      if (navigator.share && isMobile) {
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
          action: (
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(shareUrl)}>
              <Copy className="h-4 w-4 mr-1" />
              Copy Again
            </Button>
          ),
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

  const actionButtons = useMemo(
    (): ActionButton[] => [
      // Share & Export Actions
      {
        id: "share",
        label: "Share quiz",
        icon: Share2,
        loading: false,
        onClick: handleShare,
        disabled: false,
        category: "share",
        priority: "primary",
      },
      {
        id: "download",
        label: "Download PDF",
        icon: Download,
        loading: isPdfGenerating,
        onClick: handlePdfDownload,
        disabled: !isAuthenticated || !canDownloadPDF,
        premium: !canDownloadPDF,
        category: "share",
        priority: "secondary",
      },
      // Personal Tools
      {
        id: "favorite",
        label: isFavorite ? "Remove from favorites" : "Add to favorites",
        icon: Heart,
        loading: isFavoriteLoading,
        onClick: isAuthenticated ? () => updateQuiz("isFavorite", !isFavorite) : promptLogin,
        disabled: !isAuthenticated,
        active: isFavorite,
        category: "personal",
        priority: "primary",
      },
      // Utility Actions
      {
        id: "visibility",
        label: isPublic ? "Make private" : "Make public",
        icon: isPublic ? Eye : EyeOff,
        loading: isPublicLoading,
        onClick: () => updateQuiz("isPublic", !isPublic),
        disabled: !isOwner || isPublicLoading,
        active: isPublic,
        category: "utility",
        priority: "secondary",
      },
      {
        id: "delete",
        label: "Delete quiz",
        icon: Trash2,
        loading: isDeleting,
        onClick: () => setShowDeleteDialog(true),
        disabled: !isOwner || isDeleting,
        destructive: true,
        category: "utility",
        priority: "secondary",
      },
    ],
    [
      isAuthenticated,
      isFavorite,
      isFavoriteLoading,
      isPublic,
      isPublicLoading,
      isDeleting,
      isPdfGenerating,
      canDownloadPDF,
      isOwner,
      promptLogin,
    ],
  )

  const groupedActions = useMemo(() => {
    const groups: Record<string, ActionButton[]> = {}
    actionButtons.forEach((action) => {
      if (!groups[action.category]) {
        groups[action.category] = []
      }
      groups[action.category].push(action)
    })
    return groups
  }, [actionButtons])

  const primaryActions = actionButtons.filter((action) => action.priority === "primary")
  const secondaryActions = actionButtons.filter((action) => action.priority === "secondary")

  const getButtonClass = (action: ActionButton, isCompact = false) => {
    const config = categoryConfig[action.category]
    return cn(
      "relative group transition-all duration-200 overflow-hidden",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      isCompact ? "h-12 w-12 p-0 rounded-full shadow-lg" : "h-10 px-4 py-2 rounded-lg",
      config.hoverColor,
      "hover:scale-[1.02] active:scale-[0.98]",
      "hover:shadow-md active:shadow-sm",
      action.active && "ring-2 ring-offset-2",
      action.active && action.category === "personal" && "ring-pink-500",
      action.active && action.category === "utility" && "ring-green-500",
      action.disabled && "opacity-50 cursor-not-allowed hover:scale-100",
      action.premium &&
        "border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20",
    )
  }

  const getIconClass = (action: ActionButton, isCompact = false) => {
    const config = categoryConfig[action.category]
    return cn(
      "transition-all duration-200",
      isCompact ? "h-6 w-6" : "h-4 w-4",
      config.iconColor,
      action.active && action.id === "favorite" && "fill-current text-pink-500 scale-110",
      action.active && action.id === "visibility" && isPublic && "text-green-500 scale-110",
      action.premium && "text-amber-600",
      action.loading && "animate-pulse",
      "group-hover:scale-110",
    )
  }

  // Mobile Floating Action Bar
  if (isMobile) {
    return (
      <TooltipProvider delayDuration={200}>
        <div
          className={cn(
            "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
            "bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl",
            "px-3 py-3 flex items-center gap-2",
            className,
          )}
        >
          {primaryActions.map((action) => (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={getButtonClass(action, true)}
                  onClick={!action.disabled ? action.onClick : undefined}
                  disabled={action.disabled || action.loading}
                  aria-label={action.label}
                >
                  {action.loading ? (
                    <BarChart2 className={cn(getIconClass(action, true), "animate-spin")} />
                  ) : (
                    <action.icon className={getIconClass(action, true)} />
                  )}

                  {action.premium && (
                    <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1">
                      <Sparkles className="h-3 w-3" />
                    </div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-medium">
                {action.label}
                {action.disabled && action.premium && " (Premium)"}
              </TooltipContent>
            </Tooltip>
          ))}

          {secondaryActions.length > 0 && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-12 w-12 p-0 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-lg"
                      aria-label="More actions"
                    >
                      <MoreHorizontal className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">More actions</TooltipContent>
              </Tooltip>

              <DropdownMenuContent align="center" side="top" className="min-w-[220px] mb-2">
                {Object.entries(groupedActions).map(([category, actions]) => {
                  const secondaryCategoryActions = actions.filter((action) => action.priority === "secondary")
                  if (secondaryCategoryActions.length === 0) return null

                  const config = categoryConfig[category as keyof typeof categoryConfig]

                  return (
                    <div key={category}>
                      <div className={cn("px-3 py-2 text-xs font-semibold uppercase tracking-wider", config.iconColor)}>
                        {config.label}
                      </div>
                      {secondaryCategoryActions.map((action) => (
                        <DropdownMenuItem
                          key={action.id}
                          onSelect={action.onClick}
                          disabled={action.disabled || action.loading}
                          className={cn(
                            "flex items-center gap-3 py-3 px-3 mx-1 rounded-md",
                            config.hoverColor,
                            action.destructive && "text-destructive focus:bg-destructive/10",
                          )}
                        >
                          {action.loading ? (
                            <BarChart2 className={cn("h-4 w-4", "animate-spin")} />
                          ) : (
                            <action.icon className={getIconClass(action)} />
                          )}
                          <span className="font-medium">{action.label}</span>
                          {action.premium && (
                            <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Pro
                            </Badge>
                          )}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="my-1" />
                    </div>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

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
      </TooltipProvider>
    )
  }

  // Desktop Toolbar Layout
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "w-full bg-card/80 backdrop-blur-sm border rounded-xl shadow-sm",
          "transition-all hover:shadow-md hover:bg-card/90",
          className,
        )}
      >
        {/* Toolbar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Quiz Actions</h3>
            </div>
            
            {/* Status Badges */}
            <div className="flex items-center gap-2">
              {isPublic && (
                <Badge variant="secondary" className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  <Eye className="h-3 w-3 mr-1" />
                  {isOwner ? "Public" : "Shared"}
                </Badge>
              )}
              {isFavorite && (
                <Badge variant="secondary" className="px-2 py-1 text-xs bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                  <Heart className="h-3 w-3 mr-1 fill-current" />
                  Favorite
                </Badge>
              )}
            </div>
          </div>

          {/* Quiz Stats */}
          {quizData && (
            <div className="flex items-center gap-3 text-sm">
              {quizData.rating && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{quizData.rating.toFixed(1)}</span>
                </div>
              )}
              {quizData.attempts && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{quizData.attempts}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* All Actions in Toolbar Format */}
            {Object.entries(groupedActions).map(([category, actions]) => {
              const config = categoryConfig[category as keyof typeof categoryConfig]

              return (
                <div key={category} className="flex items-center gap-2">
                  {/* Category Indicator */}
                  <div className={cn("w-1 h-8 rounded-full", config.iconColor.replace("text-", "bg-"))} />
                  
                  {/* Category Actions */}
                  {actions.map((action) => (
                    <Tooltip key={action.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={action.active ? "default" : action.destructive ? "destructive" : "outline"}
                          size="sm"
                          className={cn(
                            "h-9 px-3 gap-2 transition-all duration-200",
                            config.hoverColor,
                            action.active && "ring-2 ring-offset-1",
                            action.active && action.category === "personal" && "ring-pink-400",
                            action.active && action.category === "utility" && "ring-green-400",
                            action.disabled && "opacity-50 cursor-not-allowed",
                            action.premium && "border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20"
                          )}
                          onClick={!action.disabled ? action.onClick : undefined}
                          disabled={action.disabled || action.loading}
                          aria-label={action.label}
                        >
                          {action.loading ? (
                            <BarChart2 className={cn("h-4 w-4", "animate-spin")} />
                          ) : (
                            <action.icon className={cn(
                              "h-4 w-4",
                              action.active && action.id === "favorite" && "fill-current text-pink-500",
                              action.active && action.id === "visibility" && isPublic && "text-green-500",
                              action.premium && "text-amber-600"
                            )} />
                          )}
                          <span className="font-medium text-sm">{action.label}</span>

                          {action.premium && (
                            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                              <Sparkles className="h-3 w-3" />
                            </Badge>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <div className="font-medium">{action.label}</div>
                          {action.disabled && action.premium && (
                            <div className="text-xs text-muted-foreground mt-1">Premium feature</div>
                          )}
                          {action.disabled && !action.premium && !isAuthenticated && (
                            <div className="text-xs text-muted-foreground mt-1">Login required</div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Public Quiz Notice */}
        {isPublic && (
          <div className="mx-4 mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-green-800 dark:text-green-200 text-sm mb-1">
                  {isOwner ? "Public Quiz" : "Shared Quiz"}
                </h4>
                <p className="text-xs text-green-700 dark:text-green-300">
                  This quiz is {isOwner ? "public" : "shared with you"}.
                  {isOwner && " Others can discover and take it."}
                </p>
              </div>
              {isOwner && (
                <Badge variant="outline" className="border-green-300 text-green-700 dark:text-green-300 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Discoverable
                </Badge>
              )}
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          

          onConfirm={handleDelete}
          title="Delete Quiz"
          description="Are you sure you want to delete this quiz? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </TooltipProvider>
  )
}

