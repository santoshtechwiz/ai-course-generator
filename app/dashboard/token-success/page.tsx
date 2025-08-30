import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, CoinsIcon } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function TokenSuccessPage({
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

  return (
    <div className="container max-w-md py-12">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Token Purchase Successful!</CardTitle>
          <CardDescription>Thank you for your purchase. Your tokens have been added to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 mb-4">
            <CoinsIcon className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Tokens Added to Your Account</span>
          </div>
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
