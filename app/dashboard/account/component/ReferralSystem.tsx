"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Share2, Copy, Check, Gift, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const [referralData, setReferralData] = useState<ReferralData>({
    referralCode: "",
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    tokensEarned: 0
  })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!userId) {
        setLoading(false)
        return
      }
  
      try {
        setLoading(true)
        const response = await fetch(`/api/referrals`)
        const data = await response.json()
  
        if (response.ok) {
          let referralCode = data.referralCode || ""
  
          // If referralCode is missing, generate a new one
          if (!referralCode) {
            const generateRes = await fetch(`/api/referrals/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            })
  
            const generateData = await generateRes.json()
  
            if (generateRes.ok && generateData.referralCode) {
              referralCode = generateData.referralCode
            } else {
              toast({
                title: "Error",
                description: generateData.error || "Failed to generate referral code",
                variant: "destructive",
              })
            }
          }
  
          setReferralData({
            referralCode,
            totalReferrals: data.totalReferrals || 0,
            completedReferrals: data.completedReferrals || 0,
            pendingReferrals: data.pendingReferrals || 0,
            tokensEarned: data.tokensEarned || 0,
          })
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
    }
  
    fetchReferralData()
  }, [userId, toast])
  

  const copyToClipboard = () => {
    if (!referralData.referralCode) return
    
    const referralUrl = `${window.location.origin}/dashboard/subscription?ref=${referralData.referralCode}`
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const shareReferral = () => {
    if (!referralData.referralCode) {
      toast({
        title: "No referral code",
        description: "Please wait while we generate your referral code",
        variant: "destructive",
      })
      return
    }

    const referralUrl = `${window.location.origin}/dashboard/subscription?ref=${referralData.referralCode}`
    
    if (navigator.share) {
      navigator.share({
        title: "Join me on this awesome platform!",
        text: `Use my referral code ${referralData.referralCode} to get started with a special bonus!`,
        url: referralUrl,
      }).catch(() => {
        // Fallback if share fails
        copyToClipboard()
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

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading your referral information...</p>
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
            <p className="text-2xl font-bold">{referralData.totalReferrals}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Completed</p>
            <p className="text-2xl font-bold">{referralData.completedReferrals}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Tokens Earned</p>
            <p className="text-2xl font-bold">{referralData.tokensEarned}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="referral-code" className="text-sm font-medium mb-2 block">
              Your Referral Code
            </label>
            <div className="flex">
              <Input 
                id="referral-code" 
                value={referralData.referralCode || "Generating..."} 
                readOnly 
                className="rounded-r-none font-mono" 
              />
              <Button 
                variant="outline" 
                className="rounded-l-none border-l-0" 
                onClick={copyToClipboard}
                disabled={!referralData.referralCode}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <Button
              onClick={shareReferral}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              disabled={!referralData.referralCode}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share with Friends
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Earn 10 tokens for each successful referral
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 dark:bg-slate-800 rounded-b-xl flex flex-col text-center text-sm text-muted-foreground">
        <p>For each friend who subscribes, you'll both receive 10 free tokens!</p>
        {referralData.pendingReferrals > 0 && (
          <p className="mt-1 text-blue-500 dark:text-blue-400">
            You have {referralData.pendingReferrals} pending referrals
          </p>
        )}
      </CardFooter>
    </Card>
  )
}