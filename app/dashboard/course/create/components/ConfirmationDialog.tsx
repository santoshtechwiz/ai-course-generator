"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LogIn } from "lucide-react"

interface ConfirmationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmationDialog({ open, onClose, onConfirm }: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in Required</DialogTitle>
          <DialogDescription>
            You need to sign in to create a course. Would you like to sign in now?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
