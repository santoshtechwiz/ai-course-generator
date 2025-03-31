"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Share2, RefreshCw, Loader2, Users, Gift, UserPlus, Award, Sparkles, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { SignInBanner } from "@/components/features/quiz/SignInBanner"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

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
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  // Fix the referral code functionality by properly handling API responses and user state
  // Update the fetchReferralStats function to properly handle API responses
  const fetchReferralStats = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Add proper error handling and timeout for the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`/api/referrals`, {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to fetch referral stats")
      }

      const data = await response.json()
      setReferralStats(data)
    } catch (error) {
      console.warn("Error fetching referral stats:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchReferralStats()
  }, [fetchReferralStats])

  // Update the generateReferralCode function to properly handle API responses
  const generateReferralCode = useCallback(async () => {
    if (!userId) return

    setIsGenerating(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`/api/referrals/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to generate referral code")
      }

      await response.json()

      toast({
        title: "Referral Code Generated",
        description: "Your referral code has been generated successfully.",
        variant: "default",
      })

      // Refresh stats to show the new code
      fetchReferralStats()
    } catch (error: any) {
      console.error("Error generating referral code:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate referral code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [userId, toast, fetchReferralStats])

  const copyReferralLink = useCallback(() => {
    if (!referralStats?.referralCode) return

    const referralLink = `${window.location.origin}/dashboard/subscription?ref=${referralStats.referralCode}`
    navigator.clipboard.writeText(referralLink)

    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)

    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
      variant: "default",
    })
  }, [referralStats?.referralCode, toast])

  const shareReferralLink = useCallback(() => {
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
  }, [referralStats?.referralCode])

  return (
    <Card className="w-full border border-border shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-primary-foreground/80 h-3"></div>
      <CardHeader className="bg-gradient-to-r from-muted/50 to-muted border-b border-border">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Refer Friends & Earn Rewards
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Invite your friends to join Course AI. You'll earn 10 tokens for each friend who subscribes, and they'll get 5
          bonus tokens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        {!userId ? (
          <div className="bg-gradient-to-r from-muted/50 to-muted rounded-xl p-4 sm:p-6 border border-border">
            <SignInBanner isAuthenticated={userId != null} title="Sign in to get your referral link" />
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-8 sm:py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your referral information...</p>
            </div>
          </div>
        ) : !referralStats?.referralCode ? (
          <div className="text-center py-8 sm:py-12 bg-gradient-to-r from-muted/50 to-muted rounded-xl border border-border">
            <div className="bg-gradient-to-r from-primary to-primary-foreground/80 p-4 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 flex items-center justify-center">
              <Gift className="h-10 w-10 sm:h-12 sm:w-12 text-primary-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3">Generate Your Referral Link</h3>
            <div className="text-sm text-muted-foreground mb-6 max-w-md mx-auto px-4">
              Create your unique referral link to share with friends and start earning rewards. Each successful referral
              earns you 10 tokens!
            </div>
            <Button
              onClick={generateReferralCode}
              disabled={isGenerating}
              className="bg-gradient-to-r from-primary to-primary-foreground/80 hover:from-primary/90 hover:to-primary-foreground/70 text-primary-foreground shadow-md"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-5 w-5" />
                  Generate Referral Link
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-muted/50 to-muted rounded-xl p-4 sm:p-6 border border-border">
              <div className="space-y-4">
                <div>
                  <label htmlFor="referral-link" className="text-sm font-medium block mb-2">
                    Your Referral Link
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="referral-link"
                      value={`${window.location.origin}/dashboard/subscription?ref=${referralStats.referralCode}`}
                      readOnly
                      className="flex-1 border-input bg-card"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyReferralLink}
                        title="Copy to clipboard"
                        className={cn(
                          "border-input flex-1 sm:flex-none",
                          isCopied ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "",
                        )}
                      >
                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span className="ml-2 sm:hidden">Copy</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={shareReferralLink}
                        title="Share"
                        className="border-input flex-1 sm:flex-none"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="ml-2 sm:hidden">Share</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-6">
                  <div className="bg-card p-3 sm:p-4 rounded-lg shadow-sm border border-border">
                    <div className="flex items-center mb-2">
                      <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-2" />
                      <div className="text-sm font-medium">Total Referrals</div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold">{referralStats.totalReferrals}</div>
                    <div className="text-xs text-muted-foreground mt-1">{referralStats.pendingReferrals} pending</div>
                  </div>
                  <div className="bg-card p-3 sm:p-4 rounded-lg shadow-sm border border-border">
                    <div className="flex items-center mb-2">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 mr-2" />
                      <div className="text-sm font-medium">Completed Referrals</div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold">{referralStats.completedReferrals}</div>
                    <Progress
                      value={(referralStats.completedReferrals / Math.max(1, referralStats.totalReferrals)) * 100}
                      className="h-1.5 mt-2"
                    />
                  </div>
                  <div className="bg-card p-3 sm:p-4 rounded-lg shadow-sm border border-border">
                    <div className="flex items-center mb-2">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 mr-2" />
                      <div className="text-sm font-medium">Tokens Earned</div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold">{referralStats.tokensEarned}</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">+10 tokens per referral</div>
                  </div>
                </div>
              </div>
            </div>

            {referralStats.recentReferrals.length > 0 && (
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-3 sm:p-4 border-b border-border bg-muted/50">
                  <h3 className="font-semibold text-base sm:text-lg">Recent Referrals</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-medium">User</TableHead>
                        <TableHead className="font-medium hidden sm:table-cell">Plan</TableHead>
                        <TableHead className="font-medium">Status</TableHead>
                        <TableHead className="font-medium hidden sm:table-cell">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referralStats.recentReferrals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            No referrals yet. Share your link to get started!
                          </TableCell>
                        </TableRow>
                      ) : (
                        referralStats.recentReferrals.map((referral) => (
                          <TableRow key={referral.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">
                              {referral.referredName || "Anonymous"}
                              <div className="sm:hidden text-xs text-muted-foreground">
                                {new Date(referral.date).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {referral.planId ? (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                  {referral.planId}
                                </Badge>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>
                              <ReferralStatusBadge status={referral.status} />
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">
                              {new Date(referral.date).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 items-start p-4 sm:p-6 bg-gradient-to-r from-muted/50 to-muted border-t border-border">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">How it works:</p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Share your unique referral link with friends</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>When they sign up and subscribe to a paid plan, you both earn rewards</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>You get 10 tokens for each successful referral</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>Your friend gets 5 bonus tokens when they join</span>
            </li>
          </ol>
        </div>
        {userId && referralStats?.referralCode && (
          <Button variant="outline" size="sm" onClick={fetchReferralStats} className="ml-auto border-input">
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
        <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
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

