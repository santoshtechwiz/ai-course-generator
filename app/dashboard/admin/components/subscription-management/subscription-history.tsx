"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/app/dashboard/account/component/status-badge"
import { PlanBadge } from "@/app/dashboard/subscription/components/subscription-status/plan-badge"


interface SubscriptionEvent {
  id: string
  userId: string
  eventType: string
  planId: string
  status: string
  createdAt: string
  metadata?: any
}

interface SubscriptionHistoryProps {
  userId: string
}

export function SubscriptionHistory({ userId }: SubscriptionHistoryProps) {
  const [events, setEvents] = useState<SubscriptionEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscriptionHistory = async () => {
      if (!userId) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/subscriptions/history?userId=${userId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch subscription history")
        }

        const data = await response.json()
        setEvents(data.events || [])
      } catch (err) {
        console.error("Error fetching subscription history:", err)
        setError("Failed to load subscription history. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptionHistory()
  }, [userId])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription History</CardTitle>
          <CardDescription>View the subscription history for this user</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription History</CardTitle>
          <CardDescription>View the subscription history for this user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  function formatDateWithTime(createdAt: string): React.ReactNode {
    const date = new Date(createdAt)
    if (isNaN(date.getTime())) {
      return "Invalid date"
    }
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription History</CardTitle>
        <CardDescription>View the subscription history for this user</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">No subscription history available</div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-md p-4">
                <div className="flex flex-col sm:flex-row justify-between mb-2">
                  <div className="font-medium">{getEventTitle(event.eventType)}</div>
                  <div className="text-sm text-muted-foreground">{formatDateWithTime(event.createdAt)}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Plan:</span>
                    <PlanBadge plan={event.planId} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <StatusBadge status={event.status} />
                  </div>
                </div>
                {event.metadata && (
                  <div className="mt-2 text-sm text-muted-foreground">{JSON.stringify(event.metadata)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getEventTitle(eventType: string): string {
  switch (eventType) {
    case "SUBSCRIPTION_CREATED":
      return "Subscription Created"
    case "SUBSCRIPTION_UPDATED":
      return "Subscription Updated"
    case "SUBSCRIPTION_CANCELED":
      return "Subscription Canceled"
    case "SUBSCRIPTION_RESET":
      return "Subscription Reset"
    case "SUBSCRIPTION_DEACTIVATED":
      return "Subscription Deactivated"
    case "PAYMENT_SUCCEEDED":
      return "Payment Succeeded"
    case "PAYMENT_FAILED":
      return "Payment Failed"
    default:
      return eventType.replace(/_/g, " ")
  }
}

