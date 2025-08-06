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
import { toast } from "@/components/ui/use-toast"
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
import UnifiedPdfGenerator from "@/components/shared/UnifiedPdfGenerator"
import type { PdfData, PdfConfig } from "@/components/shared/UnifiedPdfGenerator"
import { useOwnership } from "@/lib/ownership"

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
  // Validate required props
  if (!quizSlug) {
    console.error('QuizActions: quizSlug is required')
    return <div className="text-red-500 text-sm">Error: Invalid quiz slug</div>
  }

  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const router = useRouter()
  const { user, subscription, isAuthenticated } = useAuth()
  
  // Centralized ownership detection - auto-detects ownership from quiz data
  const ownership = useOwnership(quizData)
  
  // Use detected ownership or fallback to prop (for backward compatibility)
  const finalIsOwner = ownership.isOwner || isOwner

  // Check if mobile on mount
  const checkMobile = () => setIsMobile(window.innerWidth < 768)
  React.useEffect(() => {
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const currentUserId = user?.id || null

  // Debug current state
  React.useEffect(() => {
    console.log('QuizActions state:', {
      isOwner,
      finalIsOwner,
      currentUserId,
      isAuthenticated,
      ownershipDetection: ownership,
      quizData: quizData ? { id: quizData.id, quizType: quizData.quizType, userId: quizData.userId } : null
    })
  }, [isOwner, finalIsOwner, currentUserId, isAuthenticated, ownership, quizData])

  const promptLogin = useCallback(
    () =>
      toast({
        title: "Authentication required",
        description: "Please log in to perform this action",
        variant: "destructive",
      }),
    [router],
  )

  const promptUpgrade = useCallback(
    () =>
      toast({
        title: "Premium feature",
        description: "Upgrade to Premium to download PDFs",
        variant: "destructive",
      }),
    [router],
  )

  const updateQuiz = async (field: "isPublic" | "isFavorite", value: boolean) => {
    const setLoading = field === "isPublic" ? setIsPublicLoading : setIsFavoriteLoading
    if (!isAuthenticated || !currentUserId) return promptLogin()

    if (field === "isPublic" && !finalIsOwner) {
      toast({
        title: "Permission denied",
        description: "Only the quiz owner can change visibility",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      // Update optimistically for better UX
      field === "isPublic" ? setIsPublic(value) : setIsFavorite(value)
      
      // Construct the correct API endpoint
      const updateEndpoint = `/api/quizzes/${quizData?.quizType || 'common'}/${quizSlug}`
      
      console.log('Updating quiz via:', updateEndpoint, 'with data:', { [field]: value }) // Debug log
      
      const res = await fetch(updateEndpoint, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUserId}` // Add auth if needed
        },
        body: JSON.stringify({ [field]: value }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        // Revert state if API call fails
        field === "isPublic" ? setIsPublic(!value) : setIsFavorite(!value)
        throw new Error(data.error || data.message || `Server error: ${res.status}`)
      }
      
      // Show success toast
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
      console.error('Update error:', err) // Debug log
      toast({
        title: "Error",
        description: err.message || "Failed to update quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      // Construct the correct share URL based on quiz type
      const quizType = quizData?.quizType || 'quiz'
      const shareUrl = `${window.location.origin}/dashboard/${quizType}/${quizSlug}`
      
      console.log('Sharing URL:', shareUrl) // Debug log
      
      if (navigator.share && isMobile) {
        await navigator.share({
          title: quizData?.title || "Check out this quiz!",
          text: `Test your knowledge with this ${quizType} quiz`,
          url: shareUrl,
        })
        
        toast({
          title: "Shared successfully!",
          description: "Quiz shared via native sharing",
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link copied!",
          description: "Quiz link copied to clipboard",
        })
      }
    } catch (err: any) {
      console.error('Share error:', err) // Debug log
      
      if (err.name !== "AbortError") {
        // Fallback: try to copy to clipboard
        try {
          const quizType = quizData?.quizType || 'quiz'
          const shareUrl = `${window.location.origin}/dashboard/${quizType}/${quizSlug}`
          await navigator.clipboard.writeText(shareUrl)
          
          toast({
            title: "Link copied!",
            description: "Quiz link copied to clipboard",
          })
        } catch (clipboardErr) {
          toast({
            title: "Sharing failed",
            description: "Unable to share or copy link. Please try again.",
            variant: "destructive",
          })
        }
      }
    }
  }

  // Prepare PDF data based on quiz type
  const pdfData = useMemo((): PdfData => {
    if (!quizData) return { title: "Quiz", questions: [] }

    const quizType = quizData.quizType?.toLowerCase() || "mcq"
    
    if (quizType === "flashcard") {
      return {
        title: quizData.title || "Flashcard Quiz",
        description: quizData.description,
        flashCards: quizData.flashCards || quizData.questions?.map((q: any) => ({
          id: q.id,
          question: q.question,
          answer: q.answer
        })) || []
      }
    }

    // For MCQ, open-ended, and other quiz types
    return {
      title: quizData.title || "Quiz",
      description: quizData.description,
      questions: quizData.questions?.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        answer: q.answer,
        explanation: q.explanation
      })) || []
    }
  }, [quizData])

  const pdfConfig: PdfConfig = {
    showAnswers: true,
    highlightCorrectAnswers: true,
    showExplanations: true,
    includeAnswerKey: true,
    showCopyright: true,
    copyrightText: `© CourseAI ${new Date().getFullYear()}`,
    questionsPerPage: 8,
    primaryColor: "#1F2937",
    highlightColor: "#10B981",
  }

  const getPdfType = () => {
    const quizType = quizData?.quizType?.toLowerCase()
    return quizType === "flashcard" ? "flashcards" : "quiz"
  }

  const handleDelete = async () => {
    if (!finalIsOwner) {
      toast({
        title: "Permission denied",
        description: "Only the quiz owner can delete this quiz",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)
      
      // Construct the correct API endpoint with quizType
      const deleteEndpoint = `/api/quizzes/${quizData?.quizType || 'common'}/${quizSlug}`
      
      console.log('Deleting quiz via:', deleteEndpoint) // Debug log
      
      const response = await fetch(deleteEndpoint, { 
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.id}` // Add auth if needed
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Server error: ${response.status}`)
      }

      toast({
        title: "Quiz deleted",
        description: "Redirecting to dashboard...",
      })
      
      // Add a delay to let the user see the success message
      setTimeout(() => router.push("/dashboard"), 1000)
    } catch (error: any) {
      console.error('Delete error:', error) // Debug log
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const actionButtons = useMemo(
    (): ActionButton[] => {
      console.log('Building action buttons. finalIsOwner:', finalIsOwner, 'user:', currentUserId, 'quizData:', quizData) // Debug log
      
      const baseActions: ActionButton[] = [
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
      ]

      // Owner-only actions
      if (finalIsOwner && currentUserId) {
        console.log('Adding owner actions for user:', currentUserId) // Debug log
        baseActions.push(
          {
            id: "visibility",
            label: isPublic ? "Make private" : "Make public",
            icon: isPublic ? Eye : EyeOff,
            loading: isPublicLoading,
            onClick: () => updateQuiz("isPublic", !isPublic),
            disabled: isPublicLoading,
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
            disabled: isDeleting,
            destructive: true,
            category: "utility",
            priority: "secondary",
          }
        )
      }

      console.log('Final action buttons:', baseActions.map(a => a.id)) // Debug log
      return baseActions
    },
    [
      isAuthenticated,
      isFavorite,
      isFavoriteLoading,
      isPublic,
      isPublicLoading,
      isDeleting,
      finalIsOwner,
      currentUserId,
      promptLogin,
      handleShare,
      updateQuiz,
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
                {action.disabled && !action.premium && !isAuthenticated && " (Login required)"}
              </TooltipContent>
            </Tooltip>
          ))}

          {/* PDF Download Component for Mobile */}
          <UnifiedPdfGenerator
            data={pdfData}
            type={getPdfType()}
            config={pdfConfig}
            fileName={`${quizData?.title || quizSlug}-quiz.pdf`}
            buttonText=""
            variant="ghost"
            size="default"
            className="h-12 w-12 p-0 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-lg"
          />

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
                      {/* Show dot indicator if there are owner actions */}
                      {finalIsOwner && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                          {secondaryActions.length}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">
                  More actions {finalIsOwner && "(Owner)"}
                </TooltipContent>
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
                        {category === "utility" && finalIsOwner && (
                          <Badge variant="outline" className="ml-2 text-xs">Owner</Badge>
                        )}
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

        {finalIsOwner && (
          <ConfirmDialog
            isOpen={showDeleteDialog}
            onCancel={() => setShowDeleteDialog(false)}
            onConfirm={handleDelete}
            title="Delete Quiz"
            description="Are you sure you want to delete this quiz? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
          />
        )}
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
                  {finalIsOwner ? "Public" : "Shared"}
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
            
            {/* PDF Download Component */}
            <div className="flex items-center gap-2">
              <div className="w-1 h-8 rounded-full bg-blue-500" />
              <UnifiedPdfGenerator
                data={pdfData}
                type={getPdfType()}
                config={pdfConfig}
                fileName={`${quizData?.title || quizSlug}-quiz.pdf`}
                buttonText="Download PDF"
                variant="outline"
                size="sm"
                className="h-9 px-3 gap-2 transition-all duration-200"
              />
            </div>
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
                  {finalIsOwner ? "Public Quiz" : "Shared Quiz"}
                </h4>
                <p className="text-xs text-green-700 dark:text-green-300">
                  This quiz is {finalIsOwner ? "public" : "shared with you"}.
                  {finalIsOwner && " Others can discover and take it."}
                </p>
              </div>
              {finalIsOwner && (
                <Badge variant="outline" className="border-green-300 text-green-700 dark:text-green-300 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Discoverable
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Debug Panel (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mx-4 mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="text-xs font-mono text-yellow-800 dark:text-yellow-200">
              <div><strong>Debug Info:</strong></div>
              <div>isOwner: {String(isOwner)}</div>
              <div>currentUserId: {currentUserId || 'null'}</div>
              <div>quizData.userId: {quizData?.userId || 'null'}</div>
              <div>isAuthenticated: {String(isAuthenticated)}</div>
              <div>quizType: {quizData?.quizType || 'unknown'}</div>
              <div>Actions: {actionButtons.map(a => a.id).join(', ')}</div>
            </div>
          </div>
        )}

        {finalIsOwner && (
          <ConfirmDialog
            isOpen={showDeleteDialog}
            onCancel={() => setShowDeleteDialog(false)}
            onConfirm={handleDelete}
            title="Delete Quiz"
            description="Are you sure you want to delete this quiz? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
          />
        )}
      </div>
    </TooltipProvider>
  )
}

