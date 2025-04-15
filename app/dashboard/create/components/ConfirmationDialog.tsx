import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from 'lucide-react'
import { CreateCourseInput } from "./schema"


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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900">Confirm Course Creation</DialogTitle>
          <DialogDescription className="text-gray-700">
            Are you sure you want to create this course? Please review the details below:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p><strong>Title:</strong> {formData.title}</p>
          <p><strong>Description:</strong> {formData.description}</p>
          <p><strong>Category:</strong> {formData.category}</p>
          <p><strong>Units:</strong></p>
          <ul className="list-disc pl-5 text-gray-700">
            {formData.units.map((unit, index) => (
              <li key={index}>{unit}</li>
            ))}
          </ul>
          <p><strong>Note:</strong> This action will deduct 1 credit from your account.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Confirm and Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

