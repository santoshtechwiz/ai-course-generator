"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export function SuccessContent() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Subscription Successful!</h1>
      <p className="mb-4">Thank you for subscribing to our service.</p>
      <Button asChild>
        <Link href="/dashboard">Return to Home</Link>
      </Button>
    </div>
  )
}

