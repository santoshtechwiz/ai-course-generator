"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Eye, EyeOff, Share2, Trash2, Download, Heart, Lock, Settings, Loader2, TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import QuizPDFDownload from "@/app/dashboard/create/components/QuizPdfButton"
import { useAuth } from "@/modules/auth"
import { ConfirmDialog } from "./ConfirmDialog"

interface QuizActionsProps {
  quizId: string
  quizData?: any
  quizSlug: string
  initialIsPublic: boolean
  initialIsFavorite: boolean
  userId: string
  ownerId: string
  className?: string
  children?: React.ReactNode
}

export function QuizActions({
  quizSlug,
  quizData,
  initialIsPublic,
  initialIsFavorite,
  ownerId,
  className,
  children,
}: QuizActionsProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const router = useRouter()
  const { user, subscription, isAuthenticated } = useAuth()
  const currentUserId = user?.id
  const canDownloadPDF = subscription?.features?.advancedAnalytics || false
  const isOwner = currentUserId === ownerId

  const promptLogin = () =>
    toast({ title: "Authentication required", description: "Please log in to perform this action", variant: "destructive" })

  const promptUpgrade = () =>
    toast({ title: "Premium feature", description: "Upgrade to Premium to download PDFs", variant: "destructive" })

  const updateQuiz = async (field: "isPublic" | "isFavorite", value: boolean) => {
    const setLoading = field === "isPublic" ? setIsPublicLoading : setIsFavoriteLoading
    if (!isAuthenticated || !currentUserId) return promptLogin()
    if (field === "isPublic" && !isOwner) {
      toast({ title: "Permission denied", description: "Only the quiz owner can change visibility", variant: "destructive" })
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
        title: field === "isPublic"
          ? value ? "Quiz is now public" : "Quiz is now private"
          : value ? "Added to favorites" : "Removed from favorites",
      })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/quiz/${quizSlug}`
      if (navigator.share) {
        await navigator.share({ title: "Check out this quiz!", text: "I found this awesome quiz you might like:", url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({ title: "Link copied", description: "Quiz link copied to clipboard" })
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast({ title: "Sharing failed", description: "Please try again", variant: "destructive" })
      }
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await toast.promise(
        fetch(`/api/quizzes/common/${quizSlug}`, { method: "DELETE" }),
        {
          loading: "Deleting quiz...",
          success: "Quiz deleted successfully",
          error: "Failed to delete quiz",
        }
      )
      setTimeout(() => router.push("/dashboard"), 500)
    } finally {
      setIsDeleting(false)
    }
  }

  const baseButtonClasses =
    "group relative flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 shadow-sm sm:min-w-[120px] min-w-[40px] h-12 sm:h-14"

  const buttonStyles = {
    favorite: "bg-pink-100 border-pink-200 text-pink-700 hover:bg-pink-200 dark:bg-pink-950 dark:border-pink-800 dark:text-pink-300",
    share: "bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300",
    download: canDownloadPDF
      ? "bg-emerald-100 border-emerald-200 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300"
      : "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400",
    visibility: isPublic
      ? "bg-green-100 border-green-200 text-green-700 hover:bg-green-200 dark:bg-green-950 dark:border-green-800 dark:text-green-300"
      : "bg-yellow-100 border-yellow-200 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300",
    delete: "bg-red-100 border-red-200 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-300",
  }

  const actionButtons = useMemo(() => [
    {
      id: "favorite",
      label: "Favorite",
      icon: Heart,
      loading: isFavoriteLoading,
      onClick: isAuthenticated ? () => updateQuiz("isFavorite", !isFavorite) : promptLogin,
      disabled: !isAuthenticated,
      active: isFavorite,
      badge: !isAuthenticated ? "Sign In" : undefined,
    },
    {
      id: "share",
      label: "Share",
      icon: Share2,
      loading: false,
      onClick: handleShare,
      disabled: false,
      badge: "Popular",
    },
    {
      id: "download",
      label: "PDF",
      icon: Download,
      loading: false,
      onClick: !isAuthenticated ? promptLogin : !canDownloadPDF ? promptUpgrade : undefined,
      disabled: !isAuthenticated || !canDownloadPDF,
      badge: !isAuthenticated ? "Sign In" : canDownloadPDF ? "Premium" : "Locked",
    },
    ...(isOwner && isAuthenticated ? [
      {
        id: "visibility",
        label: isPublic ? "Public" : "Private",
        icon: isPublic ? Eye : EyeOff,
        loading: isPublicLoading,
        onClick: () => updateQuiz("isPublic", !isPublic),
        disabled: false,
        badge: isPublic ? "Live" : "Draft",
        active: isPublic,
      },
      {
        id: "delete",
        label: "Delete",
        icon: Trash2,
        loading: isDeleting,
        onClick: handleDelete,
        disabled: false,
        badge: "Danger",
      },
    ] : [])
  ], [isAuthenticated, isFavorite, isFavoriteLoading, isPublic, isPublicLoading, isDeleting, canDownloadPDF])

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("w-full", className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-lg font-semibold text-gray-800 dark:text-white">Quiz Actions</span>
          </div>
          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20">
            <TrendingUp className="h-3 w-3 mr-1" />
            Popular
          </Badge>
        </div>

        {/* Toolbar */}
        <div className="w-full rounded-2xl border bg-white dark:bg-zinc-900 shadow-md p-4 sm:p-6">
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {actionButtons.map(({ id, label, icon: Icon, loading, disabled, onClick, badge, active }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  {id === "delete" ? (
                    <ConfirmDialog
                      onConfirm={onClick}
                      trigger={
                        <div className={cn(baseButtonClasses, buttonStyles[id as keyof typeof buttonStyles], active && "ring-2 ring-offset-2 ring-blue-400", disabled && "opacity-60 cursor-not-allowed")}>
                          {badge && (
                            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] rounded-full font-bold bg-white/90 text-gray-700 dark:bg-black/50 dark:text-white">
                              {badge}
                            </span>
                          )}
                          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                          <span className="hidden sm:inline">{label}</span>
                        </div>
                      }
                    >
                      <div className="text-center space-y-3">
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="font-semibold text-lg">Delete Quiz</h3>
                        <p className="text-sm text-muted-foreground">This action is permanent. Are you sure?</p>
                      </div>
                    </ConfirmDialog>
                  ) : (
                    <div
                      className={cn(baseButtonClasses, buttonStyles[id as keyof typeof buttonStyles], active && "ring-2 ring-offset-2 ring-blue-400", disabled && "opacity-60 cursor-not-allowed")}
                      onClick={!disabled ? onClick : undefined}
                    >
                      {badge && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] rounded-full font-bold bg-white/90 text-gray-700 dark:bg-black/50 dark:text-white">
                          {badge}
                        </span>
                      )}
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                      <span className="hidden sm:inline">{label}</span>
                    </div>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {children && <div className="mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">{children}</div>}
        </div>
      </div>
    </TooltipProvider>
  )
}
