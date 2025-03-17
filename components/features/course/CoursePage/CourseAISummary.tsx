"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Edit, Trash2, Save, X } from "lucide-react"
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

import AIEmoji from "../AIEmoji"
import { useChapterSummary } from "@/hooks/useChapterSummary"
import { processMarkdown } from "@/lib/markdownProcessor"
import { MarkdownRenderer } from "./markdownUtils"
import PageLoader from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import PDFGenerator from "@/components/shared/PDFGenerator"

interface CourseAISummaryProps {
  chapterId: number
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
  const { data, isLoading, isError, refetch, isFetching } = useChapterSummary(chapterId)
  const { toast } = useToast()

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
    }
  }

  const handleDelete = async () => {
    try {
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
      setShowDeleteConfirmation(false)
    }
  }

  const renderContent = () => {
    if (showAIEmoji) {
      return <AIPreparingContent />
    }

    if (isLoading || isFetching) {
      return <PageLoader />
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
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
    className="flex flex-col items-center justify-center space-y-4"
  >
    <AIEmoji />
    <p className="text-lg font-semibold text-primary">Preparing your AI summary...</p>
    <p className="text-sm text-muted-foreground">This may take a minute</p>
  </motion.div>
)

const ErrorContent: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="space-y-4"
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
            <Button onClick={onSave} variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button onClick={onCancelEdit} variant="outline" size="sm">
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
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              className="w-full h-64 p-2 border rounded"
            />
          </div>
        ) : (
          <MarkdownRenderer content={processedContent} />
        )}
      </CardContent>
    </Card>
    <PDFGenerator markdown={processedContent} chapterName={name} />
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

