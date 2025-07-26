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
  Lock,
  MoreHorizontal,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

interface ActionButton {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
  onClick: (() => void) | (() => Promise<void>)
  disabled: boolean
  active?: boolean
  badge?: string
  color: string
  description: string
  premium?: boolean
  destructive?: boolean
  ariaLabel: string
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
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

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

      // Call the PDF generation API
      const response = await fetch(`/api/quizzes/${quizSlug}/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizData,
          includeAnswers: true,
          format: "A4",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      // Get the PDF blob
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${quizSlug}-quiz.pdf`
      document.body.appendChild(link)
      link.click()

      // Cleanup
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

      if (!response.ok) {
        throw new Error("Failed to delete quiz")
      }

      toast({
        title: "Quiz deleted",
        description: "Quiz deleted successfully",
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
        label: "Favorite",
        icon: Heart,
        loading: isFavoriteLoading,
        onClick: isAuthenticated ? () => updateQuiz("isFavorite", !isFavorite) : promptLogin,
        disabled: !isAuthenticated,
        active: isFavorite,
        badge: !isAuthenticated ? "Sign In" : undefined,
        color: "pink",
        description: isFavorite ? "Remove from favorites" : "Add to favorites",
        ariaLabel: isFavorite ? "Remove quiz from favorites" : "Add quiz to favorites",
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
        ariaLabel: "Share quiz link",
      },
      {
        id: "download",
        label: "PDF",
        icon: Download,
        loading: isPdfGenerating,
        onClick: handlePdfDownload,
        disabled: !isAuthenticated || !canDownloadPDF,
        badge: !isAuthenticated ? "Sign In" : canDownloadPDF ? "Premium" : "Locked",
        color: "emerald",
        description: "Download quiz as PDF",
        premium: !canDownloadPDF,
        ariaLabel: "Download quiz as PDF",
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
              ariaLabel: isPublic ? "Make quiz private" : "Make quiz public",
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
              ariaLabel: "Delete quiz permanently",
            },
          ]
        : []),
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

  const getButtonStyles = (color: string, active?: boolean, disabled?: boolean, premium?: boolean) => {
    const base =
      "group relative flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden"

    if (disabled) {
      return cn(base, "bg-muted/50 border-muted text-muted-foreground cursor-not-allowed")
    }

    const colorMap = {
      pink: active
        ? "bg-pink-500 border-pink-500 text-white hover:bg-pink-600"
        : "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 dark:bg-pink-950/20 dark:border-pink-800 dark:text-pink-300",
      blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300",
      emerald: premium
        ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700 hover:from-yellow-100 hover:to-amber-100 dark:from-yellow-950/20 dark:to-amber-950/20 dark:border-yellow-800 dark:text-yellow-300"
        : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300",
      green:
        "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:border-green-800 dark:text-green-300",
      yellow:
        "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950/20 dark:border-yellow-800 dark:text-yellow-300",
      red: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300",
    }

    return cn(base, colorMap[color as keyof typeof colorMap])
  }

  // Separate primary and secondary actions for better mobile UX
  const primaryActions = actionButtons.slice(0, 3) // favorite, share, download
  const secondaryActions = actionButtons.slice(3) // visibility, delete

  const ActionButton = ({ action, showLabel = true }: { action: ActionButton; showLabel?: boolean }) => {
    const IconComponent = action.icon

    const buttonContent = (
      <div className={getButtonStyles(action.color, action.active, action.disabled, action.premium)}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={false}
        />

        {action.badge && (
          <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white border shadow-sm font-bold z-10 dark:bg-gray-800 dark:border-gray-700">
            {action.badge}
          </span>
        )}

        {action.premium && action.disabled && <Lock className="absolute top-1 left-1 h-3 w-3 text-yellow-600" />}

        <div className="relative z-10 flex items-center gap-2">
          {action.loading ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          ) : (
            <IconComponent
              className={cn("h-4 w-4 sm:h-5 sm:w-5", action.active && action.id === "favorite" && "fill-current")}
            />
          )}
          {showLabel && <span className="hidden sm:inline font-medium">{action.label}</span>}
        </div>
      </div>
    )

    if (action.destructive) {
      return (
        <ConfirmDialog
          onConfirm={action.onClick}
          trigger={
            <button
              type="button"
              disabled={action.disabled}
              aria-label={action.ariaLabel}
              className="focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-xl"
            >
              {buttonContent}
            </button>
          }
        >
          <div className="text-center space-y-4">
            <Trash2 className="mx-auto h-10 w-10 text-red-600" />
            <h3 className="text-lg font-semibold">Delete Quiz</h3>
            <p className="text-muted-foreground text-sm">This action is permanent and cannot be undone.</p>
          </div>
        </ConfirmDialog>
      )
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={!action.disabled ? action.onClick : undefined}
            disabled={action.disabled}
            aria-label={action.ariaLabel}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
            onMouseEnter={() => setHoveredAction(action.id)}
            onMouseLeave={() => setHoveredAction(null)}
          >
            {buttonContent}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-center text-sm">{action.description}</p>
        </TooltipContent>
      </Tooltip>
    )
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
            {/* Desktop Layout */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              <AnimatePresence>
                {actionButtons.map((action) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ActionButton action={action} showLabel={true} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden">
              {/* Primary Actions - Always Visible */}
              <div className="flex justify-center gap-2 mb-4">
                <AnimatePresence>
                  {primaryActions.map((action) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 max-w-[80px]"
                    >
                      <ActionButton action={action} showLabel={false} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Secondary Actions - Dropdown Menu */}
              {secondaryActions.length > 0 && (
                <div className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full max-w-[200px] justify-center gap-2 bg-transparent"
                        aria-label="More quiz actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span>More Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-56">
                      {secondaryActions.map((action, index) => {
                        const IconComponent = action.icon

                        if (action.destructive) {
                          return (
                            <ConfirmDialog
                              key={action.id}
                              onConfirm={action.onClick}
                              trigger={
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  {action.loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <IconComponent className="mr-2 h-4 w-4" />
                                  )}
                                  <span>{action.label}</span>
                                  {action.badge && (
                                    <Badge variant="destructive" className="ml-auto text-xs">
                                      {action.badge}
                                    </Badge>
                                  )}
                                </DropdownMenuItem>
                              }
                            >
                              <div className="text-center space-y-4">
                                <Trash2 className="mx-auto h-10 w-10 text-red-600" />
                                <h3 className="text-lg font-semibold">Delete Quiz</h3>
                                <p className="text-muted-foreground text-sm">
                                  This action is permanent and cannot be undone.
                                </p>
                              </div>
                            </ConfirmDialog>
                          )
                        }

                        return (
                          <DropdownMenuItem
                            key={action.id}
                            onClick={!action.disabled ? action.onClick : undefined}
                            disabled={action.disabled}
                            className="cursor-pointer"
                          >
                            {action.loading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <IconComponent
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  action.active && action.id === "favorite" && "fill-current",
                                )}
                              />
                            )}
                            <span>{action.label}</span>
                            {action.badge && (
                              <Badge
                                variant={action.color === "red" ? "destructive" : "secondary"}
                                className="ml-auto text-xs"
                              >
                                {action.badge}
                              </Badge>
                            )}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
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
