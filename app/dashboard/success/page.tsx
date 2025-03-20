import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/db"

// Update the SuccessPage component to check for referral completion
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const { session_id } = searchParams

  if (!session_id) {
    redirect("/dashboard")
  }

  // Check if this was a referral signup
  let referralBonus = null
  try {
    const referralUse = await prisma.userReferralUse.findFirst({
      where: {
        referredId: session.user.id,
        status: "COMPLETED",
      },
      include: {
        referrer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    })

    if (referralUse) {
      referralBonus = {
        tokensReceived: 5,
        referrerName: referralUse.referrer.name || "A friend",
      }
    }
  } catch (error) {
    console.error("Error checking referral:", error)
    // Continue without referral info if there's an error
  }

  return (
    <div className="container max-w-md py-12">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Subscription Successful!</CardTitle>
          <CardDescription>
            Thank you for subscribing. Your account has been updated with your new plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Your subscription is now active. You can start using all the features included in your plan immediately.
          </p>

          {referralBonus && (
            <div className="bg-green-50 p-4 rounded-md mb-4">
              <p className="font-medium text-green-700">You received {referralBonus.tokensReceived} bonus tokens!</p>
              <p className="text-sm text-green-600">Thanks for using {referralBonus.referrerName}'s referral link.</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to your registered email address.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/subscription">View Subscription Details</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

