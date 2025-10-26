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
import type { CreateCourseInput } from "@/schema/schema"
import { Loader2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  formData: CreateCourseInput
  isSubmitting: boolean
}

export function ConfirmationDialog({ open, onOpenChange, onConfirm, formData, isSubmitting }: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="shadow-neo border-4 border-border max-w-sm sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-card-foreground font-bold text-base sm:text-lg">
            Confirm Course Creation
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Review your course details before creating. This action will deduct 1 credit from your account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs sm:text-sm font-semibold text-card-foreground">Title</span>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">{formData.title}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs sm:text-sm font-semibold text-card-foreground">Description</span>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">{formData.description}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs sm:text-sm font-semibold text-card-foreground">Category</span>
              <p className="text-xs sm:text-sm text-muted-foreground">{formData.category}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs sm:text-sm font-semibold text-card-foreground">
                Units ({formData.units.length})
              </span>
              <ul className="space-y-1">
                {formData.units.map((unit, index) => (
                  <li key={index} className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                    <span className="inline-block w-5 h-5 rounded bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="break-words">{unit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg border border-accent/30">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-card-foreground">Credit Deduction</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                This action will deduct{" "}
                <Badge className="mx-1 border-2 border-border bg-accent text-background text-xs">1 credit</Badge> from
                your account
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="border-4 border-border text-sm sm:text-base py-2 sm:py-3"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-accent text-background border-4 border-border shadow-neo font-semibold text-sm sm:text-base py-2 sm:py-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Confirm and Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
