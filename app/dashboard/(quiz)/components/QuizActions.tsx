"use client"

import type React from "react"

import { useState, useCallback, useMemo, memo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Share2, Heart, MoreVertical, Eye, EyeOff, Trash2, Lock, Globe, FileText, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Types
interface QuizActionsProps {
  quizId: string
  quizSlug: string
  quizType: string
  title: string
  isPublic?: boolean
  isFavorite?: boolean
  canEdit?: boolean
  canDelete?: boolean
  showPdfGeneration?: boolean
  className?: string
  variant?: "default" | "compact" | "minimal"
  onVisibilityChange?: (isPublic: boolean) => void
  onFavoriteChange?: (isFavorite: boolean) => void
  onDelete?: () => void
}

interface ActionState {
  isSharing: boolean
  isFavoriting: boolean
  isTogglingVisibility: boolean
  isDeleting: boolean
  isGeneratingPdf: boolean
}

// Custom hook for quiz actions
const useQuizActions = (props: QuizActionsProps) => {
  const [actionState, setActionState] = useState<ActionState>({
    isSharing: false,
    isFavoriting: false,
    isTogglingVisibility: false,
    isDeleting: false,
    isGeneratingPdf: false,
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const updateActionState = useCallback((key: keyof ActionState, value: boolean) => {
    setActionState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleShare = useCallback(async () => {
    updateActionState("isSharing", true)
    try {
      const shareUrl = `${window.location.origin}/dashboard/${props.quizType}/${props.quizSlug}`

      if (navigator.share) {
        await navigator.share({
          title: props.title,
          text: `Check out this ${props.quizType} quiz: ${props.title}`,
          url: shareUrl,
        })
        toast.success("Quiz shared successfully!")
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast.success("Quiz link copied to clipboard!")
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error("Failed to share quiz")
      }
    } finally {
      updateActionState("isSharing", false)
    }
  }, [props.quizSlug, props.quizType, props.title, updateActionState])

  const handleFavorite = useCallback(async () => {
    updateActionState("isFavoriting", true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      const newFavoriteState = !props.isFavorite
      props.onFavoriteChange?.(newFavoriteState)

      toast.success(newFavoriteState ? "Added to favorites!" : "Removed from favorites!")
    } catch (error) {
      toast.error("Failed to update favorite status")
    } finally {
      updateActionState("isFavoriting", false)
    }
  }, [props.isFavorite, props.onFavoriteChange, updateActionState])

  const handleVisibilityToggle = useCallback(async () => {
    updateActionState("isTogglingVisibility", true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      const newVisibility = !props.isPublic
      props.onVisibilityChange?.(newVisibility)

      toast.success(newVisibility ? "Quiz is now public!" : "Quiz is now private!")
    } catch (error) {
      toast.error("Failed to update quiz visibility")
    } finally {
      updateActionState("isTogglingVisibility", false)
    }
  }, [props.isPublic, props.onVisibilityChange, updateActionState])

  const handleDelete = useCallback(async () => {
    updateActionState("isDeleting", true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      props.onDelete?.()
      toast.success("Quiz deleted successfully!")
    } catch (error) {
      toast.error("Failed to delete quiz")
    } finally {
      updateActionState("isDeleting", false)
      setShowDeleteDialog(false)
    }
  }, [props.onDelete, updateActionState])

  const handlePdfGeneration = useCallback(async () => {
    updateActionState("isGeneratingPdf", true)
    try {
      // Simulate PDF generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast.success("PDF generated successfully!")
    } catch (error) {
      toast.error("Failed to generate PDF")
    } finally {
      updateActionState("isGeneratingPdf", false)
    }
  }, [updateActionState])

  return {
    actionState,
    showDeleteDialog,
    setShowDeleteDialog,
    handleShare,
    handleFavorite,
    handleVisibilityToggle,
    handleDelete,
    handlePdfGeneration,
  }
}

// Action Button Component
const ActionButton = memo(
  ({
    icon: Icon,
    label,
    onClick,
    loading = false,
    variant = "ghost",
    size = "sm",
    className,
    ...props
  }: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    onClick: () => void
    loading?: boolean
    variant?: "ghost" | "outline" | "default"
    size?: "sm" | "default"
    className?: string
    [key: string]: any
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={onClick}
            disabled={loading}
            className={cn("h-9 px-3", className)}
            {...props}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
)
ActionButton.displayName = "ActionButton"

// Main Actions Component
const QuizActions = memo(
  ({
    quizId,
    quizSlug,
    quizType,
    title,
    isPublic = false,
    isFavorite = false,
    canEdit = true,
    canDelete = true,
    showPdfGeneration = false,
    className,
    variant = "default",
    onVisibilityChange,
    onFavoriteChange,
    onDelete,
  }: QuizActionsProps) => {
    const {
      actionState,
      showDeleteDialog,
      setShowDeleteDialog,
      handleShare,
      handleFavorite,
      handleVisibilityToggle,
      handleDelete,
      handlePdfGeneration,
    } = useQuizActions({
      quizId,
      quizSlug,
      quizType,
      title,
      isPublic,
      isFavorite,
      canEdit,
      canDelete,
      showPdfGeneration,
      onVisibilityChange,
      onFavoriteChange,
      onDelete,
    })

    const primaryActions = useMemo(
      () => [
        {
          key: "share",
          icon: Share2,
          label: "Share Quiz",
          onClick: handleShare,
          loading: actionState.isSharing,
          show: true,
        },
        {
          key: "favorite",
          icon: Heart,
          label: isFavorite ? "Remove from Favorites" : "Add to Favorites",
          onClick: handleFavorite,
          loading: actionState.isFavoriting,
          show: true,
          className: isFavorite ? "text-red-500 hover:text-red-600" : "",
        },
      ],
      [handleShare, handleFavorite, actionState.isSharing, actionState.isFavoriting, isFavorite],
    )

    const secondaryActions = useMemo(
      () => [
        {
          key: "visibility",
          icon: isPublic ? Eye : EyeOff,
          label: isPublic ? "Make Private" : "Make Public",
          onClick: handleVisibilityToggle,
          loading: actionState.isTogglingVisibility,
          show: canEdit,
        },
        {
          key: "pdf",
          icon: FileText,
          label: "Generate PDF",
          onClick: handlePdfGeneration,
          loading: actionState.isGeneratingPdf,
          show: showPdfGeneration,
        },
        {
          key: "delete",
          icon: Trash2,
          label: "Delete Quiz",
          onClick: () => setShowDeleteDialog(true),
          loading: actionState.isDeleting,
          show: canDelete,
          className: "text-red-500 hover:text-red-600",
        },
      ],
      [
        isPublic,
        handleVisibilityToggle,
        handlePdfGeneration,
        setShowDeleteDialog,
        actionState.isTogglingVisibility,
        actionState.isGeneratingPdf,
        actionState.isDeleting,
        canEdit,
        canDelete,
        showPdfGeneration,
      ],
    )

    if (variant === "minimal") {
      return (
        <div className={cn("flex items-center gap-1", className)}>
          <ActionButton icon={Share2} label="Share" onClick={handleShare} loading={actionState.isSharing} />
          <ActionButton
            icon={Heart}
            label={isFavorite ? "Unfavorite" : "Favorite"}
            onClick={handleFavorite}
            loading={actionState.isFavoriting}
            className={isFavorite ? "text-red-500" : ""}
          />
        </div>
      )
    }

    if (variant === "compact") {
      return (
        <div className={cn("flex items-center gap-2", className)}>
          {/* Status Badge */}
          <Badge variant={isPublic ? "default" : "secondary"} className="text-xs">
            {isPublic ? (
              <>
                <Globe className="w-3 h-3 mr-1" />
                Public
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Private
              </>
            )}
          </Badge>

          {/* Primary Actions */}
          {primaryActions
            .filter((action) => action.show)
            .map((action) => (
              <ActionButton
                key={action.key}
                icon={action.icon}
                label={action.label}
                onClick={action.onClick}
                loading={action.loading}
                className={action.className}
              />
            ))}

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 px-2">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {secondaryActions
                .filter((action) => action.show)
                .map((action, index) => (
                  <div key={action.key}>
                    {index > 0 && action.key === "delete" && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={action.onClick}
                      disabled={action.loading}
                      className={cn("flex items-center gap-2", action.className)}
                    >
                      {action.loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <action.icon className="w-4 h-4" />
                      )}
                      {action.label}
                    </DropdownMenuItem>
                  </div>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={actionState.isDeleting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {actionState.isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }

    // Default variant
    // Heading color by quiz type
    const headingColor = quizType === "mcq"
      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
      : quizType === "openended"
      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
      : quizType === "blanks"
      ? "bg-gradient-to-r from-cyan-500 to-blue-400 text-white"
      : quizType === "code"
      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
      : "bg-primary text-white"

    const headingText = quizType === "mcq"
      ? "Multiple Choice Quiz Actions"
      : quizType === "openended"
      ? "Open-Ended Quiz Actions"
      : quizType === "blanks"
      ? "Fill in the Blanks Quiz Actions"
      : quizType === "code"
      ? "Code Quiz Actions"
      : "Quiz Actions"

    return (
      <motion.div
        className={cn("flex flex-col gap-2", className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Heading */}
        <div className={cn(
          "rounded-lg px-4 py-2 text-lg font-bold shadow-sm w-fit mb-1",
          headingColor
        )}>
          {headingText}
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <Badge variant={isPublic ? "default" : "secondary"} className="text-xs">
            {isPublic ? (
              <>
                <Globe className="w-3 h-3 mr-1" />
                Public
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Private
              </>
            )}
          </Badge>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {primaryActions
              .filter((action) => action.show)
              .map((action) => (
                <ActionButton
                  key={action.key}
                  icon={action.icon}
                  label={action.label}
                  onClick={action.onClick}
                  loading={action.loading}
                  className={action.className}
                />
              ))}

            {secondaryActions
              .filter((action) => action.show)
              .map((action) => (
                <ActionButton
                  key={action.key}
                  icon={action.icon}
                  label={action.label}
                  onClick={action.onClick}
                  loading={action.loading}
                  className={action.className}
                />
              ))}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={actionState.isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {actionState.isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    )
  },
)

QuizActions.displayName = "QuizActions"

export { QuizActions }
