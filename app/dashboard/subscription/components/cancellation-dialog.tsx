/**
 * Enhanced Cancellation Dialog
 *
 * A multi-step dialog for subscription cancellation with feedback collection.
 */

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CancellationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
  expirationDate: string | null
  planName: string
}

export function CancellationDialog({ isOpen, onClose, onConfirm, expirationDate, planName }: CancellationDialogProps) {
  const [step, setStep] = useState(1)
  const [reason, setReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (reason === "other" && !customReason.trim()) {
      setError("Please provide a reason for cancellation")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const finalReason = reason === "other" ? customReason : reason
      await onConfirm(finalReason)
      setSuccess(true)
      setStep(3) // Move to success step
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      setError(error instanceof Error ? error.message : "Failed to cancel subscription")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetDialog = () => {
    setStep(1)
    setReason("")
    setCustomReason("")
    setError(null)
    setSuccess(false)
  }

  const handleClose = () => {
    onClose()
    // Reset after animation completes
    setTimeout(resetDialog, 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Cancel Subscription?" : step === 2 ? "Help Us Improve" : "Cancellation Confirmed"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <>
            <div className="py-4">
              <p className="mb-4">
                Are you sure you want to cancel your <span className="font-semibold">{planName}</span> subscription?
              </p>
              <p className="mb-4">
                Your subscription will remain active until {expirationDate || "the end of your billing period"}.
              </p>
              <p className="text-sm text-muted-foreground">
                After cancellation, you'll still have access to all features until your subscription expires.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Keep Subscription
              </Button>
              <Button variant="destructive" onClick={() => setStep(2)}>
                Continue to Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <div className="py-4">
              <p className="mb-4">We're sorry to see you go. Could you tell us why you're cancelling?</p>
              <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="too-expensive" id="too-expensive" />
                  <Label htmlFor="too-expensive">Too expensive</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not-using" id="not-using" />
                  <Label htmlFor="not-using">Not using it enough</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="missing-features" id="missing-features" />
                  <Label htmlFor="missing-features">Missing features I need</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="found-alternative" id="found-alternative" />
                  <Label htmlFor="found-alternative">Found a better alternative</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other reason</Label>
                </div>
              </RadioGroup>

              {reason === "other" && (
                <Textarea
                  className="mt-4"
                  placeholder="Please tell us more..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting || !reason}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 3 && (
          <>
            <div className="py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Subscription Cancelled</h3>
              <p className="mb-4">
                Your subscription has been cancelled successfully. You'll continue to have access until{" "}
                {expirationDate || "the end of your billing period"}.
              </p>
              <p className="text-sm text-muted-foreground">
                We appreciate your feedback and hope to see you again soon!
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
