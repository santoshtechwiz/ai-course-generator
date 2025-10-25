"use client"

import React from "react"
import { useState, useCallback, useMemo, memo } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
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
import neo from "@/components/neo/tokens"
import { Share2, Heart, MoreVertical, Eye, EyeOff, Trash2, Lock, Globe, FileText, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAuth } from "@/modules/auth"
import { useDeleteQuiz } from "@/hooks/use-delete-quiz"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import { SubscriptionUpgradeModal } from "@/components/shared"
import { ShareButton } from "@/components/features/share"

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
  userId?: string  // Add userId for ownership verification
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
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { canAccess: canGeneratePdf, reason: pdfDenialReason, requiredPlan } = useFeatureAccess('pdf-generation')
  const [actionState, setActionState] = useState<ActionState>({
    isSharing: false,
    isFavoriting: false,
    isTogglingVisibility: false,
    isDeleting: false,
    isGeneratingPdf: false,
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPdfUpgradePrompt, setShowPdfUpgradePrompt] = useState(false)

  // Check if user is the owner
  const isOwner = user?.id && props.userId && String(user.id) === String(props.userId)

  // Use the mutation hook for deletion
  const deleteQuizMutation = useDeleteQuiz({
    onSuccess: () => {
      toast.success("Quiz deleted successfully!")
      setShowDeleteDialog(false)
      
      // Call the onDelete callback if provided
      props.onDelete?.()
      
      // Redirect to quizzes page after successful deletion
      setTimeout(() => {
        router.push('/dashboard/quizzes')
      }, 1000) // Small delay to show the success toast
    },
    onError: () => {
      toast.error("Failed to delete quiz. Please try again.")
      setShowDeleteDialog(false)
    }
  })

  const updateActionState = useCallback((key: keyof ActionState, value: boolean) => {
    setActionState((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Check if user can perform actions
  const canPerformAction = useCallback((actionType: 'edit' | 'delete') => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to perform this action")
      return false
    }

    // Check ownership for edit/delete actions
    if ((actionType === 'edit' && !isOwner) || (actionType === 'delete' && !isOwner)) {
      toast.error("You don't have permission to perform this action")
      return false
    }

    // Additional server-side check will be performed by API
    return true
  }, [isAuthenticated, user, isOwner])

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
    if (!isAuthenticated) {
      toast.error("Please sign in to favorite quizzes")
      return
    }

    updateActionState("isFavoriting", true)
    const newFavoriteState = !props.isFavorite
    const actionText = newFavoriteState ? "Adding to favorites..." : "Removing from favorites..."
    
    toast.loading(actionText, { id: "favorite-action" })
    
    try {
      const response = await fetch(`/api/quizzes/${props.quizType}/${props.quizSlug}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isFavorite: newFavoriteState })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update favorite status')
      }

      props.onFavoriteChange?.(newFavoriteState)
      toast.success(newFavoriteState ? "Added to favorites!" : "Removed from favorites!", { id: "favorite-action" })
    } catch (error) {
      console.error('Favorite toggle error:', error)
      toast.error(error instanceof Error ? error.message : "Failed to update favorite status", { id: "favorite-action" })
    } finally {
      updateActionState("isFavoriting", false)
    }
  }, [isAuthenticated, props.isFavorite, props.onFavoriteChange, props.quizType, props.quizSlug, updateActionState])

  const handleVisibilityToggle = useCallback(async () => {
    if (!canPerformAction('edit')) return

    updateActionState("isTogglingVisibility", true)
    const newVisibility = !props.isPublic
    const actionText = newVisibility ? "Making quiz public..." : "Making quiz private..."
    
    toast.loading(actionText, { id: "visibility-action" })
    
    try {
      const response = await fetch(`/api/quizzes/${props.quizType}/${props.quizSlug}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isPublic: newVisibility })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update quiz visibility')
      }

      props.onVisibilityChange?.(newVisibility)
      toast.success(newVisibility ? "Quiz is now public!" : "Quiz is now private!", { id: "visibility-action" })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update quiz visibility", { id: "visibility-action" })
    } finally {
      updateActionState("isTogglingVisibility", false)
    }
  }, [canPerformAction, props.isPublic, props.onVisibilityChange, props.quizType, props.quizSlug, updateActionState])

  const handleDelete = useCallback(async () => {
    if (!canPerformAction('delete')) return

    try {
      await deleteQuizMutation.mutateAsync({
        slug: props.quizSlug,
        quizType: props.quizType
      })
    } catch {
      // Error handling is done in the mutation hook
    }
  }, [canPerformAction, deleteQuizMutation, props.quizSlug, props.quizType])

  const handlePdfGeneration = useCallback(async () => {
    // ✅ STEP 1: Check authentication
    if (!isAuthenticated) {
      toast.error("Please sign in to generate PDF")
      return
    }

    // ✅ STEP 2: Check subscription access (CRITICAL FIX)
    if (!canGeneratePdf) {
      if (pdfDenialReason === 'subscription') {
        setShowPdfUpgradePrompt(true)
        toast.error(`PDF generation requires ${requiredPlan || 'a paid'} subscription`, {
          action: {
            label: 'Upgrade',
            onClick: () => router.push('/dashboard/subscription')
          }
        })
        return
      }
      toast.error("You don't have access to PDF generation")
      return
    }

    updateActionState("isGeneratingPdf", true)
    toast.loading("Fetching quiz data for PDF generation...", { id: "pdf-generation" })
    
    try {
      // Fetch quiz data first
      const response = await fetch(`/api/quizzes/${props.quizType}/${props.quizSlug}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch quiz data')
      }

      const quizData = await response.json()
      
      // Validate quiz data
      if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        throw new Error('No questions found in this quiz. Cannot generate PDF.')
      }
      
      console.log('[PDF Generation] Quiz data loaded:', {
        title: quizData.title || props.title,
        questionsCount: quizData.questions.length,
        hasOptions: quizData.questions.some((q: any) => q.options && q.options.length > 0)
      })
      
      toast.loading("Generating PDF...", { id: "pdf-generation" })
      
      // Dynamically import PDF generation libraries to avoid SSR issues
      const { pdf, Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer')
      
      // Create styles
      const styles = StyleSheet.create({
        page: {
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          padding: 30,
          fontFamily: "Helvetica",
        },
        title: {
          fontSize: 24,
          marginBottom: 20,
          fontWeight: "bold",
          textAlign: "center",
          color: "#1F2937",
        },
        question: {
          fontSize: 14,
          marginBottom: 10,
          fontWeight: "bold",
          color: "#1F2937",
        },
        option: {
          fontSize: 12,
          marginBottom: 5,
          color: "#374151",
          paddingLeft: 10,
        },
        correctOption: {
          fontSize: 12,
          marginBottom: 5,
          color: "#10B981",
          paddingLeft: 10,
          fontWeight: "bold",
        },
        explanation: {
          fontSize: 11,
          marginTop: 10,
          color: "#6B7280",
          fontStyle: "italic",
        },
        section: {
          marginBottom: 15,
          padding: 10,
        },
        footer: {
          position: "absolute",
          bottom: 30,
          left: 30,
          right: 30,
          textAlign: "center",
          color: "#6B7280",
          fontSize: 10,
        }
      })

      // Create PDF Document component
      const QuizDocument = () => (
        React.createElement(Document, null,
          React.createElement(Page, { size: "A4", style: styles.page },
            React.createElement(Text, { style: styles.title }, quizData.title || props.title),
            ...(quizData.questions || []).map((question: any, index: number) => 
              React.createElement(View, { key: question.id || index, style: styles.section },
                React.createElement(Text, { style: styles.question }, 
                  `${index + 1}. ${question.question || 'Question not available'}`
                ),
                ...(question.options && Array.isArray(question.options) ? question.options : []).map((option: string, optIndex: number) => 
                  React.createElement(Text, {
                    key: optIndex,
                    style: question.correctAnswer === optIndex ? styles.correctOption : styles.option
                  }, `${String.fromCharCode(65 + optIndex)}. ${option}`)
                ),
                question.explanation ? 
                  React.createElement(Text, { style: styles.explanation }, 
                    `Explanation: ${question.explanation}`
                  ) : null
              )
            ),
            React.createElement(Text, { style: styles.footer }, 
              `© CourseAI ${new Date().getFullYear()}`
            )
          )
        )
      )
      
      const blob = await pdf(QuizDocument()).toBlob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const safeTitle = (quizData.title || props.title).replace(/[^a-z0-9]/gi, "_").toLowerCase()
      link.download = `${safeTitle}_quiz.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("PDF generated and downloaded successfully!", { id: "pdf-generation" })
    } catch (error) {
      console.error('[PDF Generation] Error:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate PDF"
      toast.error(errorMessage, { id: "pdf-generation" })
    } finally {
      updateActionState("isGeneratingPdf", false)
    }
  }, [isAuthenticated, canGeneratePdf, pdfDenialReason, requiredPlan, props.quizType, props.quizSlug, props.title, updateActionState, router])

  return {
    actionState: {
      ...actionState,
      isDeleting: deleteQuizMutation.isPending
    },
    showDeleteDialog,
    setShowDeleteDialog,
    showPdfUpgradePrompt,
    setShowPdfUpgradePrompt,
    handleShare,
    handleFavorite,
    handleVisibilityToggle,
    handleDelete,
    handlePdfGeneration,
    canPerformAction,
    isAuthenticated,
    isOwner,
    canGeneratePdf,
    requiredPlan
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
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant={variant}
              size={size}
              onClick={onClick}
              disabled={loading}
              className={cn("h-9 px-3 transition-all", className)}
              {...props}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              <span className="sr-only">{label}</span>
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
)
ActionButton.displayName = "ActionButton"

// Quiz type configuration with updated theme tokens
const quizTypeConfig = {
  mcq: {
    label: "Multiple Choice",
    color: "bg-accent",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  openended: {
    label: "Open Ended",
    color: "bg-[var(--color-success)]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  blanks: {
    label: "Fill in Blanks",
    color: "bg-[var(--color-warning)]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M2 12h20" />
      </svg>
    ),
  },
  code: {
    label: "Code",
    color: "bg-[var(--color-primary)]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16" />
      </svg>
    ),
  },
}

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
    userId,
    onVisibilityChange,
    onFavoriteChange,
    onDelete,
  }: QuizActionsProps) => {
    const {
      actionState,
      showDeleteDialog,
      setShowDeleteDialog,
      showPdfUpgradePrompt,
      setShowPdfUpgradePrompt,
      handleShare,
      handleFavorite,
      handleVisibilityToggle,
      handleDelete,
      handlePdfGeneration,
      canPerformAction,
      isAuthenticated,
      isOwner,
      canGeneratePdf,
      requiredPlan
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
      userId,
      onVisibilityChange,
      onFavoriteChange,
      onDelete,
    })

    const config = quizTypeConfig[quizType as keyof typeof quizTypeConfig] || {
      label: "Quiz",
      color: "bg-accent",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    }

    const primaryActions = useMemo(
      () => [
        {
          key: "share",
          icon: Share2,
          label: "Share Quiz",
          onClick: handleShare,
          loading: actionState.isSharing,
          show: true,
          variant: "outline" as const,
        },
        {
          key: "favorite",
          icon: Heart,
          label: isFavorite ? "Remove from Favorites" : "Add to Favorites",
          onClick: handleFavorite,
          loading: actionState.isFavoriting,
          show: isAuthenticated, // Only show for authenticated users
          className: isFavorite ? "text-red-600 hover:text-red-700 fill-current" : "hover:text-red-600",
          variant: "outline" as const,
        },
      ],
      [handleShare, handleFavorite, actionState.isSharing, actionState.isFavoriting, isFavorite, isAuthenticated],
    )

      const secondaryActions = useMemo(
      () => {
        const actions = [
        {
          key: "visibility",
          icon: isPublic ? Globe : Lock,
          label: isPublic ? "Make Private" : "Make Public",
          onClick: handleVisibilityToggle,
          loading: actionState.isTogglingVisibility,
          show: isOwner && isAuthenticated,
          className: isPublic ? "text-emerald-600 hover:text-emerald-700" : "text-muted-foreground hover:text-muted-foreground/80",
          variant: "ghost" as const,
        },
        {
          key: "pdf",
          icon: FileText,
          label: "Generate PDF",
          onClick: handlePdfGeneration,
          loading: actionState.isGeneratingPdf,
          show: showPdfGeneration && isAuthenticated,
          variant: "ghost" as const,
        },
        {
          key: "delete",
          icon: Trash2,
          label: "Delete Quiz",
          onClick: () => setShowDeleteDialog(true),
          loading: actionState.isDeleting,
          show: isOwner && isAuthenticated,
          className: "text-red-600 hover:text-red-700",
          variant: "ghost" as const,
        },
      ]
        return actions
      },
      [
        handleVisibilityToggle,
        handlePdfGeneration,
        setShowDeleteDialog,
        actionState.isTogglingVisibility,
        actionState.isGeneratingPdf,
        actionState.isDeleting,
        isOwner,
        isPublic,
        showPdfGeneration,
        isAuthenticated,
        variant,
      ],
    )

    if (variant === "minimal") {
      return (
        <>
          <div className={cn("flex items-center gap-1 flex-wrap", className)}>
            <ActionButton 
              icon={Share2} 
              label="Share" 
              onClick={handleShare} 
              loading={actionState.isSharing} 
              variant="ghost"
            />
            {isAuthenticated && (
              <>
                <ActionButton
                  icon={Heart}
                  label={isFavorite ? "Unfavorite" : "Favorite"}
                  onClick={handleFavorite}
                  loading={actionState.isFavoriting}
                  className={isFavorite ? "text-red-600 hover:text-red-700 fill-current" : "hover:text-red-600"}
                  variant="ghost"
                />
                {canEdit && (
                  <ActionButton
                    icon={isPublic ? Globe : Lock}
                    label={isPublic ? "Make Private" : "Make Public"}
                    onClick={handleVisibilityToggle}
                    loading={actionState.isTogglingVisibility}
                    className={isPublic ? "text-emerald-600 hover:text-emerald-700" : "text-muted-foreground hover:text-muted-foreground/80"}
                    variant="ghost"
                  />
                )}
              </>
            )}
          </div>
          {/* PDF Generation Upgrade Prompt */}
          {showPdfUpgradePrompt && typeof document !== 'undefined' && createPortal(
            <SubscriptionUpgradeModal
              feature="pdf-generation"
              requiredPlan={requiredPlan || 'BASIC'}
              onClose={() => setShowPdfUpgradePrompt(false)}
              customMessage="Unlock PDF Generation"
            />,
            document.body
          )}
        </>
      )
    }

    if (variant === "compact") {
      return (
        <div className={cn("flex items-center gap-3 flex-wrap", className)}>
          {/* Status Badge - Neobrutalism styling */}
          <Badge
            variant={isPublic ? "default" : "neutral"}
            className={cn(
              neo.badge,
              "text-xs font-black border-3 shadow-[3px_3px_0px_0px_hsl(var(--border))] px-3 py-1.5 h-10 flex items-center gap-2",
              isPublic
                ? "bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)] dark:bg-[var(--color-success)]/10 dark:text-[var(--color-success)] dark:border-[var(--color-success)]"
                : "bg-muted dark:bg-muted/50 text-muted-foreground border-border"
            )}
          >
            {isPublic ? (
              <>
                <Globe className="w-3.5 h-3.5" />
                Public
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Private
              </>
            )}
          </Badge>

          {/* Share with Friends Button (using Share Module) */}
          {quizId && (
            <ShareButton
              resourceType="quiz"
              resourceId={quizId}
              resourceTitle={title}
              resourceSlug={quizSlug}
              variant="noShadow"
              size="sm"
              showLabel={false}
              className="h-10 px-3 border-3 shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--border))] transition-all duration-100"
            />
          )}

          {/* Primary Actions - Improved sizing and spacing */}
          {primaryActions
            .filter((action) => action.show)
            .map((action) => (
              <motion.div
                key={action.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.loading}
                  className={cn(
                    "h-10 px-4 border-3 shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--border))] transition-all duration-100 font-bold",
                    action.className
                  )}
                >
                  {action.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <action.icon className="w-4 h-4" />
                  )}
                  <span className="sr-only">{action.label}</span>
                </Button>
              </motion.div>
            ))}

          {/* More Actions Dropdown - Improved button styling */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 px-3 border-3 shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--border))] transition-all duration-100 font-bold"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-3 shadow-[4px_4px_0px_0px_hsl(var(--border))]">
              {(() => {
                const visibleActions = secondaryActions.filter((action) => action.show)
                return visibleActions.map((action, index) => (
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
                ))
              })()}
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
                  className="bg-destructive hover:bg-destructive/80"
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

          {/* PDF Generation Upgrade Prompt */}
          {showPdfUpgradePrompt && typeof document !== 'undefined' && createPortal(
            <SubscriptionUpgradeModal
              feature="pdf-generation"
              requiredPlan={requiredPlan || 'BASIC'}
              onClose={() => setShowPdfUpgradePrompt(false)}
              customMessage="Unlock PDF Generation"
            />,
            document.body
          )}
        </div>
      )
    }

    // Default variant
    return (
      <motion.div
        className={cn("flex flex-col gap-4 bg-card border border-border rounded-lg p-4", className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Quiz Type Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg text-white", config.color)}>
              {config.icon}
            </div>
            <h3 className="font-semibold text-lg">{config.label} Actions</h3>
          </div>
          
          <Badge variant={isPublic ? "default" : "neutral"} className={cn(neo.badge, "text-xs")}>
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
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
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
                variant={action.variant}
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
                variant={action.variant}
              />
            ))}
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
                className="bg-destructive hover:bg-destructive/80"
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

        {/* PDF Generation Upgrade Prompt */}
        {showPdfUpgradePrompt && typeof document !== 'undefined' && createPortal(
          <SubscriptionUpgradeModal
            feature="pdf-generation"
            requiredPlan={requiredPlan || 'BASIC'}
            onClose={() => setShowPdfUpgradePrompt(false)}
            customMessage="Unlock PDF Generation"
          />,
          document.body
        )}
      </motion.div>
    )
  },
)

QuizActions.displayName = "QuizActions"

export { QuizActions }