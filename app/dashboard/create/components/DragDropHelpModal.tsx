"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DotIcon as DragHandleDots2Icon, Video, Edit, ArrowUpDown, MousePointerClick } from "lucide-react"

const STORAGE_KEY = "dragdrop-help-dismissed"

export function DragDropHelpModal() {
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Check if the modal has been dismissed before
  useEffect(() => {
    // Skip localStorage access on server-side
    if (typeof window === 'undefined') return

    const dismissed = localStorage.getItem(STORAGE_KEY) === "true"
    if (!dismissed) {
      // Show modal after a short delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        setOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Add interaction listener
  useEffect(() => {
    // Skip interaction handling on server-side
    if (typeof window === 'undefined') return

    if (!hasInteracted) {
      const handleInteraction = () => {
        setHasInteracted(true)
        // Check if modal should be shown on first interaction
        const dismissed = localStorage.getItem(STORAGE_KEY) === "true"
        if (!dismissed && !open) {
          setOpen(true)
        }
      }

      window.addEventListener("click", handleInteraction, { once: true })
      return () => window.removeEventListener("click", handleInteraction)
    }
  }, [hasInteracted, open])

  const handleClose = () => {
    setOpen(false)
    if (dontShowAgain && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, "true")
      } catch (error) {
        console.warn('Failed to save modal preference:', error)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-primary" />
            Drag & Drop Course Editor
          </DialogTitle>
          <DialogDescription>
            Learn how to organize and customize your course content with our drag-and-drop interface.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <DragHandleDots2Icon className="h-4 w-4 text-primary" />
              Reordering Content
            </h3>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <MousePointerClick className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm">
                Drag units and chapters using the <DragHandleDots2Icon className="h-3 w-3 inline" /> handle to reorder
                them. Simply click and hold the handle, then drag to the desired position.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" />
              Editing Content
            </h3>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm">
                Click on any unit or chapter title to edit it. You can also add new units and chapters using the "Add"
                buttons.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              Video Management
            </h3>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm">
                Use the <Video className="h-3 w-3 inline" /> button to add or edit YouTube videos for each chapter. You
                can paste a YouTube URL or video ID.
              </p>
            </div>
          </div>

          <div className="mt-2 p-3 border border-primary/20 rounded-md bg-primary/5">
            <p className="text-sm font-medium text-primary">Pro Tips:</p>
            <ul className="text-sm mt-1 space-y-1 list-disc pl-5">
              <li>You can add up to 2 additional chapters per unit</li>
              <li>All changes are saved automatically</li>
              <li>Generate videos automatically or add your own YouTube videos</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-0">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dontShow"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(!!checked)}
            />
            <Label htmlFor="dontShow" className="text-sm font-normal">
              Don&apos;t show this again
            </Label>
          </div>
          <Button onClick={handleClose}>Got it, thanks!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
