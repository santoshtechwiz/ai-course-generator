"use client"

import { useState, useCallback } from "react"
import { Edit2, Trash2, Loader2, BookOpen, RefreshCcw } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import axios from "axios"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface AdminSummaryPanelProps {
  chapterId: number
  name: string
  summary: string
  setSummary: (summary: string) => void
  onRefresh: () => void
  isRefetching: boolean
}

export const AdminSummaryPanel: React.FC<AdminSummaryPanelProps> = ({
  chapterId,
  name,
  summary,
  setSummary,
  onRefresh,
  isRefetching
}) => {
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Handle edit mode
  const handleEditClick = useCallback(() => {
    setEditContent(summary)
    setEditMode(true)
  }, [summary])

  // Handle save
  const handleSaveEdit = useCallback(async () => {
    setIsSaving(true)
    try {
      await axios.put(`/api/chapter/${chapterId}/summary`, {
        summary: editContent,
      })
      
      setSummary(editContent)
      setEditMode(false)
      toast.success("Summary updated successfully!")
    } catch (error) {
      console.error("Error saving summary:", error)
      toast.error("Failed to save summary. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }, [editContent, chapterId, setSummary])

  // Handle delete
  const handleDeleteSummary = useCallback(async () => {
    setIsSaving(true)
    try {
      await axios.delete(`/api/chapter/${chapterId}/summary`)
      setSummary("")
      setShowDeleteDialog(false)
      toast.success("Summary deleted successfully!")
    } catch (error) {
      console.error("Error deleting summary:", error)
      toast.error("Failed to delete summary. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }, [chapterId, setSummary])

  // Edit mode
  if (editMode) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            <span>Edit {name} Summary</span>
          </CardTitle>
          <CardDescription>Update the AI-generated summary</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-[300px] font-mono text-sm"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Enter chapter summary..."
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setEditMode(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              'Save Summary'
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // View mode for admin
  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <span>{name} Summary</span>
            </CardTitle>
            <CardDescription>
              AI-generated summary of the chapter content
            </CardDescription>
          </div>
          
          {/* Admin controls */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleEditClick} 
              className="h-8 w-8"
              title="Edit Summary"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowDeleteDialog(true)}
              className="h-8 w-8 text-destructive hover:text-destructive"
              title="Delete Summary"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          {/* Render summary content */}
          {summary ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                className="markdown-body"
              >
                {summary}
              </Markdown>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No summary available for this chapter yet
              </p>
              <Button 
                onClick={onRefresh} 
                className="mt-4"
                disabled={isRefetching}
              >
                {isRefetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Generate Summary
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
        
        {/* Show refresh button for admin users always */}
        {summary && (
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefetching}
              className="ml-auto"
            >
              {isRefetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh Summary
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Summary</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this summary? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSummary}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
