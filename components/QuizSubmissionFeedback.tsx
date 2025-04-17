import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface QuizSubmissionFeedbackProps {
  open: boolean
  onClose: () => void
  isCorrect: boolean
  feedbackMessage: string
}

export default function QuizSubmissionFeedback({
  open,
  onClose,
  isCorrect,
  feedbackMessage,
}: QuizSubmissionFeedbackProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCorrect ? "Correct Answer!" : "Incorrect Answer"}</DialogTitle>
          <DialogDescription>{feedbackMessage}</DialogDescription>
        </DialogHeader>
        <Button onClick={onClose} className="mt-4">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  )
}
