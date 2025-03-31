"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CreditCard, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { CardElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentMethodFormProps {
  onSuccess?: () => void
}

export function PaymentMethodForm({ onSuccess }: PaymentMethodFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodFormContent onSuccess={onSuccess} />
    </Elements>
  )
}

function PaymentMethodFormContent({ onSuccess }: PaymentMethodFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        throw new Error("Card element not found")
      }

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      // Add a timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      // Send the payment method to your server
      const response = await fetch("/api/subscriptions/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || "Failed to update payment method")
      }

      setIsSuccess(true)

      toast({
        title: "Payment Method Updated",
        description: "Your payment method has been updated successfully.",
        variant: "default",
      })

      // Clear the form
      cardElement.clear()

      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }

      router.refresh()
    } catch (err: any) {
      console.error("Error updating payment method:", err)
      setError(err.message || "An error occurred while updating your payment method")
      toast({
        title: "Error",
        description: err.message || "Failed to update payment method. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isSuccess ? (
        <div className="text-center py-6">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Payment Method Updated</h3>
          <p className="text-muted-foreground">Your payment method has been updated successfully.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="card-element" className="text-sm font-medium">
                Card Details
              </label>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="border border-input rounded-lg p-3 sm:p-4 bg-card">
              <CardElement
                id="card-element"
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "var(--card-foreground)",
                      "::placeholder": {
                        color: "var(--muted-foreground)",
                      },
                      iconColor: "var(--card-foreground)",
                    },
                    invalid: {
                      color: "var(--destructive)",
                      iconColor: "var(--destructive)",
                    },
                  },
                  hidePostalCode: true,
                }}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
                {error}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={!stripe || isLoading}
            className="w-full bg-gradient-to-r from-primary to-primary-foreground/80 hover:from-primary/90 hover:to-primary-foreground/70 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Save Payment Method"
            )}
          </Button>

          <div className="text-xs text-center text-muted-foreground">
            Your payment information is securely processed by Stripe. We don't store your card details.
          </div>
        </>
      )}
    </form>
  )
}

