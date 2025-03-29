"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreditCard, User, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { BillingHistory } from "../components/BillingHistory"
import { ManageSubscription } from "../components/ManageSubscription"
import { ReferralSystem } from "../components/ReferralSystem"

export function AccountPageClient({ user }: { user: any }) {
  const { subscriptionStatus, isLoading, setSubscriptionStatus, setIsLoading } = useSubscriptionStore()

  const [billingHistory, setBillingHistory] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])

  // Optimize data fetching with proper cleanup
  useEffect(() => {
    if (!user?.id) return

    let isMounted = true
    const controller = new AbortController()
    const signal = controller.signal

    const fetchSubscriptionData = async () => {
      setIsLoading(true)
      try {
        // Fetch subscription data from API route with timeout and abort controller
        const response = await fetch("/api/account/subscription", {
          signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) throw new Error("Failed to fetch subscription data")
        const data = await response.json()

        // Only update state if component is still mounted
        if (isMounted) {
          // Ensure tokens/credits are properly set even if they're 0
          if (data.credits === undefined || data.credits === null) {
            data.credits = 0
          }

          setSubscriptionStatus(data)
        }
      } catch (error) {
        if (error.name !== "AbortError" && isMounted) {
          console.error("Error fetching subscription data:", error)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSubscriptionData()

    // Cleanup function to prevent memory leaks and state updates on unmounted components
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [user, setSubscriptionStatus, setIsLoading])

  // Fetch billing history and payment methods with proper cleanup
  useEffect(() => {
    if (!user?.id) return

    let isMounted = true
    const controller = new AbortController()
    const signal = controller.signal

    const fetchBillingData = async () => {
      try {
        // Fetch billing history from API route
        const historyResponse = await fetch("/api/account/billing-history", { signal })
        if (historyResponse.ok && isMounted) {
          const history = await historyResponse.json()
          setBillingHistory(history)
        }

        // Fetch payment methods from API route
        const methodsResponse = await fetch("/api/account/payment-methods", { signal })
        if (methodsResponse.ok && isMounted) {
          const methods = await methodsResponse.json()
          setPaymentMethods(methods)
        }
      } catch (error) {
        if (error.name !== "AbortError" && isMounted) {
          console.error("Error fetching billing data:", error)
        }
      }
    }

    fetchBillingData()

    // Cleanup function
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [user])

  // Memoize user initials to avoid recalculation on every render
  const initials = useMemo(() => {
    return user?.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "U"
  }, [user?.name])

  // Memoize formatted subscription data
  const formattedSubscriptionData = useMemo(() => {
    // Ensure tokensUsed is always a number, defaulting to 0 if undefined/null
    const normalizedTokensUsed = typeof subscriptionStatus?.credits === "number" ? subscriptionStatus.credits : 0

    return {
      currentPlan: subscriptionStatus?.subscriptionPlan || "FREE",
      subscriptionStatus: subscriptionStatus?.isSubscribed ? "ACTIVE" : "INACTIVE",
      endDate: subscriptionStatus?.expirationDate ? new Date(subscriptionStatus.expirationDate) : null,
      tokensUsed: normalizedTokensUsed,
      billingHistory,
      paymentMethods,
    }
  }, [subscriptionStatus, billingHistory, paymentMethods])

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading account information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <div className="space-y-1 px-6">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/dashboard">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start text-primary" asChild>
              <Link href="/dashboard/dashboard">
                <CreditCard className="mr-2 h-4 w-4" />
                Learning Path
              </Link>
            </Button>
          </div>
          <CardFooter className="flex flex-col items-start px-6 py-4">
            <div className="text-xs text-muted-foreground mb-2">
              Logged in as <strong>{user.email}</strong>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/api/auth/signout">Sign out</Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="md:col-span-3 space-y-6">
          <ManageSubscription userId={user.id} subscriptionData={formattedSubscriptionData} />

          <Tabs defaultValue="referrals" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger id="billing-tab" value="billing">
                Billing History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="referrals" className="mt-4">
              <ReferralSystem userId={user.id} />
            </TabsContent>
            <TabsContent value="billing" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>View your past invoices and payments</CardDescription>
                </CardHeader>
                <BillingHistory billingHistory={billingHistory} />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

