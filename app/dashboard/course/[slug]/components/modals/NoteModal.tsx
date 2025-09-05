"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, StickyNote, Edit3 } from "lucide-react"
import { useNotes } from "@/hooks/use-notes"
import type { Bookmark } from "@prisma/client"

interface NoteModalProps {
  courseId: number
  chapterId?: number
  existingNote?: Bookmark
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function NoteModal({ 
  courseId, 
  chapterId, 
  existingNote, 
  trigger,
  onSuccess 
}: NoteModalProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(existingNote?.note || "")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { createNote, updateNote } = useNotes({ courseId, chapterId })

  const isEditing = Boolean(existingNote)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!note.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your note",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (isEditing && existingNote) {
        await updateNote(existingNote.id.toString(), { note })
        toast({
          title: "Note updated",
          description: "Your note has been updated successfully",
        })
      } else {
        await createNote({ courseId, chapterId, note })
        toast({
          title: "Note created",
          description: "Your note has been saved successfully",
        })
      }
      
      setOpen(false)
      setNote("")
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} note`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
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
            <Label htmlFor="note">Note Content</Label>
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
  )
}
