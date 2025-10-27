"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Receipt, Download, Calendar, CreditCard, AlertTriangle } from "lucide-react"

interface BillingHistoryItem {
  id: string
  date: string
  amount: number
  status: "paid" | "pending" | "failed"
  description: string
  invoiceUrl?: string
}

async function fetchBillingHistory(userId: string): Promise<BillingHistoryItem[]> {
  const response = await fetch('/api/subscriptions/billing-history', {
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
  const { data, isLoading, error, refetch, isFetching } = useBillingHistory(userId)

  // Get CSS class based on payment status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'uncollectible': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'void': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'draft': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  // Format currency amount with proper currency symbol
  const formatAmount = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase() || 'USD',
      minimumFractionDigits: 2
    }).format(amount / 100)
  }

  // Format date with user-friendly representation
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    
    // Check if it's a valid date
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }
  
  // Format human readable status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid'
      case 'open': return 'Unpaid'
      case 'uncollectible': return 'Failed'
      case 'void': return 'Voided'
      case 'draft': return 'Draft'
      default: return status.charAt(0).toUpperCase() + status.slice(1)
    }
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
        <CardContent className="text-center py-6">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            <p className="text-sm text-muted-foreground">There was an error loading your billing history</p>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm"
              disabled={isFetching}
            >
              Try again
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isFetching}
          >
            <span className="sr-only">Refresh</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        </CardTitle>
        <CardDescription>Your recent billing and payment history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div 
              key={item.id}
              className="flex items-center justify-between p-4 rounded-none border border-border bg-card hover:bg-accent/5 transition-colors"
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
