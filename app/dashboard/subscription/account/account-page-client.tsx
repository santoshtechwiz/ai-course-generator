"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreditCard, User, Settings, Bell, Shield, Key, FileText, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { BillingHistory } from "../components/billing-history"
import { ManageSubscription } from "../components/manage-subscription"
import { ReferralSystem } from "../components/referral-system"


export function AccountPageClient({ user }: { user: any }) {
  const { subscriptionStatus, isLoading, setSubscriptionStatus, setIsLoading } = useSubscriptionStore()

  const [billingHistory, setBillingHistory] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user?.id) return

      setIsLoading(true)
      try {
        // Fetch subscription data from API route
        const response = await fetch("/api/account/subscription")
        if (!response.ok) throw new Error("Failed to fetch subscription data")
        const data = await response.json()

        // Update the store with the fetched data
        setSubscriptionStatus(data)
      } catch (error) {
        console.error("Error fetching subscription data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptionData()
  }, [user, setSubscriptionStatus, setIsLoading])

  // Fetch billing history and payment methods separately
  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user?.id) return

      try {
        // Fetch billing history from API route
        const historyResponse = await fetch("/api/account/billing-history")
        if (historyResponse.ok) {
          const history = await historyResponse.json()
          setBillingHistory(history)
        }

        // Fetch payment methods from API route
        const methodsResponse = await fetch("/api/account/payment-methods")
        if (methodsResponse.ok) {
          const methods = await methodsResponse.json()
          setPaymentMethods(methods)
        }
      } catch (error) {
        console.error("Error fetching billing data:", error)
      }
    }

    fetchBillingData()
  }, [user])

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

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  // Format subscription data for the ManageSubscription component
  const formattedSubscriptionData = {
    currentPlan: subscriptionStatus?.subscriptionPlan || "FREE",
    subscriptionStatus: subscriptionStatus?.isSubscribed ? "ACTIVE" : "INACTIVE",
    endDate: subscriptionStatus?.expirationDate ? new Date(subscriptionStatus.expirationDate) : null,
    tokensUsed: subscriptionStatus?.credits || 0,
    billingHistory,
    paymentMethods,
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
              <Link href="/dashboard/account">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start text-primary" asChild>
              <Link href="/dashboard/account/subscription">
                <CreditCard className="mr-2 h-4 w-4" />
                Subscription
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/dashboard/account/notifications">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/dashboard/account/security">
                <Shield className="mr-2 h-4 w-4" />
                Security
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/dashboard/account/api-keys">
                <Key className="mr-2 h-4 w-4" />
                API Keys
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

