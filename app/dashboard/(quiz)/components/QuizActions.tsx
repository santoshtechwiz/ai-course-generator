"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Share2, Trash2, Download, Heart, BarChart2, Lock, Settings, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/modules/auth"
import { ConfirmDialog } from "./ConfirmDialog"
import { Badge } from "@/components/ui/badge"

interface QuizActionsProps {
  quizId: string
  quizData?: any
  quizSlug: string
  initialIsPublic: boolean
  initialIsFavorite: boolean
  userId: string
  ownerId: string
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
  color: string
  description: string
  premium?: boolean
  destructive?: boolean
}

export function QuizActions({
  quizSlug,
  quizData,
  initialIsPublic,
  initialIsFavorite,
  ownerId,
  className,
}: QuizActionsProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const router = useRouter()
  const { user, subscription, isAuthenticated } = useAuth()

  const currentUserId = user?.id
  const canDownloadPDF =
    subscription?.status?.toLowerCase() === "active" || subscription?.plan?.toLowerCase() !== "free"
  const isOwner = currentUserId === ownerId

  const promptLogin = () =>
    toast({
      title: "Authentication required",
      description: "Please log in to perform this action",
      variant: "destructive",
    })

  const promptUpgrade = () => {
    toast({
      title: "Premium feature",
      description: "Upgrade to Premium to download PDFs",
      variant: "destructive",
    })
    router.push("/dashboard/subscription")
  }

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
        toast({ title: "Sharing failed", description: "Please try again", variant: "destructive" })
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
        title: "PDF Downloaded",
        description: "Quiz PDF has been downloaded successfully",
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

      toast({ title: "Quiz deleted", description: "Quiz deleted successfully" })
      setTimeout(() => router.push("/dashboard"), 500)
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete quiz",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const actionButtons = useMemo(
    (): ActionButton[] => [
      {
        id: "favorite",
        label: "Favorite",
        icon: Heart,
        loading: isFavoriteLoading,
        onClick: isAuthenticated ? () => updateQuiz("isFavorite", !isFavorite) : promptLogin,
        disabled: !isAuthenticated,
        active: isFavorite,
        color: "pink",
        description: isFavorite ? "Remove from favorites" : "Add to favorites",
      },
      {
        id: "share",
        label: "Share",
        icon: Share2,
        loading: false,
        onClick: handleShare,
        disabled: false,
        color: "blue",
        description: "Share this quiz with others",
      },
      {
        id: "download",
        label: "Download PDF",
        icon: Download,
        loading: isPdfGenerating,
        onClick: handlePdfDownload,
        disabled: !isAuthenticated || !canDownloadPDF,
        color: "emerald",
        description: !isAuthenticated
          ? "Sign in to download"
          : !canDownloadPDF
            ? "Upgrade to download PDFs"
            : "Download quiz as PDF",
        premium: !canDownloadPDF,
      },
      {
        id: "visibility",
        label: isPublic ? "Make Private" : "Make Public",
        icon: isPublic ? Eye : EyeOff,
        loading: isPublicLoading,
        onClick: () => updateQuiz("isPublic", !isPublic),
        disabled: !isOwner || isPublicLoading, // Disabled if not owner or loading
        active: isPublic,
        color: isPublic ? "green" : "amber",
        description: isPublic ? "Make quiz private" : "Make quiz public",
      },
      {
        id: "delete",
        label: "Delete",
        icon: Trash2,
        loading: isDeleting,
        onClick: handleDelete,
        disabled: !isOwner || isDeleting, // Disabled if not owner or deleting
        color: "red",
        description: "Permanently delete this quiz",
        destructive: true,
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
    ],
  )

  const getActionButtonStyles = (action: ActionButton) => {
    const baseStyles = "h-9 w-9 rounded-md transition-all duration-200 relative overflow-hidden group"

    if (action.destructive) {
      return cn(
        baseStyles,
        "hover:bg-red-50 hover:text-red-600 hover:border-red-200",
        "dark:hover:bg-red-950/20 dark:hover:text-red-400 dark:hover:border-red-800",
      )
    }

    if (action.premium && action.disabled) {
      return cn(
        baseStyles,
        "bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200",
        "dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-800",
        "hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-950/30 dark:hover:to-yellow-950/30",
      )
    }

    const colorStyles = {
      pink: action.active
        ? "bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-800"
        : "hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 dark:hover:bg-pink-950/20 dark:hover:text-pink-400",
      blue: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/20 dark:hover:text-blue-400",
      emerald:
        "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400",
      green: action.active
        ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800"
        : "hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:hover:bg-green-950/20 dark:hover:text-green-400",
      amber: action.active
        ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800"
        : "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 dark:hover:bg-amber-950/20 dark:hover:text-amber-400",
    }

    return cn(baseStyles, colorStyles[action.color as keyof typeof colorStyles] || colorStyles.blue)
  }

  const ActionButton = ({ action }: { action: ActionButton }) => {
    const IconComponent = action.icon

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              getActionButtonStyles(action),
              "relative group overflow-hidden", // Ensure group and overflow for hover effect
              action.disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={!action.disabled ? action.onClick : undefined}
            disabled={action.disabled || action.loading}
            aria-label={action.label}
          >
            {/* Dynamic background for active/hover states */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-md",
                action.active && action.color === "pink" && "bg-pink-100 dark:bg-pink-900/30",
                action.active && action.color === "green" && "bg-green-100 dark:bg-green-900/30",
                action.active && action.color === "amber" && "bg-amber-100 dark:bg-amber-900/30",
                "group-hover:bg-opacity-20 dark:group-hover:bg-opacity-20",
                "transition-colors duration-200 ease-out"
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: action.active ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />

            <div className="relative z-10 flex items-center justify-center w-full h-full">
              {action.loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <BarChart2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </motion.div>
              ) : (
                <IconComponent
                  className={cn(
                    "h-4 w-4 transition-transform group-hover:scale-110",
                    action.active && action.id === "favorite" && "fill-pink-500 text-pink-500",
                    action.active && action.id === "visibility" && (isPublic ? "text-green-500" : "text-amber-500"),
                    action.premium && action.disabled && "text-amber-600 dark:text-amber-400",
                    !action.active && action.color === "pink" && "text-pink-500",
                    !action.active && action.color === "blue" && "text-blue-500",
                    !action.active && action.color === "emerald" && "text-emerald-500",
                    !action.active && action.color === "green" && "text-green-500",
                    !action.active && action.color === "amber" && "text-amber-500",
                    action.destructive && "text-red-500",
                  )}
                />
              )}

              {action.premium && action.disabled && (
                <Lock className="absolute -top-0.5 -right-0.5 h-3 w-3 text-amber-600 dark:text-amber-400 bg-white dark:bg-gray-900 rounded-full p-0.5 shadow-sm" />
              )}
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-800 backdrop-blur-sm p-2"
          sideOffset={8}
        >
          <div className="flex flex-col items-center px-2 py-1 max-w-[200px]">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{action.label}</p>
            <p className="text-xs text-muted-foreground text-center mt-1 leading-relaxed">{action.description}</p>
            {action.premium && (
              <Badge variant="secondary" className="mt-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                Premium
              </Badge>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        className={cn("w-full max-w-2xl mx-auto", className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex flex-col">
          {/* Toolbar Header */}
          <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-slate-700 via-blue-700 to-indigo-800 dark:from-slate-800 dark:via-blue-800 dark:to-indigo-900 rounded-t-2xl border-b border-slate-500 dark:border-gray-700 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">Quiz Actions</h3>
            </div>
            <Zap className="h-5 w-5 text-yellow-300 animate-pulse" />
          </div>
          {/* Toolbar Actions Row */}
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 px-4 py-5 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 rounded-b-2xl border border-slate-200 dark:border-gray-700 shadow-xl backdrop-blur-md">
            {actionButtons.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                whileHover={{ scale: 1.08, boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
                whileTap={{ scale: 0.96 }}
                className="flex-shrink-0"
              >
                {action.destructive ? (
                  <ConfirmDialog
                    onConfirm={action.onClick}
                    trigger={
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          getActionButtonStyles(action),
                          "relative group overflow-hidden w-12 h-12 flex items-center justify-center border border-red-200 dark:border-red-800",
                          action.disabled && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={action.disabled || action.loading}
                        aria-label={action.label}
                      >
                        <motion.div
                          className={cn(
                            "absolute inset-0 rounded-xl",
                            "bg-red-100 dark:bg-red-900/30",
                            "group-hover:bg-opacity-20 dark:group-hover:bg-opacity-20",
                            "transition-colors duration-200 ease-out"
                          )}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: action.active ? 1 : 0 }}
                          transition={{ duration: 0.2 }}
                        />
                        <div className="relative z-10 flex items-center justify-center">
                          {action.loading ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            >
                              <BarChart2 className="h-6 w-6 text-red-500" />
                            </motion.div>
                          ) : (
                            <action.icon className="h-6 w-6 text-red-500" />
                          )}
                        </div>
                      </Button>
                    }
                  >
                    <div className="text-center space-y-4">
                      <div className="mx-auto h-14 w-14 rounded-full bg-red-100 dark:bg-red-950/20 flex items-center justify-center">
                        <Trash2 className="h-7 w-7 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Quiz</h3>
                        <p className="text-sm text-muted-foreground">Are you sure you want to permanently delete this quiz? This action cannot be undone.</p>
                      </div>
                      <div className="flex justify-center gap-3">
                        <Button variant="outline" onClick={() => { /* Close dialog */ }}>Cancel</Button>
                        <Button variant="destructive" onClick={action.onClick}>Delete</Button>
                      </div>
                    </div>
                  </ConfirmDialog>
                ) : (
                  <ActionButton action={action} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}


