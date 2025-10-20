"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, BookmarkIcon, Edit3 } from "lucide-react"
import { useBookmarks } from "@/hooks/use-bookmarks"
import type { Bookmark } from "@prisma/client"

interface BookmarkModalProps {
  courseId?: number
  chapterId?: number
  existingBookmark?: Bookmark
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function BookmarkModal({ 
  courseId, 
  chapterId, 
  existingBookmark, 
  trigger,
  onSuccess 
}: BookmarkModalProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(existingBookmark?.note || "")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { createBookmark, updateBookmark } = useBookmarks({ courseId, chapterId })

  const isEditing = Boolean(existingBookmark)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!courseId && !chapterId) {
      toast({
        title: "Error",
        description: "Either course or chapter must be specified",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (isEditing && existingBookmark) {
        await updateBookmark(existingBookmark.id.toString(), { note })
        toast({
          title: "Bookmark updated",
          description: "Your bookmark has been updated successfully",
        })
      } else {
        await createBookmark({ courseId, chapterId, note })
        toast({
          title: "Bookmark created",
          description: "Your bookmark has been saved successfully",
        })
      }
      
      setOpen(false)
      setNote("")
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} bookmark`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="neutral" size="sm">
      {isEditing ? (
        <>
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Bookmark
        </>
      ) : (
        <>
          <BookmarkIcon className="h-4 w-4 mr-2" />
          Add Bookmark
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
            <BookmarkIcon className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Bookmark" : "Create Bookmark"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update your bookmark note below."
              : "Add a note to this bookmark to remember why you saved it."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Bookmark Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a note to remember why you bookmarked this..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isLoading}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="neutral" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <BookmarkIcon className="h-4 w-4 mr-2" />
                  {isEditing ? "Update Bookmark" : "Create Bookmark"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
