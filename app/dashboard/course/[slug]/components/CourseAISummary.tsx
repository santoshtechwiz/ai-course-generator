"use client"

import { TooltipContent } from "@/components/ui/tooltip"

import { TooltipTrigger } from "@/components/ui/tooltip"

import { Tooltip } from "@/components/ui/tooltip"

import { TooltipProvider } from "@/components/ui/tooltip"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Edit, Trash2, Save, X, Loader2, Lock, Copy } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useChapterSummary } from "@/hooks/useChapterSummary"
import { processMarkdown } from "@/lib/markdownProcessor"
import { MarkdownRenderer } from "./markdownUtils"
import { useToast } from "@/hooks/use-toast"
import AIEmoji from "@/app/dashboard/create/components/AIEmoji"
import { useSession } from "next-auth/react"
import { copyToClipboard } from "@/lib/utils"

interface CourseAISummaryProps {
  chapterId: number | string
  name: string
  existingSummary: string | null
  isPremium: boolean
  isAdmin: boolean
}

const CourseAISummary: React.FC<CourseAISummaryProps> = ({ chapterId, name, existingSummary, isPremium, isAdmin }) => {
  const [showAIEmoji, setShowAIEmoji] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSummary, setEditedSummary] = useState(existingSummary || "")
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { data, isLoading, isError, refetch, isFetching } = useChapterSummary(Number(chapterId))
  const { toast } = useToast()
  const { data: session } = useSession()
  const isAuthenticated = !!session

  // For unauthenticated users, show a blurred preview
  const [showPreview, setShowPreview] = useState(!isPremium && !isAuthenticated)

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (!existingSummary && !isPremium) {
      setShowAIEmoji(true)
      timer = setTimeout(() => {
        setShowAIEmoji(false)
        refetch()
      }, 60000) // 1 minute delay
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [existingSummary, isPremium, refetch])

  const processedContent = existingSummary || (data?.success && data.data ? processMarkdown(data.data) : "")

  const handleEdit = () => setIsEditing(true)

  const handleSave = async () => {
    if (!chapterId) return

    try {
      setIsSaving(true)

      const response = await fetch(`/api/chapter/${chapterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: editedSummary }),
      })

      if (response.ok) {
        // Wait for the state update to complete before showing toast
        setIsEditing(false)

        toast({
          title: "Summary updated",
          description: "The chapter summary has been successfully updated.",
        })

        // Refetch after a short delay to ensure state is updated
        setTimeout(() => {
          refetch()
        }, 100)
      } else {
        throw new Error("Failed to update summary")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the summary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/chapter/${chapterId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Summary deleted",
          description: "The chapter summary has been successfully deleted.",
        })
        setEditedSummary("")
        refetch() // Refresh the summary data
      } else {
        throw new Error("Failed to delete summary")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the summary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirmation(false)
    }
  }

  // For unauthenticated users, show a preview with blur effect
  if (showPreview) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <h2 className="text-3xl font-bold">{name}</h2>
        <Card className="bg-card relative overflow-hidden shadow-md">
          <CardContent className="p-8">
            <div className="relative">
              {/* Blurred content */}
              <div className="filter blur-sm">
                <div className="prose dark:prose-invert max-w-none">
                  <h3 className="text-xl font-semibold mb-4">Chapter Summary</h3>
                  <p className="leading-relaxed mb-4">
                    This chapter explores the fundamental concepts of programming, including variables, data types, and
                    control structures. We begin by examining how to declare and initialize variables, understanding
                    their scope and lifetime within a program.
                  </p>
                  <p className="leading-relaxed mb-6">
                    Next, we delve into various data types such as integers, floating-point numbers, characters, and
                    booleans. The chapter also covers complex data structures like arrays, lists, and dictionaries,
                    explaining how they store and organize information.
                  </p>
                  <h3 className="text-xl font-semibold mb-2">Key Concepts</h3>
                  <ul className="space-y-1.5">
                    <li>Variable declaration and initialization</li>
                    <li>Understanding data types and type conversion</li>
                    <li>Control structures: conditionals and loops</li>
                    <li>Function definition and parameter passing</li>
                  </ul>
                </div>
              </div>

              {/* Overlay with sign-in prompt */}
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <motion.div
                  className="text-center p-8 max-w-md"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                >
                  <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">Premium Content</h3>
                  <p className="text-muted-foreground mb-6">
                    Sign in or upgrade to access AI-generated summaries for this chapter.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button size="lg" onClick={() => (window.location.href = "/api/auth/signin")}>
                      Sign In
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => (window.location.href = "/dashboard/subscription")}
                    >
                      Upgrade to Premium
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const renderContent = () => {
    if (showAIEmoji) {
      return <AIPreparingContent />
    }

    if (isLoading || isFetching) {
      return <LoadingSkeleton />
    }

    if (isError && !existingSummary) {
      return <ErrorContent onRetry={refetch} />
    }

    if (processedContent) {
      return (
        <SummaryContent
          name={name}
          isAdmin={isAdmin}
          isEditing={isEditing}
          editedSummary={editedSummary}
          processedContent={processedContent}
          onEdit={handleEdit}
          onSave={handleSave}
          onDelete={() => setShowDeleteConfirmation(true)}
          setEditedSummary={setEditedSummary}
          onCancelEdit={() => {
            setIsEditing(false)
            setEditedSummary(existingSummary || "")
          }}
          isSaving={isSaving}
        />
      )
    }

    return <NoContentAvailable onRetry={refetch} />
  }

  return (
    <div className="relative space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={showAIEmoji ? "ai-emoji" : isLoading ? "loading" : "content"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this summary?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the summary for this chapter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

const AIPreparingContent: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col items-center justify-center space-y-4 bg-card/20 p-8 rounded-lg"
  >
    <div className="relative">
      <AIEmoji />
      <motion.div
        className="absolute inset-0 bg-primary/20 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      />
    </div>
    <motion.p
      className="text-lg font-semibold text-primary"
      animate={{
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      }}
    >
      Preparing your AI summary...
    </motion.p>
    <p className="text-sm text-muted-foreground">This may take a minute</p>
    <motion.div className="w-full max-w-xs bg-muted/50 h-1 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-primary"
        animate={{
          width: ["0%", "100%"],
          x: ["-100%", "0%"],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />
    </motion.div>
  </motion.div>
)

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-2/3 mb-4" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
    <div className="space-y-2 mt-6">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <div className="space-y-2 mt-6">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
)

const ErrorContent: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="space-y-4 bg-card/20 p-6 rounded-lg"
  >
    <div className="flex items-center space-x-2 text-destructive">
      <AlertCircle size={20} />
      <p className="font-semibold">Error retrieving content</p>
    </div>
    <p className="text-muted-foreground">
      We're having trouble retrieving the content. Please check your connection and try again.
    </p>
    <Button variant="secondary" onClick={onRetry}>
      Retry Now
    </Button>
  </motion.div>
)

const SummaryContent: React.FC<{
  name: string
  isAdmin: boolean
  isEditing: boolean
  editedSummary: string
  processedContent: string
  onEdit: () => void
  onSave: () => void
  onDelete: () => void
  onCancelEdit: () => void
  setEditedSummary: (summary: string) => void
  isSaving: boolean
}> = ({
  name,
  isAdmin,
  isEditing,
  editedSummary,
  processedContent,
  onEdit,
  onSave,
  onDelete,
  onCancelEdit,
  setEditedSummary,
  isSaving,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="space-y-4"
  >
    <h2 className="text-3xl font-bold mb-6">{name}</h2>
    {isAdmin && (
      <div className="flex flex-wrap gap-2 mb-6">
        {isEditing ? (
          <>
            <Button onClick={onSave} variant="outline" size="sm" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save
                </>
              )}
            </Button>
            <Button onClick={onCancelEdit} variant="outline" size="sm" disabled={isSaving}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onEdit} variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button onClick={onDelete} variant="outline" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </>
        )}
      </div>
    )}

    <Card className="bg-card shadow-md">
      <CardContent className="p-8 relative">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              className="w-full h-64 p-4 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-y"
              placeholder="Enter your summary here..."
            />
          </div>
        ) : (
          <>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 h-8 w-8 p-0 opacity-70 hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(processedContent)}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy summary</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <article className="prose dark:prose-invert prose-headings:scroll-m-20 prose-headings:font-semibold prose-h3:text-xl prose-h4:text-lg prose-p:leading-relaxed prose-p:mb-4 prose-blockquote:border-l-2 prose-blockquote:pl-6 prose-blockquote:italic max-w-none">
              <MarkdownRenderer content={processedContent} />
            </article>
          </>
        )}
      </CardContent>
    </Card>
  </motion.div>
)

const NoContentAvailable: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="space-y-4"
  >
    <p className="text-muted-foreground">No content available at the moment. Please try again later.</p>
    <Button variant="secondary" onClick={onRetry}>
      Retry
    </Button>
  </motion.div>
)

export default CourseAISummary
