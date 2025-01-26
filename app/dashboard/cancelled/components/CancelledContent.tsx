"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export function CancelledContent() {
  useEffect(() => {
    toast({
      title: "Subscription Cancelled",
      description: "Your subscription process was not completed. No payment was processed.",
      variant: "destructive",
    })
  }, [])

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
      <h1 className="text-3xl font-bold mb-6">Subscription Canceled</h1>
      <p className="mb-6 text-gray-600">
        Your subscription process was canceled and no payment was processed. Your account status remains unchanged.
      </p>
      <div className="space-y-4">
        <Button asChild className="w-full">
          <Link href="/subscription">Try Again</Link>
        </Button>
        <Button variant="outline" asChild className="w-full">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}

