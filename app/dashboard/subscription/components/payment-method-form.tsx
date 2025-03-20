"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
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

      // Send the payment method to your server
      const response = await fetch("/api/subscriptions/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || "Failed to update payment method")
      }

      toast({
        title: "Payment Method Updated",
        description: "Your payment method has been updated successfully.",
        variant: "default",
      })

      // Clear the form
      cardElement.clear()

      if (onSuccess) {
        onSuccess()
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
      <div className="space-y-2">
        <label htmlFor="card-element" className="text-sm font-medium">
          Card Details
        </label>
        <div className="border rounded-md p-3">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
            }}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <Button type="submit" disabled={!stripe || isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Save Payment Method"
        )}
      </Button>
    </form>
  )
}

