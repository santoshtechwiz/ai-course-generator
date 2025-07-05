"use client"

import type React from "react"
import { useState } from "react"
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
  Sparkles,
  TrendingUp,
  Users,
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
  quizData?: any // Adjust type as needed
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
  quizData,
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
  const { user, subscription, isAuthenticated, isLoading } = useAuth()
    // Extract values from auth state
  const currentUserId = user?.id || null
  const canDownloadPDF = subscription?.features?.advancedAnalytics || false
  const isOwner = currentUserId === ownerId // Use ownerId from props, not userId
  
  console.log("QuizActions Debug:", { 
    currentUserId, 
    ownerId,
    isOwner,
    canDownloadPDF, 
    isAuthenticated, 
    isLoading,
    user: user ? { id: user.id, email: user.email } : null,
    subscription: subscription ? { 
      plan: subscription.plan, 
      status: subscription.status,
      features: subscription.features 
    } : null
  });
   const promptLogin = () => {
    toast({
      title: "Authentication required",
      description: "Please log in to perform this action",
      variant: "destructive",
    })
  }

  const promptUpgrade = () => {
    toast({
      title: "Premium feature",
      description: "Upgrade to Premium to download PDFs",
      variant: "destructive",
    })
  }  
  const updateQuiz = async (field: string, value: boolean) => {
    if (!isAuthenticated || !currentUserId) return promptLogin()
    if (field === "isPublic" && !isOwner) {
      toast({
        title: "Permission denied",
        description: "Only the quiz owner can change visibility",
        variant: "destructive",
      })
      return
    }

    const setLoading = field === "isPublic" ? setIsPublicLoading : setIsFavoriteLoading
    try {
      setLoading(true)
      const res = await fetch(`/api/quizzes/common/${quizSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error(res.statusText || "Update failed")
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
      if (navigator.share) {
        await navigator.share({
          title: "Check out this quiz!",
          text: "I found this awesome quiz you might like:",
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({ title: "Link copied", description: "Quiz link copied to clipboard" })
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
  const actionButtons = [
    {
      id: "favorite",
      icon: Heart,
      label: "Favorite",
      onClick: isAuthenticated ? () => updateQuiz("isFavorite", !isFavorite) : promptLogin,
      loading: isFavoriteLoading,
      disabled: !isAuthenticated,
      active: isFavorite && isAuthenticated,
      badge: !isAuthenticated ? "Sign In" : null,
      badgeColor: !isAuthenticated ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "",
    },
    {
      id: "share",
      icon: Share2,
      label: "Share",
      onClick: handleShare,
      loading: false,
      disabled: false,
      active: false,
      badge: "Popular",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      id: "download",
      icon: Download,
      label: "PDF",
      onClick: !isAuthenticated ? promptLogin : !canDownloadPDF ? promptUpgrade : undefined,
      loading: false,
      disabled: !isAuthenticated || !canDownloadPDF,
      active: false,
      badge: !isAuthenticated ? "Sign In" : canDownloadPDF ? "Premium" : "Locked",
      badgeColor: !isAuthenticated 
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        : canDownloadPDF
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      lockIcon: isAuthenticated && !canDownloadPDF,
    },
    ...(isOwner && isAuthenticated
      ? [
        {
          id: "visibility",
          icon: isPublic ? Eye : EyeOff,
          label: isPublic ? "Public" : "Private",
          onClick: () => updateQuiz("isPublic", !isPublic),
          loading: isPublicLoading,
          disabled: false,
          active: isPublic,
          badge: isPublic ? "Live" : "Draft",
          badgeColor: isPublic
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        },
        {
          id: "delete",
          icon: Trash2,
          label: "Delete",
          onClick: null,
          loading: false,
          disabled: false,
          active: false,
          badge: "Danger",
          badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        },
      ]
      : []),
  ]
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("w-full", className)}>
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Settings className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quiz Actions
            </span>
          </div>
          <div className="flex gap-1">
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20">
              <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
              Popular
            </Badge>
          </div>
        </div>

        {/* Compact Action Buttons */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 shadow-sm">
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {actionButtons.map((action) => {
              const Icon = action.icon
              
              // Special handling for download button
              if (action.id === "download") {
                return (
                  <Tooltip key={action.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "relative flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer hover:shadow-sm",
                          !isAuthenticated
                            ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300"
                            : canDownloadPDF
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300"
                            : "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400",
                        )}
                        onClick={!isAuthenticated ? promptLogin : !canDownloadPDF ? promptUpgrade : undefined}
                      >
                        {action.badge && (
                          <span
                            className={cn(
                              "absolute -top-1 -right-1 px-1 py-0.5 text-[9px] rounded-full font-medium leading-none",
                              action.badgeColor,
                            )}
                          >
                            {action.badge}
                          </span>
                        )}
                        {currentUserId && !canDownloadPDF && (
                          <Lock className="h-3 w-3 text-gray-400" />
                        )}
                        {currentUserId && canDownloadPDF ? (
                          <QuizPDFDownload
                            quizData={quizData}
                            config={{ showOptions: true, showAnswers: true }}
                            variant="ghost"
                            size="sm"
                            className="!p-0 !m-0 !h-4 !w-4"
                          />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">{action.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {!isAuthenticated 
                          ? "Sign in to download PDF" 
                          : canDownloadPDF 
                          ? "Download this quiz as PDF" 
                          : "Upgrade to Premium to download PDF"
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              // Special handling for delete button
              if (action.id === "delete") {
                return (
                  <Tooltip key={action.id}>
                    <TooltipTrigger asChild>
                      <ConfirmDialog
                        onConfirm={async () => {
                          try {
                            const res = await fetch(`/api/quizzes/common/${quizSlug}`, {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                            })
                            if (!res.ok) throw new Error("Failed to delete")
                            toast({ title: "Deleted", description: "Quiz deleted successfully" })
                            router.push("/dashboard")
                          } catch (err: any) {
                            toast({ title: "Error", description: err.message, variant: "destructive" })
                          }
                        }}
                        trigger={
                          <div
                            className={cn(
                              "relative flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer hover:shadow-sm",
                              "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300"
                            )}
                          >
                            {action.badge && (
                              <span className="absolute -top-1 -right-1 px-1 py-0.5 text-[9px] rounded-full font-medium leading-none bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                {action.badge}
                              </span>
                            )}
                            {action.loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">{action.label}</span>
                          </div>
                        }
                      >
                        <div className="text-center space-y-3">
                          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                          </div>
                          <h3 className="font-semibold text-lg">Delete Quiz</h3>
                          <p className="text-sm text-muted-foreground">
                            This action is permanent. Are you sure?
                          </p>
                        </div>
                      </ConfirmDialog>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete this quiz permanently</p>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              // Regular action buttons
              return (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer hover:shadow-sm",
                        action.active && "ring-1 ring-offset-1 ring-blue-500",
                        action.disabled && "opacity-60 cursor-not-allowed",
                        action.id === "favorite"
                          ? !isAuthenticated
                            ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300"
                            : action.active
                            ? "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 dark:bg-pink-950/20 dark:border-pink-800 dark:text-pink-300"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
                          : action.id === "share"
                          ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300"
                          : action.id === "visibility"
                          ? action.active
                            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:border-green-800 dark:text-green-300"
                            : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
                      )}
                      onClick={!action.disabled && action.onClick ? action.onClick : undefined}
                    >
                      {action.badge && (
                        <span
                          className={cn(
                            "absolute -top-1 -right-1 px-1 py-0.5 text-[9px] rounded-full font-medium leading-none",
                            action.badgeColor,
                          )}
                        >
                          {action.badge}
                        </span>
                      )}
                      {action.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">{action.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>

          {children && <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">{children}</div>}
        </div>      </div>
    </TooltipProvider>
  )
}
