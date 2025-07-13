import { Suspense } from "react"
import Link from "next/link"
import { getAuthSession } from "@/lib/auth"
import { CheckCircle2, ArrowRight, Zap, FileText, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SUBSCRIPTION_PLANS } from "../subscription/components/subscription-plans"
import { SubscriptionService } from "../subscription/services/subscription-service"
import SuspenseGlobalFallback from "@/components/loaders/SuspenseGlobalFallback"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Success",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

export const themeColor = "#fff"

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

      <Suspense fallback={<SuspenseGlobalFallback message="Loading success page..." />}>
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

async function SuccessPageContent({ userId, sessionId }: { userId?: string; sessionId?: string }) {
  // Check if we have both a userId and sessionId to verify payment
  if (!userId || !sessionId) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground mb-6">
          Unable to verify payment details. If you believe this is an error, please contact support.
        </p>
        <Button asChild>
          <Link href="/dashboard/home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  // Verify the payment and subscription status
  const subscriptionDetails = await SubscriptionService.verifyPaymentSuccess(userId, sessionId)
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscriptionDetails?.planId)

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Subscription Activated</CardTitle>
          <CardDescription>
            Your {plan?.name || "Premium"} subscription is now active
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium">{plan?.name || "Premium Plan"}</span>
          </div>
          {subscriptionDetails?.credits && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Credits Added</span>
              <span className="font-medium">{subscriptionDetails.credits} tokens</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Status</span>
            <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
          </div>
          {subscriptionDetails?.currentPeriodEnd && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Next Billing Date</span>
              <span className="font-medium">
                {new Date(subscriptionDetails.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            You can manage your subscription in your account settings at any time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button className="w-full" asChild>
              <Link href="/dashboard/home">
                Start Learning <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/dashboard/account">
                <FileText className="mr-2 h-4 w-4" />
                Manage Subscription
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Get Started with Your New Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Here are some things you can do with your new subscription:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Create unlimited AI-generated quizzes</li>
            <li>Access premium courses and content</li>
            <li>Generate personalized learning paths</li>
            <li>Track your progress with detailed analytics</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/dashboard/explore">
              Explore New Content
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
