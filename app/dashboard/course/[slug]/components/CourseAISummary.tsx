"use client"

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
    if (!existingSummary && !isPremium) {
      setShowAIEmoji(true)
      const timer = setTimeout(() => {
        setShowAIEmoji(false)
        refetch()
      }, 60000) // 1 minute delay
      return () => clearTimeout(timer)
    }
  }, [existingSummary, isPremium, refetch])

  const processedContent = existingSummary || (data?.success && data.data ? processMarkdown(data.data) : "")

  const handleEdit = () => setIsEditing(true)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/chapter/${chapterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: editedSummary }),
      })

      if (response.ok) {
        setIsEditing(false)
        toast({
          title: "Summary updated",
          description: "The chapter summary has been successfully updated.",
        })
        refetch() // Refresh the summary data
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
      <div className="space-y-4">
        <h2 className="text-3xl font-bold mb-6">{name}</h2>
        <Card className="bg-card relative overflow-hidden">
          <CardContent className="p-6">
            <div className="relative">
              {/* Blurred content */}
              <div className="filter blur-sm">
                <div className="prose dark:prose-invert max-w-none">
                  <h3>Chapter Summary</h3>
                  <p>
                    This chapter explores the fundamental concepts of programming, including variables, data types, and
                    control structures. We begin by examining how to declare and initialize variables, understanding
                    their scope and lifetime within a program.
                  </p>
                  <p>
                    Next, we delve into various data types such as integers, floating-point numbers, characters, and
                    booleans. The chapter also covers complex data structures like arrays, lists, and dictionaries,
                    explaining how they store and organize information.
                  </p>
                  <h3>Key Concepts</h3>
                  <ul>
                    <li>Variable declaration and initialization</li>
                    <li>Understanding data types and type conversion</li>
                    <li>Control structures: conditionals and loops</li>
                    <li>Function definition and parameter passing</li>
                  </ul>
                </div>
              </div>

              {/* Overlay with sign-in prompt */}
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center p-6 max-w-md">
                  <Lock className="h-12 w-12 text-primary/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Premium Content</h3>
                  <p className="text-muted-foreground mb-4">
                    Sign in or upgrade to access AI-generated summaries for this chapter.
                  </p>
                  <div className="flex space-x-4 justify-center">
                    <Button onClick={() => (window.location.href = "/api/auth/signin")}>Sign In</Button>
                    <Button variant="outline" onClick={() => (window.location.href = "/dashboard/subscription")}>
                      Upgrade
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
      <div className="flex space-x-2 mb-4">
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
    <Card className="bg-card">
      <CardContent className="p-6 relative">
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
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0"
              onClick={() => copyToClipboard(processedContent)}
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy summary</span>
            </Button>
            <MarkdownRenderer content={processedContent} />
          </>
        )}
      </CardContent>
    </Card>
    {/* <PDFGenerator markdown={processedContent} chapterName={name} /> */}
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
