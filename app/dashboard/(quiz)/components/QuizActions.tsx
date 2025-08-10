"use client"

import React from "react"
import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  Share2,
  Trash2,
  Download,
  Heart,
  MoreHorizontal,
  Sparkles,
  Copy,
  Settings,
  Users,
  Star,
  TrendingUp,
  Lock,
  Globe,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
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
import { Separator } from "@/components/ui/separator"
import UnifiedPdfGenerator from "@/components/shared/UnifiedPdfGenerator"

interface QuizActionsProps {
  quizSlug: string
  quizData?: {
    title?: string
    description?: string
    quizType?: string
    userId?: string
    rating?: number
    attempts?: number
    questions?: any[]
    flashCards?: any[]
  }
  initialIsPublic?: boolean
  initialIsFavorite?: boolean
  isOwner?: boolean
  className?: string
}

export function QuizActions({
  quizSlug,
  quizData = {},
  initialIsPublic = false,
  initialIsFavorite = false,
  isOwner = false,
  className,
}: QuizActionsProps) {
  // Handle missing quiz slug gracefully
  if (!quizSlug) {
    console.error("QuizActions: Missing quizSlug prop");
    return (
      <div className="flex items-center justify-center p-6 text-destructive bg-destructive/10 rounded-lg">
        <AlertTriangle className="w-4 h-4 mr-2" />
        <span className="text-sm">Error: Invalid quiz configuration</span>
      </div>
    )
  }

  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPublicLoading, setIsPublicLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isShareLoading, setIsShareLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  
  // Add error handling for auth hook with proper typing
  let authData: { user: { id: string } | null; subscription: any; isAuthenticated: boolean }
  try {
    const auth = useAuth()
    authData = {
      user: auth?.user || null,
      subscription: auth?.subscription || null,
      isAuthenticated: auth?.isAuthenticated || false
    }
  } catch (error) {
    console.error("Failed to load auth data:", error)
    authData = { user: null, subscription: null, isAuthenticated: false }
  }
  
  const { user, subscription, isAuthenticated } = authData
  
  const currentUserId = user?.id || null
  const isUserOwner = isOwner || (currentUserId && quizData?.userId && currentUserId === quizData.userId)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleError = useCallback((message: string, error: unknown) => {
    console.error('QuizActions error:', error)
    toast({
      title: "Something went wrong",
      description: message,
      variant: "destructive",
    })
  }, [])

  const updateQuiz = async (field: string, value: boolean) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to perform this action",
        variant: "destructive",
      })
      return
    }

    if (field === "isPublic" && !isUserOwner) {
      toast({
        title: "Permission denied",
        description: "Only quiz owners can change visibility settings",
        variant: "destructive",
      })
      return
    }

    const setLoading = field === "isPublic" ? setIsPublicLoading : setIsFavoriteLoading
    const setState = field === "isPublic" ? setIsPublic : setIsFavorite

    try {
      setLoading(true)
      setState(value) // Optimistic update

      const updateEndpoint = `/api/quizzes/${quizData?.quizType || 'common'}/${quizSlug}`
      const response = await fetch(updateEndpoint, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) {
        setState(!value) // Revert on failure
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to update quiz`)
      }
      
      toast({
        title: "Success!",
        description: field === "isPublic"
          ? (value ? "Quiz is now public and discoverable" : "Quiz is now private")
          : (value ? "Added to your favorites" : "Removed from favorites"),
      })
    } catch (error) {
      setState(!value) // Revert on error
      const errorMessage = error instanceof Error ? error.message : "Failed to update quiz"
      handleError(errorMessage, error)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      setIsShareLoading(true)
      const quizType = quizData?.quizType || 'quiz'
      const shareUrl = `${window.location.origin}/dashboard/${quizType}/${quizSlug}`
      
      const canUseNativeShare = typeof navigator !== 'undefined' && 
        typeof navigator.share === 'function' && 
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      if (canUseNativeShare) {
        await navigator.share({
          title: quizData?.title || "Check out this quiz!",
          text: `Test your knowledge with this ${quizType} quiz`,
          url: shareUrl,
        })
        toast({
          title: "Shared successfully!",
          description: "Quiz shared via device sharing",
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link copied to clipboard",
          description: "Share this link with others to let them take your quiz",
        })
      }
    } catch (error) {
      const errorName = error instanceof Error ? error.name : 'Unknown'
      if (errorName !== "AbortError") {
        handleError("Failed to share quiz", error)
      }
    } finally {
      setIsShareLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!isUserOwner) {
      toast({
        title: "Permission denied",
        description: "Only quiz owners can delete quizzes",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)
      const deleteEndpoint = `/api/quizzes/${quizData?.quizType || 'common'}/${quizSlug}`
      
      const response = await fetch(deleteEndpoint, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to delete quiz`)
      }

      toast({
        title: "Quiz deleted successfully",
        description: "Redirecting to dashboard...",
      })
      
      setTimeout(() => router.push("/dashboard"), 1500)
    } catch (error) {
      handleError("Failed to delete quiz", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Prepare PDF data with proper typing
  const pdfData = useMemo(() => {
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

  const pdfConfig = {
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

  // Primary actions - always visible
  const primaryActions = useMemo(() => [
    {
      id: "share",
      label: "Share",
      description: "Copy link to share with others",
      icon: Share2,
      loading: isShareLoading,
      onClick: handleShare,
      disabled: false,
      variant: "primary",
    },
    {
      id: "favorite",
      label: isFavorite ? "Favorited" : "Add to Favorites",
      description: isFavorite ? "Remove from favorites" : "Save for quick access",
      icon: Heart,
      loading: isFavoriteLoading,
      onClick: () => updateQuiz("isFavorite", !isFavorite),
      disabled: !isAuthenticated,
      active: isFavorite,
      variant: isFavorite ? "primary" : "secondary",
    },
  ], [isShareLoading, isFavorite, isFavoriteLoading, isAuthenticated, handleShare])

  // Owner actions - shown in dropdown
  const ownerActions = useMemo(() => {
    if (!isUserOwner) return []
    
    return [
      {
        id: "visibility",
        label: isPublic ? "Make Private" : "Make Public",
        description: isPublic ? "Hide from public discovery" : "Allow others to discover this quiz",
        icon: isPublic ? Lock : Globe,
        loading: isPublicLoading,
        onClick: () => updateQuiz("isPublic", !isPublic),
        disabled: false,
        variant: "secondary",
      },
      {
        id: "delete",
        label: "Delete Quiz",
        description: "Permanently remove this quiz",
        icon: Trash2,
        loading: isDeleting,
        onClick: () => setShowDeleteDialog(true),
        disabled: false,
        destructive: true,
        variant: "ghost",
      },
    ]
  }, [isUserOwner, isPublic, isPublicLoading, isDeleting])

  if (!mounted) {
    return (
      <div className={cn("bg-card rounded-lg border p-3 sm:p-4", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="flex gap-2 flex-wrap">
            <div className="h-8 bg-muted rounded w-16 sm:w-20"></div>
            <div className="h-8 bg-muted rounded w-20 sm:w-24"></div>
            <div className="h-8 bg-muted rounded w-16 sm:w-20"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-card rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden",
          className
        )}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 pb-2 sm:pb-3">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-medium text-foreground text-sm sm:text-base">Quiz Actions</h3>
            </div>
            
            {/* Quiz Stats - Hide on very small screens */}
            <div className="hidden xs:flex items-center gap-2">
              {quizData?.rating && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{quizData.rating.toFixed(1)}</span>
                </div>
              )}
              {quizData?.attempts && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{quizData.attempts}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {isPublic && (
              <Badge variant="outline" className="h-5 sm:h-6 text-xs bg-green-50 border-green-200 text-green-700">
                <Globe className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-1" />
                <span className="hidden sm:inline">Public</span>
                <span className="sm:hidden">Pub</span>
              </Badge>
            )}
            {!isPublic && isUserOwner && (
              <Badge variant="outline" className="h-5 sm:h-6 text-xs bg-gray-50 border-gray-200 text-gray-700">
                <Lock className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-1" />
                <span className="hidden sm:inline">Private</span>
                <span className="sm:hidden">Prv</span>
              </Badge>
            )}
            {isFavorite && (
              <Badge variant="outline" className="h-5 sm:h-6 text-xs bg-pink-50 border-pink-200 text-pink-700">
                <Heart className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-1 fill-current" />
                <span className="hidden sm:inline">Favorite</span>
                <span className="sm:hidden">Fav</span>
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="p-3 sm:p-4 pt-2 sm:pt-3">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Primary Actions */}
            {Array.isArray(primaryActions) && primaryActions.map((action) => (
              <Tooltip key={action.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={action.variant === "primary" ? "default" : "outline"}
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled || action.loading}
                    className={cn(
                      "h-7 sm:h-8 px-2 sm:px-3 gap-1 sm:gap-2 transition-all duration-200 text-xs sm:text-sm",
                      action.active && "bg-primary text-primary-foreground",
                      action.disabled && !isAuthenticated && "opacity-60"
                    )}
                  >
                    {action.loading ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <action.icon className={cn(
                        "w-3 h-3 flex-shrink-0",
                        action.active && action.id === "favorite" && "fill-current"
                      )} />
                    )}
                    <span className="font-medium hidden sm:inline">{action.label}</span>
                    <span className="font-medium sm:hidden">{action.label.split(' ')[0]}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center max-w-48">
                    <div className="font-medium">{action.label}</div>
                    {action.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </div>
                    )}
                    {action.disabled && !isAuthenticated && (
                      <div className="text-xs text-destructive mt-1">
                        Sign in required
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* PDF Download */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <UnifiedPdfGenerator
                    data={pdfData}
                    type={getPdfType()}
                    config={pdfConfig}
                    fileName={`${quizData?.title || quizSlug}-quiz.pdf`}
                    buttonText=""
                    variant="outline"
                    size="sm"
                    className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="font-medium">Download PDF</div>
                  <div className="text-xs text-muted-foreground">
                    Export quiz for offline use
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Owner Actions Dropdown */}
            {ownerActions.length > 0 && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <div className="font-medium">Owner Actions</div>
                      <div className="text-xs text-muted-foreground">
                        Manage quiz settings
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Owner Settings
                  </div>
                  <DropdownMenuSeparator />
                  
                  {ownerActions.map((action) => (
                    <DropdownMenuItem
                      key={action.id}
                      onClick={action.onClick}
                      disabled={action.disabled || action.loading}
                      className={cn(
                        "flex items-center gap-2 py-2",
                        action.destructive && "text-destructive focus:bg-destructive/10"
                      )}
                    >
                      {action.loading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <action.icon className="w-4 h-4" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{action.label}</div>
                        {action.description && (
                          <div className="text-xs text-muted-foreground">
                            {action.description}
                          </div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Public Quiz Notice */}
        {isPublic && (
          <div className="mx-4 mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Globe className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-green-800 dark:text-green-200 text-sm">
                  {isUserOwner ? "Public Quiz" : "Shared Quiz"}
                </h4>
                <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                  {isUserOwner 
                    ? "This quiz is discoverable by anyone and appears in public listings."
                    : "This quiz has been shared with you."
                  }
                </p>
              </div>
              {isUserOwner && (
                <Badge variant="outline" className="border-green-300 text-green-700 text-xs flex-shrink-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Discoverable
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Delete Quiz"
          description="Are you sure you want to delete this quiz? This action cannot be undone and will remove all associated data."
          confirmText="Delete Quiz"
          cancelText="Cancel"
        />
      </motion.div>
    </TooltipProvider>
  )
}