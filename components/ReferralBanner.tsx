"use client"

import { useState } from "react"
import { Gift, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ReferralBannerProps {
  referralCode: string | null
  onDismiss: () => void
}

export function ReferralBanner({ referralCode, onDismiss }: ReferralBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!referralCode || !isVisible) {
    return null
  }

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss()
  }

  return (
    <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-5 duration-300">
      <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
      <AlertTitle className="text-green-700 dark:text-green-300 font-semibold">Referral Code Applied!</AlertTitle>
      <AlertDescription className="text-green-600 dark:text-green-400 flex items-center justify-between">
        <div>
          <p>
            You're using a referral code{" "}
            <Badge
              variant="outline"
              className="bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 ml-1"
            >
              {referralCode}
            </Badge>
          </p>
          <p className="text-sm mt-1">
            This will be automatically applied during checkout to give you and your referrer bonus tokens!
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-green-100 dark:hover:bg-green-800"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}
