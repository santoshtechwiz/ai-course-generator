"use client"

import * as React from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface ConfirmDialogProps {
  trigger?: React.ReactNode
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  children?: React.ReactNode
  isOpen?: boolean
}

export function ConfirmDialog({
  trigger,
  onConfirm,
  onCancel,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  children,
  isOpen,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const isControlled = typeof isOpen === "boolean"
  const open = isControlled ? isOpen : internalOpen
  const setOpen = isControlled ? (v: boolean) => (v ? undefined : onCancel?.()) : setInternalOpen

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      if (!isControlled) setInternalOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children || (description && <p className="text-sm text-muted-foreground">{description}</p>)}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
