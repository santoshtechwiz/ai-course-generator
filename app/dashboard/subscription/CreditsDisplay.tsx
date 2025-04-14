"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Coins } from "lucide-react"
import useSubscriptionStore from "@/store/useSubscriptionStore"

export function CreditsDisplay() {
  const { subscriptionStatus, refreshSubscription } = useSubscriptionStore()
  const [credits, setCredits] = useState(0)
  const [tokensUsed, setTokensUsed] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch subscription status on mount
    const fetchData = async () => {
      setIsLoading(true)
      await refreshSubscription()
      setIsLoading(false)
    }

    fetchData()

    // Set up interval to refresh data
    const intervalId = setInterval(fetchData, 60000) // Refresh every minute

    return () => clearInterval(intervalId)
  }, [refreshSubscription])

  useEffect(() => {
    if (subscriptionStatus) {
      setCredits(subscriptionStatus.credits || 0)
      setTokensUsed(subscriptionStatus.tokensUsed || 0)
    }
  }, [subscriptionStatus])

  // Calculate percentage for progress bar
  const totalCredits = credits + tokensUsed
  const usagePercentage = totalCredits > 0 ? (tokensUsed / totalCredits) * 100 : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
        <Coins className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{credits}</div>
        <Progress value={usagePercentage} className="h-2 mt-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {tokensUsed} used of {totalCredits} total credits
        </p>
      </CardContent>
    </Card>
  )
}
