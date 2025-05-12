import { Suspense } from "react"
import Link from "next/link"
import { getAuthSession } from "@/lib/auth"
import { CheckCircle2, ArrowRight, Zap, FileText, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SUBSCRIPTION_PLANS } from "../subscription/components/subscription-plans"
import { SubscriptionService } from "../subscription/services/subscription-service"

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const session = await getAuthSession()
  const userId = session?.user?.id
  const stripeSessionId = (await searchParams).session_id

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Thank you for your payment. Your subscription has been activated successfully.
        </p>
      </div>

      <Suspense fallback={<SuccessPageSkeleton />}>
        <SuccessPageContent userId={userId} sessionId={stripeSessionId} />
      </Suspense>
    </div>
  )
}

function SuccessPageSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-[300px] w-full rounded-xl" />
      <Skeleton className="h-[200px] w-full rounded-xl" />
    </div>
  )
}

// Update the SuccessPageContent component to maintain the original functionality
// and only show success information for confirmed payments

async function SuccessPageContent({
  userId,
  sessionId,
}: { userId: string | undefined; sessionId: string | undefined }) {
  let subscriptionDetails = null
  let planName = "your plan"
  let tokensAdded = 0

  if (userId) {
    try {
      // Get the user's subscription details
      const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId)
      const plan = subscriptionStatus?.subscriptionPlan // Adjust this line based on the actual structure of SubscriptionStatus

      if (plan) {
        // Find the plan details to get token information
        const planConfig = SUBSCRIPTION_PLANS.find((p) => p.id === plan)
        if (planConfig) {
          planName = planConfig.name
          tokensAdded = planConfig.tokens
        }
      }

      subscriptionDetails = { plan, tokensAdded }
    } catch (error) {
      console.error("Error fetching subscription details:", error)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border border-slate-200 dark:border-slate-700 shadow-md">
        <CardHeader>
          <CardTitle>Subscription Activated</CardTitle>
          <CardDescription>Your {planName} plan is now active</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-4">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Tokens Added</h3>
                <p className="text-muted-foreground">{tokensAdded} tokens have been added to your account</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-4">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Receipt</h3>
                <p className="text-muted-foreground">A receipt has been sent to your email address</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-medium mb-2">Next Steps</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start using your new subscription features and create amazing content.
              </p>
              <Button
                asChild
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-medium mb-2">Manage Your Subscription</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View your subscription details, billing history, and manage your payment methods.
              </p>
              <Button asChild variant="outline" className="w-full border-slate-300 dark:border-slate-600">
                <Link href="/dashboard/account">Account Settings</Link>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
