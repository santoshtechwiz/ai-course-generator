"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import neo from "@/components/neo/tokens"
import { AlertCircle, Crown, Sparkles, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

interface UsageStat {
  allowed: boolean
  current: number
  limit: number
  resetAt?: Date
}

interface UpgradePromptProps {
  resource: 'flashcard_reviews' | 'flashcard_decks' | 'flashcard_cards'
  onClose?: () => void
}

export function UpgradePrompt({ resource, onClose }: UpgradePromptProps) {
  const router = useRouter()

  const { data } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: async () => {
      const response = await fetch('/api/usage/stats')
      if (!response.ok) throw new Error('Failed to fetch usage stats')
      return response.json()
    }
  })

  const stats = data?.stats || {}
  const usage: UsageStat = stats[resource]

  if (!usage) return null

  const percentUsed = (usage.current / usage.limit) * 100
  const isNearLimit = percentUsed >= 80
  const isAtLimit = !usage.allowed

  const resourceLabels = {
    flashcard_reviews: 'Daily Reviews',
    flashcard_decks: 'Flashcard Decks',
    flashcard_cards: 'Cards per Deck'
  }

  const resourceLabel = resourceLabels[resource]

  if (!isNearLimit && !isAtLimit) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/5 to-yellow-500/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {isAtLimit ? (
                <AlertCircle className="h-6 w-6 text-orange-600" />
              ) : (
                <Zap className="h-6 w-6 text-yellow-600" />
              )}
              <div>
                <CardTitle className="text-lg">
                  {isAtLimit
                    ? `${resourceLabel} Limit Reached`
                    : `Almost at ${resourceLabel} Limit`}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {usage.current} of {usage.limit} used
                  {usage.resetAt && !isAtLimit && (
                    <> • Resets {new Date(usage.resetAt).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress
              value={percentUsed}
              className={`h-3 ${isAtLimit ? 'bg-red-200' : 'bg-yellow-200'}`}
            />
          </div>

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 rounded-lg border border-purple-500/20">
            <div className="flex items-start gap-3">
              <Crown className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  Upgrade to Pro
                  <Badge variant="neutral" className={cn(neo.badge, "bg-purple-500/20 text-purple-700 dark:text-purple-300")}> 
                    Most Popular
                  </Badge>
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Unlimited daily reviews
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Up to 50 flashcard decks
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    1,000 cards per deck
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Advanced analytics & export
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Priority support
                  </li>
                </ul>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-lg"
                  onClick={() => router.push('/dashboard/subscription')}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>

          {/* Alternative: Wait for reset */}
          {isAtLimit && usage.resetAt && (
            <p className="text-center text-sm text-muted-foreground">
              Or wait until {new Date(usage.resetAt).toLocaleString()} for free limit to reset
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function UsageStatsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: async () => {
      const response = await fetch('/api/usage/stats')
      if (!response.ok) throw new Error('Failed to fetch usage stats')
      return response.json()
    }
  })

  if (isLoading || !data) return null

  const stats = data.stats

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">📊 Usage Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(stats).map(([resource, usage]: [string, any]) => {
          const percentUsed = (usage.current / usage.limit) * 100
          const isNearLimit = percentUsed >= 80

          return (
            <div key={resource} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="capitalize">
                  {resource.replace('_', ' ')}
                </span>
                <span className={isNearLimit ? 'text-orange-600 font-semibold' : ''}>
                  {usage.current} / {usage.limit}
                </span>
              </div>
              <Progress
                value={percentUsed}
                className={`h-2 ${isNearLimit ? 'bg-orange-200' : ''}`}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
