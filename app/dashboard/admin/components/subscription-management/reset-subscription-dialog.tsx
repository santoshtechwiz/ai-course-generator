"use client"

import { useState } from "react"
import { Loader2, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface ResetSubscriptionDialogProps {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ResetSubscriptionDialog({ userId, open, onOpenChange, onSuccess }: ResetSubscriptionDialogProps) {
  const { toast } = useToast()
  const [isResetting, setIsResetting] = useState(false)
  const [resetType, setResetType] = useState<"free" | "inactive">("free")
  const [isComplete, setIsComplete] = useState(false)

  const handleReset = async () => {
    setIsResetting(true)

    try {
      const response = await fetch(`/api/admin/subscriptions/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          resetType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to reset subscription")
      }

      // Show success state
      setIsComplete(true)

      // Show toast
      toast({
        title: "Subscription reset",
        description:
          resetType === "free"
            ? "User has been moved to the free tier"
            : "User's subscription has been marked as inactive",
      })

      // Dispatch event to refresh user list
      const event = new CustomEvent("user-changed")
      window.dispatchEvent(event)

      // Call success callback after a delay
      setTimeout(() => {
        if (onSuccess) onSuccess()
        onOpenChange(false)
        setIsComplete(false)
        setResetType("free")
      }, 1500)
    } catch (error) {
      console.error("Error resetting subscription:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset subscription",
        variant: "destructive",
      })
      setIsResetting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isResetting) {
          onOpenChange(newOpen)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-5 w-5 text-primary" />
            Reset Subscription
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            Choose how you want to reset this user's subscription status.
          </DialogDescription>
        </DialogHeader>

        {isComplete ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 mb-4 shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-foreground">Subscription Reset Complete</h3>
            <p className="text-muted-foreground">
              {resetType === "free"
                ? "The user has been successfully moved to the free tier."
                : "The user's subscription has been marked as inactive."}
            </p>
          </div>
        ) : (
          <>
            <div className="py-4">
              <RadioGroup
                value={resetType}
                onValueChange={(value) => setResetType(value as "free" | "inactive")}
                className="space-y-4"
              >
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="free" id="free" className="mt-1 border-primary/50 text-primary" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="free" className="font-medium text-foreground">
                      Move to Free Tier
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Cancel any active subscriptions and move the user to the free tier. This preserves their account
                      but removes premium access.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="inactive" id="inactive" className="mt-1 border-primary/50 text-primary" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="inactive" className="font-medium text-foreground">
                      Mark as Inactive
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Mark the subscription as inactive without changing the user's tier. This is useful for temporary
                      suspension.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md flex gap-3 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/30 shadow-sm">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Important:</p>
                <p className="mt-1">
                  This action will affect the user's access to premium features. Make sure you've communicated this
                  change to the user if necessary.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isResetting}
                className="border-muted-foreground/20 hover:bg-primary/5 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                disabled={isResetting}
                className="shadow-sm hover:shadow-md transition-all duration-200"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Subscription"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

