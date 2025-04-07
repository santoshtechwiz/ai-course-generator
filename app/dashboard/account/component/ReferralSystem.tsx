"use client"

/**
 * ReferralSystem Component
 *
 * This component displays the referral system UI and handles
 * referral code generation and sharing.
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Share2, Copy, Check, Gift } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReferralSystemProps {
  userId: string | null
}

export function ReferralSystem({ userId }: ReferralSystemProps) {
  const [referralCode, setReferralCode] = useState<string>("")
  const [referrals, setReferrals] = useState<number>(0)
  const [rewards, setRewards] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Simulate fetching referral data
    if (userId) {
      //get the referral code from the server
      fetch(`/api/referral/${userId}`)
        .then((response) => response.json())
        .then((data) => {
          setReferralCode(data.referralCode)
          setReferrals(data.referrals)
          setRewards(data.rewards)
        })
        .catch((error) => {
          console.error("Error fetching referral data:", error)
        })
    }
  }, [userId])

  const copyToClipboard = () => {
    const referralUrl = `${window.location.origin}/dashboard/subscription?ref=${referralCode}`
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    toast({
      title: "Copied to clipboard!",
      description: "Referral link has been copied to your clipboard.",
      variant: "default",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const shareReferral = () => {
    const referralUrl = `${window.location.origin}/dashboard/subscription?ref=${referralCode}`
    if (navigator.share) {
      navigator.share({
        title: "Join me on Course AI",
        text: "Get started with Course AI and receive a special discount!",
        url: referralUrl,
      })
    } else {
      copyToClipboard()
    }
  }

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Refer Friends & Earn Rewards</CardTitle>
          <CardDescription>Sign in to get your referral code and start earning rewards.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" disabled>
            Sign in to refer friends
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200 dark:border-slate-700 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-t-xl">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full">
            <Gift className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-center text-2xl">Refer Friends & Earn Rewards</CardTitle>
        <CardDescription className="text-center">
          Share your referral code with friends and earn free tokens when they subscribe.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Successful Referrals</p>
            <p className="text-2xl font-bold">{referrals}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Tokens Earned</p>
            <p className="text-2xl font-bold">{rewards}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="referral-code" className="text-sm font-medium mb-2 block">
              Your Referral Code
            </label>
            <div className="flex">
              <Input id="referral-code" value={referralCode} readOnly className="rounded-r-none font-mono" />
              <Button variant="outline" className="rounded-l-none border-l-0" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={shareReferral}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share with Friends
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 dark:bg-slate-800 rounded-b-xl flex flex-col text-center text-sm text-muted-foreground">
        <p>For each friend who subscribes, you'll both receive 10 free tokens!</p>
      </CardFooter>
    </Card>
  )
}

