"use client"

import { Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SiStripe } from "react-icons/si"

export function StripeSecureCheckout() {
  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium">This site uses Stripe for secure payments</span>
          </div>
          <div className="flex items-center justify-center">
            <SiStripe className="h-6 w-6 text-slate-900 dark:text-slate-100" />
          </div>
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 underline"
          >
            Learn more about Stripe
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

