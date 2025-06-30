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
import useSubscription from "@/hooks/use-subscription"
import { useSession } from "next-auth/react"
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
  const { canDownloadPdf: canDownloadPDF } = useSubscription()
  console.log("Can download PDF:", canDownloadPDF);
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
      onClick: () => updateQuiz("isFavorite", !isFavorite),
      loading: isFavoriteLoading,
      disabled: !userId,
      active: isFavorite,
      badge: null,
      badgeColor: "",
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
      onClick: undefined,
      loading: false,
      disabled: !canDownloadPDF,
      active: false,
      badge: canDownloadPDF ? null : "Locked",
      badgeColor: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      lockIcon: !canDownloadPDF,
    },
    ...(isOwner
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
      <div className={cn("w-full max-w-4xl mx-auto", className)}>
        <div className="rounded-xl border p-4 mb-4 bg-gradient-to-r from-blue-50/80 to-blue-100/70 dark:from-blue-950/20 dark:to-blue-950/10 border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1">
                  Quiz Actions <Sparkles className="w-4 h-4 text-blue-500" />
                </h2>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Manage and share your quiz easily
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-0">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">
                <Users className="h-3 w-3 mr-1" />
                Popular
              </Badge>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {actionButtons.map((action) => {
              const Icon = action.icon
              const buttonBase = (
                <div
                  className={cn(
                    "relative p-2 rounded-lg border group cursor-pointer min-h-[56px] flex flex-col items-center justify-center text-center space-y-1 transition hover:shadow-sm",
                    action.active && "ring-1 ring-offset-1 ring-blue-500",
                    action.disabled && "opacity-60 cursor-not-allowed",
                    action.id === "delete" && "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
                    action.id === "download"
                      ? canDownloadPDF
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700"
                      : action.id === "favorite"
                        ? "bg-pink-50 border-pink-200 dark:bg-pink-950/20 dark:border-pink-800"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700"
                  )}
                  onClick={!action.disabled ? action.onClick : undefined}
                  aria-label={action.label}
                >
                  {action.badge && (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-1 px-1.5 py-0.5 text-[10px] rounded-full font-medium",
                        action.badgeColor,
                      )}
                    >
                      {action.badge}
                    </span>
                  )}

                  {action.lockIcon && (
                    <Lock className="absolute top-1 right-1 h-3 w-3 text-gray-400" />
                  )}

                  {action.loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  ) : (
                    <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                  )}

                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{action.label}</span>
                </div>
              )

              if (action.id === "download") {
                return (
                  <Tooltip key={action.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "relative p-2 rounded-lg border group cursor-pointer min-h-[56px] flex flex-col items-center justify-center text-center space-y-1 transition hover:shadow-sm",
                          canDownloadPDF
                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                            : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700",
                          !canDownloadPDF && "opacity-60 cursor-not-allowed",
                        )}
                      >
                        {!canDownloadPDF && (
                          <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 text-[10px] rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Locked
                          </span>
                        )}
                        <QuizPDFDownload
                          quizData={quizData}
                          config={{ showOptions: true, showAnswers: true }}
                          variant="ghost"
                          size="icon"
                          className="!m-0 p-0" // shrink padding inside
                        />
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200">PDF</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{canDownloadPDF ? "Download this quiz" : "Upgrade to download PDF"}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              }

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
                        trigger={buttonBase}
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
                      <p>Delete this quiz</p>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>{buttonBase}</TooltipTrigger>
                  <TooltipContent>
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>

          {children && <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">{children}</div>}
        </div>
      </div>
    </TooltipProvider >
  )
}
