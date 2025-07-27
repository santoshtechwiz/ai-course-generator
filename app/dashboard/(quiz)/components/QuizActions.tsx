"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Share2, Trash2, Download, Heart, BarChart2, Lock, MoreHorizontal, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/modules/auth"
import { ConfirmDialog } from "./ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

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
  const router = useRouter()
  const { user, subscription, isAuthenticated } = useAuth()

  const currentUserId = user?.id || null
  const canDownloadPDF = subscription?.status?.toLowerCase() === "active"

  const promptLogin = () => toast({
    title: "Authentication required",
    description: "Please log in to perform this action",
    variant: "destructive",
    action: (
      <Button variant="outline" size="sm" onClick={() => router.push("/signin")}>
        Sign In
      </Button>
    ),
  })

  const promptUpgrade = () => toast({
    title: "Premium feature",
    description: "Upgrade to Premium to download PDFs",
    variant: "destructive",
    action: (
      <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/subscription")}>
        Upgrade
      </Button>
    ),
  })

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
        title: field === "isPublic"
          ? value ? "Quiz is now public" : "Quiz is now private"
          : value ? "Added to favorites" : "Removed from favorites",
        description: field === "isPublic"
          ? value ? "Others can now discover your quiz" : "Only you can access this quiz"
          : value ? "Quiz saved to favorites" : "Quiz removed from favorites"
      })
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message, 
        variant: "destructive" 
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
          text: "Test your knowledge with this quiz",
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({ 
          title: "Link copied!", 
          description: "Quiz link copied to clipboard",
          action: (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              Copy Again
            </Button>
          )
        })
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast({ 
          title: "Sharing failed", 
          description: "Please try again", 
          variant: "destructive" 
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
    }
  }

  const actionButtons = useMemo(
    (): ActionButton[] => [
      {
        id: "favorite",
        label: isFavorite ? "Remove favorite" : "Add to favorites",
        icon: Heart,
        loading: isFavoriteLoading,
        onClick: isAuthenticated ? () => updateQuiz("isFavorite", !isFavorite) : promptLogin,
        disabled: !isAuthenticated,
        active: isFavorite,
      },
      {
        id: "share",
        label: "Share quiz",
        icon: Share2,
        loading: false,
        onClick: handleShare,
        disabled: false,
      },
      {
        id: "download",
        label: "Download PDF",
        icon: Download,
        loading: isPdfGenerating,
        onClick: handlePdfDownload,
        disabled: !isAuthenticated || !canDownloadPDF,
        premium: !canDownloadPDF,
      },
      {
        id: "visibility",
        label: isPublic ? "Make private" : "Make public",
        icon: isPublic ? Eye : EyeOff,
        loading: isPublicLoading,
        onClick: () => updateQuiz("isPublic", !isPublic),
        disabled: !isOwner || isPublicLoading,
        active: isPublic,
      },
      {
        id: "delete",
        label: "Delete quiz",
        icon: Trash2,
        loading: isDeleting,
        onClick: handleDelete,
        disabled: !isOwner || isDeleting,
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

  const getButtonVariant = (action: ActionButton) => {
    if (action.active) return "default"
    if (action.destructive) return "destructive"
    return "outline"
  }

  const getButtonClass = (action: ActionButton) => {
    return cn(
      "h-8 px-3 py-1 rounded-md transition-all",
      "hover:scale-[1.03] active:scale-[0.98]",
      "flex items-center gap-2",
      action.active && "shadow-md",
      action.premium && "border-amber-300 bg-amber-50 dark:bg-amber-900/20",
      action.disabled && "opacity-60 cursor-not-allowed"
    )
  }

  const getIconClass = (action: ActionButton) => {
    return cn(
      "h-4 w-4",
      action.active && action.id === "favorite" && "fill-current text-pink-500",
      action.active && action.id === "visibility" && isPublic && "text-green-500",
      action.premium && "text-amber-500"
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className={cn(
          "w-full p-4 bg-card border rounded-xl shadow-sm",
          "transition-all hover:shadow-md",
          className
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Quiz Actions
              {isPublic && (
                <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                  {isOwner ? "Public" : "Shared"}
                </Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage and share your quiz
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {actionButtons.slice(0, 3).map((action) => (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={getButtonVariant(action)}
                      className={getButtonClass(action)}
                      onClick={!action.disabled ? action.onClick : undefined}
                      disabled={action.disabled || action.loading}
                      aria-label={action.label}
                    >
                      {action.loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <BarChart2 className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <>
                          <action.icon className={getIconClass(action)} />
                          <span className="hidden sm:inline">{action.label}</span>
                        </>
                      )}
                      
                      {action.premium && (
                        <Badge variant="premium" className="ml-1 px-1.5 py-0 text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {action.label}
                    {action.disabled && action.premium && " (Premium feature)"}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8 rounded-md"
                      aria-label="More actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>More actions</TooltipContent>
              </Tooltip>
              
              <DropdownMenuContent align="end" className="min-w-[180px]">
                {actionButtons.slice(3).map((action) => (
                  <DropdownMenuItem
                    key={action.id}
                    onSelect={action.onClick}
                    disabled={action.disabled || action.loading}
                    className={cn(
                      "flex items-center gap-2",
                      action.destructive && "text-destructive focus:bg-destructive/10"
                    )}
                  >
                    {action.loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="flex items-center"
                      >
                        <BarChart2 className="h-4 w-4 mr-2" />
                      </motion.div>
                    ) : (
                      <action.icon className={getIconClass(action)} />
                    )}
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <AnimatePresence>
          {isPublic && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t"
            >
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  This quiz is {isOwner ? "public" : "shared with you"}. 
                  {isOwner && " Others can discover it."}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}