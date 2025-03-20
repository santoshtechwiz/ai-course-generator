"use client"

import { useState, useEffect } from "react"
import { Copy, Share2, RefreshCw, Loader2, Users, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ReferralSystemProps {
  userId: string | null
}

interface ReferralStats {
  referralCode: string
  totalReferrals: number
  completedReferrals: number
  pendingReferrals: number
  tokensEarned: number
  recentReferrals: Array<{
    id: string
    referredName: string
    status: string
    planId: string
    date: string
  }>
}

export function ReferralSystem({ userId }: ReferralSystemProps) {
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const fetchReferralStats = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:3000/api/referrals`)

      if (!response.ok) {
        throw new Error("Failed to fetch referral stats")
      }

      const data = await response.json()
      setReferralStats(data)
    } catch (error) {
      console.error("Error fetching referral stats:", error)
      toast({
        title: "Error",
        description: "Failed to load referral information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReferralStats()
  }, [userId])

  const generateReferralCode = async () => {
    if (!userId) return

    setIsGenerating(true)
    try {
      const response = await fetch(`http://localhost:3000/api/referrals/generate`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to generate referral code")
      }

      const data = await response.json()

      toast({
        title: "Referral Code Generated",
        description: "Your referral code has been generated successfully.",
        variant: "default",
      })

      fetchReferralStats()
    } catch (error) {
      console.error("Error generating referral code:", error)
      toast({
        title: "Error",
        description: "Failed to generate referral code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyReferralLink = () => {
    if (!referralStats?.referralCode) return

    const referralLink = `${window.location.origin}/dashboard/subscription?ref=${referralStats.referralCode}`
    navigator.clipboard.writeText(referralLink)

    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
      variant: "default",
    })
  }

  const shareReferralLink = () => {
    if (!referralStats?.referralCode) return

    const referralLink = `${window.location.origin}/dashboard/subscription?ref=${referralStats.referralCode}`
    const shareText = "Join me on Course AI and get 5 free tokens! Use my referral link:"

    if (navigator.share) {
      navigator
        .share({
          title: "Join me on Course AI",
          text: shareText,
          url: referralLink,
        })
        .catch((error) => {
          console.error("Error sharing:", error)
        })
    } else {
      // Fallback for browsers that don't support the Web Share API
      window.open(
        `mailto:?subject=Join me on Course AI&body=${encodeURIComponent(shareText + " " + referralLink)}`,
        "_blank",
      )
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Refer Friends & Earn Rewards
        </CardTitle>
        <CardDescription>
          Invite your friends to join Course AI. You'll earn 10 tokens for each friend who subscribes, and they'll get 5
          bonus tokens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !referralStats?.referralCode ? (
          <div className="text-center py-6">
            <Gift className="h-12 w-12 mx-auto text-primary/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Generate Your Referral Link</h3>
            <div className="text-sm text-muted-foreground mb-4">
              Create your unique referral link to share with friends and start earning rewards.
            </div>
            <Button onClick={generateReferralCode} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  Generate Referral Link
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label htmlFor="referral-link" className="text-sm font-medium block mb-1">
                  Your Referral Link
                </label>
                <div className="flex gap-2">
                  <Input
                    id="referral-link"
                    value={`${window.location.origin}/dashboard/subscription?ref=${referralStats.referralCode}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={copyReferralLink} title="Copy to clipboard">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={shareReferralLink} title="Share">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Referrals</div>
                  <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Completed Referrals</div>
                  <div className="text-2xl font-bold">{referralStats.completedReferrals}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Tokens Earned</div>
                  <div className="text-2xl font-bold">{referralStats.tokensEarned}</div>
                </div>
              </div>
            </div>

            {referralStats.recentReferrals.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Recent Referrals</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referralStats.recentReferrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell className="font-medium">{referral.referredName || "Anonymous"}</TableCell>
                          <TableCell>{referral.planId || "N/A"}</TableCell>
                          <TableCell>
                            <ReferralStatusBadge status={referral.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(referral.date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 items-start">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">How it works:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Share your unique referral link with friends</li>
            <li>When they sign up and subscribe to a paid plan, you both earn rewards</li>
            <li>You get 10 tokens for each successful referral</li>
            <li>Your friend gets 5 bonus tokens when they join</li>
          </ol>
        </div>
        {referralStats?.referralCode && (
          <Button variant="outline" size="sm" onClick={fetchReferralStats} className="ml-auto">
            <RefreshCw className="mr-2 h-3 w-3" />
            Refresh Stats
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function ReferralStatusBadge({ status }: { status: string }) {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return (
        <Badge variant="default" className="bg-green-500">
          Completed
        </Badge>
      )
    case "PENDING":
      return (
        <Badge variant="outline" className="text-orange-500 border-orange-500">
          Pending
        </Badge>
      )
    case "CANCELLED":
      return <Badge variant="destructive">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

