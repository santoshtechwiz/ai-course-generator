"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useToastThrottle } from "../video/hooks/useToastThrottle"
import { Loader2, StickyNote, Edit3 } from "lucide-react"
import { useNotes } from "@/hooks/use-notes"
import type { Bookmark } from "@prisma/client"

interface NoteModalProps {
  courseId: number
  chapterId?: number
  existingNote?: Bookmark
  trigger?: React.ReactNode
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

export function NoteModal({ 
  courseId, 
  chapterId, 
  existingNote, 
  trigger,
  onSuccess,
  onLoadingChange
}: NoteModalProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(existingNote?.note || "")
  const [isLoading, setIsLoading] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const { toast } = useToast()
  const { showThrottledToast } = useToastThrottle(1500)
  const { createNote, updateNote } = useNotes({ courseId, chapterId })

  const isEditing = Boolean(existingNote)

  // Auto-save note content to localStorage with debouncing
  useEffect(() => {
    if (!open || !note.trim()) return

    const timeoutId = setTimeout(() => {
      const key = `note-draft-${courseId}-${chapterId || 'general'}-${existingNote?.id || 'new'}`
      try {
        localStorage.setItem(key, note)
        setDraftSaved(true)
        // Hide the indicator after 2 seconds
        setTimeout(() => setDraftSaved(false), 2000)
      } catch (error) {
        console.warn('Failed to auto-save note draft:', error)
      }
    }, 1000) // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId)
  }, [note, open, courseId, chapterId, existingNote?.id])

  // Load draft when modal opens
  useEffect(() => {
    if (open && !isEditing) {
      const key = `note-draft-${courseId}-${chapterId || 'general'}-new`
      try {
        const draft = localStorage.getItem(key)
        if (draft && !existingNote?.note) {
          setNote(draft)
        }
      } catch (error) {
        console.warn('Failed to load note draft:', error)
      }
    }
  }, [open, isEditing, courseId, chapterId, existingNote?.note])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!note.trim()) {
      showThrottledToast({
        title: "Error",
        description: "Please enter some content for your note",
        variant: "destructive",
      })
      return
    }

    // Additional validation to prevent course/chapter info from being saved as notes
    if (note.includes(" - ")) {
      showThrottledToast({
        title: "Error",
        description: "Note content cannot contain course or chapter information. Please enter your own notes.",
        variant: "destructive",
      })
      return
    }

    if (note.includes("Introduction to")) {
      showThrottledToast({
        title: "Error", 
        description: "Note content cannot contain course titles. Please enter your own notes.",
        variant: "destructive",
      })
      return
    }    if (note.trim().length < 5) {
      showThrottledToast({
        title: "Error",
        description: "Note content must be at least 5 characters long",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    onLoadingChange?.(true)

    try {
      if (isEditing && existingNote) {
        await updateNote(existingNote.id.toString(), { note })
        showThrottledToast({
          title: "✓ Note updated",
          description: "Your note has been updated successfully",
        })
      } else {
        await createNote({ courseId, chapterId, note })
        showThrottledToast({
          title: "✓ Note created",
          description: "Your note has been saved successfully",
        })
      }
      
      // Clear draft after successful save
      const draftKey = `note-draft-${courseId}-${chapterId || 'general'}-${existingNote?.id || 'new'}`
      try {
        localStorage.removeItem(draftKey)
      } catch (error) {
        console.warn('Failed to clear note draft:', error)
      }

      setOpen(false)
      setNote("")
      onSuccess?.()
    } catch (error: any) {
      showThrottledToast({
        title: "⚠ Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} note`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      onLoadingChange?.(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      {isEditing ? (
        <>
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Note
        </>
      ) : (
        <>
          <StickyNote className="h-4 w-4 mr-2" />
          Add Note
        </>
      )}
    </Button>
  )

  return (
    <div>

        <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-gray-200 z-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Note" : "Create Note"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update your note content below."
              : "Add a note to remember important points from this lesson."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="note">Note Content</Label>
              {draftSaved && (
                <span className="text-xs text-green-600 font-medium animate-in fade-in duration-300">
                  Draft saved
                </span>
              )}
            </div>
            <Textarea
              id="note"
              placeholder="Enter your note here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
              className="resize-none"
              disabled={isLoading}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !note.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <StickyNote className="h-4 w-4 mr-2" />
                  {isEditing ? "Update Note" : "Create Note"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </div>
  )
}
