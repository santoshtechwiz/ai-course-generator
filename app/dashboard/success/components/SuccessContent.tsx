"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Zap, CheckCircle, FileText, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription-plans"

interface SuccessContentProps {
  sessionId: string
}

export function SuccessContent({ sessionId }: SuccessContentProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planName, setPlanName] = useState<string | null>(null)
  const [tokensAdded, setTokensAdded] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function verifyPayment() {
      if (!sessionId) {
        setError("No session ID provided")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/subscriptions/verify?sessionId=${sessionId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Failed to verify payment")
        }

        if (data.status === "succeeded") {
          // Get plan details from subscription data
          if (data.subscription?.metadata?.planName) {
            const planId = data.subscription.metadata.planName
            const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
            setPlanName(plan?.name || planId)

            // Get tokens from plan if available
            if (plan) {
              setTokensAdded(plan.tokens)
            } else if (data.subscription.metadata.tokens) {
              setTokensAdded(Number.parseInt(data.subscription.metadata.tokens, 10))
            }
          } else {
            setPlanName("Subscription")
            // Try to get tokens from metadata
            if (data.subscription?.metadata?.tokens) {
              setTokensAdded(Number.parseInt(data.subscription.metadata.tokens, 10))
            }
          }
        } else {
          throw new Error(`Payment ${data.status}`)
        }
      } catch (err) {
        console.error("Error verifying payment:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [sessionId])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Payment Verification Failed</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => router.push("/dashboard/subscription")}>Try Again</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-green-500 mb-4">
        <CheckCircle className="h-16 w-16" />
      </div>
      <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
      <p className="text-muted-foreground mb-8">
        Thank you for your payment. Your subscription has been activated successfully.
      </p>

      <Card className="w-full max-w-md mb-8">
        <CardContent className="pt-6">
          <h3 className="text-xl font-bold mb-4">Subscription Activated</h3>
          <p className="mb-6">Your {planName || "FREE"} plan is now active</p>

          {tokensAdded && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <Zap className="h-5 w-5 text-blue-500 mr-2" />
                <h4 className="font-semibold">Tokens Added</h4>
              </div>
              <p>{tokensAdded} tokens have been added to your account</p>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              <h4 className="font-semibold">Receipt</h4>
            </div>
            <p>A receipt has been sent to your email address</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => router.push("/dashboard")} className="gap-2">
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => router.push("/dashboard/account")}>
          Manage Subscription
        </Button>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Skeleton className="h-16 w-16 rounded-full mb-4" />
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-80 mb-8" />

      <div className="w-full max-w-md mb-8">
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Skeleton className="h-10 w-full sm:w-1/2" />
        <Skeleton className="h-10 w-full sm:w-1/2" />
      </div>
    </div>
  )
}

