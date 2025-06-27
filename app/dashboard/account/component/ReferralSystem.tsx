"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Share2, Copy, Check, Gift, Loader2 } from "lucide-react"
import { useToast } from "@/hooks"
import { Skeleton } from "@/components/ui/skeleton"

interface ReferralSystemProps {
  userId: string | null
}

interface ReferralData {
  referralCode: string
  totalReferrals: number
  completedReferrals: number
  pendingReferrals: number
  tokensEarned: number
}

export function ReferralSystem({ userId }: ReferralSystemProps) {
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const fetchReferralData = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/referrals?userId=${userId}`)
      const data = await response.json()

      if (response.ok) {
        setReferralData(data)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load referral data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching referral data:", error)
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [userId, toast])

  useEffect(() => {
    fetchReferralData()
  }, [fetchReferralData])

  const copyToClipboard = useCallback(() => {
    if (!referralData?.referralCode) return

    const referralUrl = `${window.location.origin}/dashboard/subscription?ref=${referralData.referralCode}`
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }, [referralData?.referralCode, toast])

  const shareReferral = useCallback(() => {
    if (!referralData?.referralCode) {
      toast({
        title: "No referral code",
        description: "Please wait while we generate your referral code",
        variant: "destructive",
      })
      return
    }

    const referralUrl = `${window.location.origin}/dashboard/subscription?ref=${referralData.referralCode}`

    if (navigator.share) {
      navigator
        .share({
          title: "Join me on this awesome platform!",
          text: `Use my referral code ${referralData.referralCode} to get started with a special bonus!`,
          url: referralUrl,
        })
        .catch(() => copyToClipboard())
    } else {
      copyToClipboard()
    }
  }, [referralData?.referralCode, toast, copyToClipboard])

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

  if (loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-700 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-t-xl space-y-4">
          <Skeleton className="h-8 w-8 mx-auto rounded-full" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-2/3 mx-auto" />
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </CardContent>
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
        {/* Ensure consistent grid styling */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Referrals" value={referralData?.totalReferrals ?? 0} />
          <StatCard label="Completed" value={referralData?.completedReferrals ?? 0} />
          <StatCard label="Tokens Earned" value={referralData?.tokensEarned ?? 0} />
        </div>

        {/* Ensure consistent input and button styling */}
        <div className="space-y-4">
          <div>
            <label htmlFor="referral-code" className="text-sm font-medium mb-2 block">
              Your Referral Code
              {!referralData?.referralCode && (
                <span className="ml-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 inline animate-spin" />
                  Generating...
                </span>
              )}
            </label>
            <div className="flex">
              <Input
                id="referral-code"
                value={referralData?.referralCode || "Generating..."}
                readOnly
                className="rounded-r-none font-mono"
              />
              <Button
                variant="outline"
                className="rounded-l-none border-l-0"
                onClick={copyToClipboard}
                disabled={!referralData?.referralCode}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Ensure consistent button styling */}
          <div className="pt-2 space-y-2">
            <Button
              onClick={shareReferral}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              disabled={!referralData?.referralCode}
            >
              {!referralData?.referralCode ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Share with Friends
            </Button>
            <p className="text-xs text-muted-foreground text-center">Earn 10 tokens for each successful referral</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 dark:bg-slate-800 rounded-b-xl flex flex-col text-center text-sm text-muted-foreground">
        <p>For each friend who subscribes, you'll both receive 10 free tokens!</p>
        {referralData?.pendingReferrals && referralData.pendingReferrals > 0 && (
          <p className="mt-1 text-blue-500 dark:text-blue-400">
            You have {referralData.pendingReferrals} pending referrals
          </p>
        )}
      </CardFooter>
    </Card>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
