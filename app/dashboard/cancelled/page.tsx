import { Suspense } from "react"
import Link from "next/link"
import { getAuthSession } from "@/lib/auth"
import { XCircle, AlertTriangle, ArrowLeft, RefreshCw, CreditCard, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default async function PaymentCancelledPage() {
  const session = await getAuthSession()
  const userId = session?.user?.id

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Your payment process was cancelled. No charges have been made to your account.
        </p>
      </div>

      <Suspense fallback={<CancelledPageSkeleton />}>
        <CancelledPageContent userId={userId} />
      </Suspense>
    </div>
  )
}

function CancelledPageSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-[300px] w-full rounded-xl" />
      <Skeleton className="h-[200px] w-full rounded-xl" />
    </div>
  )
}

async function CancelledPageContent({ userId }: { userId: string | undefined }) {
  // We could fetch additional user data here if needed
  // For now, we'll just provide a generic experience

  return (
    <div className="space-y-8">
      <Card className="border border-slate-200 dark:border-slate-700 shadow-md">
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
          <CardDescription>Here's what you need to know about your cancelled payment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">Payment Not Processed</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              Your payment was not processed and no charges have been made to your payment method. Your account remains
              on its current plan.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-medium mb-2 flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 text-blue-500" /> Try Again
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                You can try the payment process again. Sometimes temporary issues with payment processors can be
                resolved by trying again.
              </p>
              <Button
                asChild
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Link href="/dashboard/subscription">Try Again</Link>
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-medium mb-2 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-500" /> Payment Methods
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Consider using a different payment method if you're experiencing issues with your current one.
              </p>
              <Button asChild variant="outline" className="w-full border-slate-300 dark:border-slate-600">
                <Link href="/dashboard/account">Manage Payment Methods</Link>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild variant="ghost" className="w-full">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card className="border border-slate-200 dark:border-slate-700 shadow-md">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Common questions about cancelled payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="payment" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payment">Payment Issues</TabsTrigger>
              <TabsTrigger value="account">Account Status</TabsTrigger>
            </TabsList>
            <TabsContent value="payment" className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b border-slate-200 dark:border-slate-700">
                  <AccordionTrigger className="text-left">Will I be charged for a cancelled payment?</AccordionTrigger>
                  <AccordionContent>
                    No, when you cancel a payment during the checkout process, no charges are made to your payment
                    method. The payment process is completely abandoned.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-b border-slate-200 dark:border-slate-700">
                  <AccordionTrigger className="text-left">Why was my payment not going through?</AccordionTrigger>
                  <AccordionContent>
                    Payments can fail for various reasons, including insufficient funds, temporary issues with the
                    payment processor, expired cards, or security measures from your bank. If you continue to experience
                    issues, consider contacting your bank or using a different payment method.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-b border-slate-200 dark:border-slate-700">
                  <AccordionTrigger className="text-left">
                    Is there a limit to how many times I can retry?
                  </AccordionTrigger>
                  <AccordionContent>
                    There is no specific limit to how many times you can attempt to make a payment. However, multiple
                    failed attempts might trigger security measures from your bank or payment provider.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            <TabsContent value="account" className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b border-slate-200 dark:border-slate-700">
                  <AccordionTrigger className="text-left">
                    What happens to my account after a cancelled payment?
                  </AccordionTrigger>
                  <AccordionContent>
                    Your account remains in its current state. If you were attempting to upgrade or subscribe to a new
                    plan, your account will stay on its current plan. No changes are made to your account when a payment
                    is cancelled.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-b border-slate-200 dark:border-slate-700">
                  <AccordionTrigger className="text-left">Will I lose my current subscription?</AccordionTrigger>
                  <AccordionContent>
                    No, cancelling a payment during checkout does not affect your current subscription. If you already
                    have an active subscription, it will continue as normal.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-b border-slate-200 dark:border-slate-700">
                  <AccordionTrigger className="text-left">
                    How can I check my current subscription status?
                  </AccordionTrigger>
                  <AccordionContent>
                    You can view your current subscription status by visiting your account page or the subscription
                    management section. This will show your current plan, billing cycle, and other relevant details.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" asChild>
            <Link href="/contact" className="flex items-center">
              <HelpCircle className="mr-2 h-4 w-4" />
              Still have questions? Contact Support
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
