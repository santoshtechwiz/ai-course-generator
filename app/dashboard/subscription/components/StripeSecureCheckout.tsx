"use client"

import { Shield, Lock, CreditCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SiStripe } from "react-icons/si"

export function StripeSecureCheckout() {
  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="font-medium">Secure Checkout</span>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative h-8 w-32">
              <SiStripe className="absolute top-0 left-0 h-full w-full text-slate-900 dark:text-slate-100" />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Your payment information is processed securely by Stripe. We do not store your credit card details.
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Secure Payments</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <div className="h-6 w-10 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"></div>
            <div className="h-6 w-10 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"></div>
            <div className="h-6 w-10 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"></div>
            <div className="h-6 w-10 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

