"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  Share2,
  Trash2,
  Download,
  Heart,
  Settings,
  Loader2,
  TrendingUp,
  Crown,
  Lock,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  const router = useRouter()
  const { user, subscription, isAuthenticated } = useAuth()
  const currentUserId = user?.id
  const canDownloadPDF = subscription?.status.toLowerCase() === "active" || subscription?.plan.toLocaleLowerCase()!== "free";

  const isOwner = currentUserId === ownerId

  const promptLogin = () =>
    toast({
      title: "Authentication required",
      description: "Please log in to perform this action",
      variant: "destructive",
    })

  const promptUpgrade = () =>
    toast({
      title: "Premium feature",
      description: "Upgrade to Premium to download PDFs",
      variant: "destructive",
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

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await toast.promise(fetch(`/api/quizzes/common/${quizSlug}`, { method: "DELETE" }), {
        loading: "Deleting quiz...",
        success: "Quiz deleted successfully",
        error: "Failed to delete quiz",
      })
      setTimeout(() => router.push("/dashboard"), 500)
    } finally {
      setIsDeleting(false)
    }
  }

  const actionButtons = useMemo(
    () => [
      {
        id: "favorite",
        label: "Favorite",
        icon: Heart,
        loading: isFavoriteLoading,
        onClick: isAuthenticated ? () => updateQuiz("isFavorite", !isFavorite) : promptLogin,
        disabled: !isAuthenticated,
        active: isFavorite,
        badge: !isAuthenticated ? "Sign In" : undefined,
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
        badge: "Public",
        color: "blue",
        description: "Share this quiz with others",
      },
      {
        id: "download",
        label: "PDF",
        icon: Download,
        loading: false,
        onClick: !isAuthenticated ? promptLogin : !canDownloadPDF ? promptUpgrade : undefined,
        disabled: !isAuthenticated || !canDownloadPDF,
        badge: !isAuthenticated ? "Sign In" : canDownloadPDF ? "Premium" : "Locked",
        color: "emerald",
        description: "Download quiz as PDF",
        premium: !canDownloadPDF,
      },
      ...(isOwner && isAuthenticated
        ? [
            {
              id: "visibility",
              label: isPublic ? "Public" : "Private",
              icon: isPublic ? Eye : EyeOff,
              loading: isPublicLoading,
              onClick: () => updateQuiz("isPublic", !isPublic),
              disabled: false,
              badge: isPublic ? "Live" : "Draft",
              active: isPublic,
              color: isPublic ? "green" : "yellow",
              description: isPublic ? "Make quiz private" : "Make quiz public",
            },
            {
              id: "delete",
              label: "Delete",
              icon: Trash2,
              loading: isDeleting,
              onClick: handleDelete,
              disabled: false,
              badge: "Danger",
              color: "red",
              description: "Permanently delete this quiz",
              destructive: true,
            },
          ]
        : []),
    ],
    [isAuthenticated, isFavorite, isFavoriteLoading, isPublic, isPublicLoading, isDeleting, canDownloadPDF, isOwner],
  )

  const getButtonStyles = (color: string, active?: boolean, disabled?: boolean, premium?: boolean) => {
    const base =
      "group relative flex items-center justify-center sm:justify-start gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md sm:min-w-[140px] min-w-[48px] h-12 sm:h-14 overflow-hidden"

    if (disabled) {
      return cn(base, "bg-muted/50 border-muted text-muted-foreground cursor-not-allowed")
    }

    const colorMap = {
      pink: active
        ? "bg-pink-500 border-pink-500 text-white hover:bg-pink-600"
        : "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100",
      blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
      emerald: premium
        ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700 hover:from-yellow-100 hover:to-amber-100"
        : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
      green: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100",
      red: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
    }

    return cn(base, colorMap[color as keyof typeof colorMap])
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        className={cn("w-full", className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Settings className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Quiz Actions</h3>
                  <p className="text-sm text-muted-foreground">Control your quiz from here</p>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Badge
                  variant="secondary"
                  className="text-xs px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 dark:from-blue-950/20 dark:to-purple-950/20 dark:text-blue-300 dark:border-blue-800"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Interactive
                </Badge>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <AnimatePresence>
                {actionButtons.map(
                  ({
                    id,
                    label,
                    icon: Icon,
                    loading,
                    disabled,
                    onClick,
                    badge,
                    active,
                    color,
                    description,
                    premium,
                    destructive,
                  }) => {
                    const showLock = premium && disabled
                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onHoverStart={() => setHoveredAction(id)}
                        onHoverEnd={() => setHoveredAction(null)}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {destructive ? (
                              <ConfirmDialog
                                onConfirm={onClick}
                                trigger={
                                  <div className={getButtonStyles(color, active, disabled)}>
                                    <motion.div
                                      className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                      initial={false}
                                    />
                                    {badge && (
                                      <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white border shadow-sm font-bold z-10">
                                        {badge}
                                      </span>
                                    )}
                                    {showLock && (
                                      <Lock className="absolute top-1 left-1 h-4 w-4 text-yellow-600" />
                                    )}
                                    <div className="relative z-10 flex items-center gap-2">
                                      {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                      ) : (
                                        <Icon className={cn("h-5 w-5", active && id === "favorite" && "fill-current")} />
                                      )}
                                      <span className="hidden sm:inline font-medium">{label}</span>
                                    </div>
                                  </div>
                                }
                              >
                                <div className="text-center space-y-4">
                                  <Trash2 className="mx-auto h-10 w-10 text-red-600" />
                                  <h3 className="text-lg font-semibold">Delete Quiz</h3>
                                  <p className="text-muted-foreground text-sm">This action is permanent.</p>
                                </div>
                              </ConfirmDialog>
                            ) : (
                              <div
                                className={getButtonStyles(color, active, disabled, premium)}
                                onClick={!disabled ? onClick : undefined}
                              >
                                {badge && (
                                  <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white border shadow-sm font-bold z-10">
                                    {badge}
                                  </span>
                                )}
                                {showLock && (
                                  <Lock className="absolute top-1 left-1 h-4 w-4 text-yellow-600" />
                                )}
                                <div className="relative z-10 flex items-center gap-2">
                                  {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  ) : (
                                    <Icon className={cn("h-5 w-5", active && id === "favorite" && "fill-current")} />
                                  )}
                                  <span className="hidden sm:inline font-medium">{label}</span>
                                </div>
                              </div>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-center text-sm">{description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </motion.div>
                    )
                  },
                )}
              </AnimatePresence>
            </div>

            {children && (
              <>
                <Separator className="my-6" />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  {children}
                </motion.div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}
