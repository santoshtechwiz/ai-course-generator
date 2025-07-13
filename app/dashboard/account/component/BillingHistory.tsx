"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Receipt, Download, Calendar, CreditCard } from "lucide-react"

interface BillingHistoryItem {
  id: string
  date: string
  amount: number
  status: "paid" | "pending" | "failed"
  description: string
  invoiceUrl?: string
}

async function fetchBillingHistory(userId: string): Promise<BillingHistoryItem[]> {
  const response = await fetch('/api/billing/history', {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error("Failed to fetch billing history")
  }

  const data = await response.json()
  return data.history || []
}

function useBillingHistory(userId: string) {
  return useQuery<BillingHistoryItem[], Error>({
    queryKey: ["billing-history", userId],
    queryFn: () => fetchBillingHistory(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  })
}

export function BillingHistory({ userId }: { userId: string }) {
  const { data, isLoading, error, refetch } = useBillingHistory(userId)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>Your recent billing and payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>Your recent billing and payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error.message}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>Your recent billing and payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No billing history yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your payment history will appear here once you make your first payment
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
       
        <CardDescription>Your recent billing and payment history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item) => (
            <div 
              key={item.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.description}</p>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(item.date)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatAmount(item.amount)}</span>
                {item.invoiceUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(item.invoiceUrl!, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Invoice
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
