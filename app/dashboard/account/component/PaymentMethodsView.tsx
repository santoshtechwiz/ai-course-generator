"use client"

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { CreditCard, PlusCircle, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery, useMutation } from '@tanstack/react-query'

interface PaymentMethodProps {
  userId: string
}

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

// Fetch payment methods
const fetchPaymentMethods = async (userId: string) => {
  const response = await fetch('/api/subscriptions/payment-methods', {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch payment methods')
  }

  const data = await response.json()
  return data.methods || []
}

// Format card brand name with proper capitalization
const formatCardBrand = (brand: string): string => {
  switch(brand.toLowerCase()) {
    case 'visa': return 'Visa'
    case 'mastercard': return 'Mastercard'
    case 'amex': return 'American Express'
    case 'discover': return 'Discover'
    case 'diners': return 'Diners Club'
    case 'jcb': return 'JCB'
    case 'unionpay': return 'UnionPay'
    default: return brand.charAt(0).toUpperCase() + brand.slice(1)
  }
}

export const PaymentMethodsView = ({ userId }: PaymentMethodProps) => {
  const [showAddCard, setShowAddCard] = useState(false)
  
  // Use React Query to fetch payment methods
  const { 
    data: paymentMethods, 
    isLoading, 
    error,
    refetch
  } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods', userId],
    queryFn: () => fetchPaymentMethods(userId),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  })

  // Set default payment method
  const setDefaultPaymentMethod = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await fetch('/api/subscriptions/payment-methods/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
        credentials: 'include',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to set default payment method')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      refetch()
    }
  })

  // Delete payment method
  const deletePaymentMethod = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await fetch('/api/subscriptions/payment-methods/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
        credentials: 'include',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete payment method')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      refetch()
    },
    onError: (error) => {
      alert(error.message)
    }
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
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
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mt-3 text-sm font-medium">Failed to load payment methods</h3>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm"
              className="mt-3"
            >
              Try Again
            </Button>
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
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddCard(true)}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Add Card
          </Button>
        </CardTitle>
        <CardDescription>Manage your payment methods</CardDescription>
      </CardHeader>
      <CardContent>
        {!paymentMethods || paymentMethods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No payment methods on file</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a payment method to manage your subscription
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div 
                key={method.id}
                className="flex items-center justify-between p-4 rounded-none border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-14 flex items-center justify-center rounded bg-accent/10">
                    <span className="font-medium">{formatCardBrand(method.brand)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      •••• {method.last4}
                      {method.isDefault && (
                        <Badge className="ml-2" variant="outline">Default</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultPaymentMethod.mutate(method.id)}
                      disabled={setDefaultPaymentMethod.isPending}
                      title="Set as default"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="sr-only">Set as default</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (method.isDefault) {
                        alert("You cannot delete your default payment method. Set another method as default first.")
                        return
                      }
                      if (confirm("Are you sure you want to remove this payment method?")) {
                        deletePaymentMethod.mutate(method.id)
                      }
                    }}
                    disabled={deletePaymentMethod.isPending || method.isDefault}
                    title={method.isDefault ? "Cannot delete default payment method" : "Delete"}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Card addition modal */}
        {showAddCard && (
          <div className="mt-6 p-6 border rounded-none bg-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Payment Method</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddCard(false)}
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Close</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-none border-muted">
                <div className="text-center space-y-2">
                  <CreditCard className="h-10 w-10 text-muted-foreground mx-auto" />
                  <h3 className="font-medium">Stripe integration coming soon</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    The ability to add new payment methods will be available in the next update.
                    Check back soon!
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddCard(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}