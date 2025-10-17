"use client"

/**
 * Badge Showcase Component
 * 
 * IMPROVED: Cleaner design showing top achievements
 * - Shows top 6 earned badges
 * - Shows top 3 in-progress badges
 * - Smaller icons, cleaner cards
 * - Better category labels (Quiz, Flashcard, etc.)
 */

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge as BadgeUI } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Award, Lock, Trophy, CheckCircle, Target } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Badge {
  id: string
  name: string
  description: string
  category: string
  icon: string
  requiredValue: number
  tier: string
  unlockedAt?: Date
}

interface BadgeProgress {
  badge: Badge
  unlocked: boolean
  progress: number
  progressPercent: number
}

const tierColors = {
  bronze: 'from-orange-600/10 to-orange-800/10 border-orange-600/20',
  silver: 'from-gray-400/10 to-gray-600/10 border-gray-400/20',
  gold: 'from-yellow-500/10 to-yellow-700/10 border-yellow-500/20',
  platinum: 'from-purple-500/10 to-purple-700/10 border-purple-500/20',
  diamond: 'from-cyan-400/10 to-blue-600/10 border-cyan-400/20'
}

const categoryLabels: Record<string, string> = {
  'flashcard_streak': 'Streak',
  'flashcard_reviews': 'Reviews',
  'flashcard_mastery': 'Mastery',
  'quiz_completion': 'Quizzes',
  'quiz_accuracy': 'Accuracy',
  'special': 'Special'
}

export function BadgeShowcase() {
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['badges', 'progress'],
    queryFn: async () => {
      const response = await fetch('/api/badges?view=progress')
      if (!response.ok) throw new Error('Failed to fetch badge progress')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const badgeProgress: BadgeProgress[] = progressData?.progress || []
  const earnedBadges = badgeProgress.filter(b => b.unlocked)
  const inProgressBadges = badgeProgress
    .filter(b => !b.unlocked && b.progress > 0)
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 3)

  // Show top 6 most recent earned badges
  const topEarned = earnedBadges.slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Achievements
          </CardTitle>
          <BadgeUI variant="secondary" className="text-sm">
            {earnedBadges.length} Earned
          </BadgeUI>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Earned Badges Section */}
        {topEarned.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Recently Earned
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {topEarned.map((item) => (
                <CompactBadgeCard key={item.badge.id} item={item} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Complete quizzes and reviews to unlock achievements!
            </p>
          </div>
        )}

        {/* In Progress Section */}
        {inProgressBadges.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Almost There
            </h4>
            <div className="space-y-3">
              {inProgressBadges.map((item) => (
                <ProgressBadgeCard key={item.badge.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* View All Link */}
        {badgeProgress.length > 9 && (
          <div className="pt-2">
            <Button variant="outline" className="w-full" size="sm" asChild>
              <Link href="/dashboard/achievements">
                View All {badgeProgress.length} Badges
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact Badge Card for earned badges
 */
function CompactBadgeCard({ item }: { item: BadgeProgress }) {
  const { badge } = item

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      <Card
        className={`relative overflow-hidden border-2 bg-gradient-to-br ${
          tierColors[badge.tier as keyof typeof tierColors]
        }`}
      >
        <CardContent className="p-3 space-y-2">
          {/* Badge Icon - Smaller */}
          <div className="text-3xl">{badge.icon}</div>
          
          {/* Badge Name */}
          <div>
            <h5 className="font-semibold text-sm line-clamp-1">{badge.name}</h5>
            <p className="text-xs text-muted-foreground">
              {categoryLabels[badge.category] || badge.category}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * Progress Badge Card for in-progress badges
 */
function ProgressBadgeCard({ item }: { item: BadgeProgress }) {
  const { badge, progress, progressPercent } = item

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Badge Icon */}
          <div className="text-2xl opacity-50">{badge.icon}</div>
          
          {/* Badge Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h5 className="font-semibold text-sm line-clamp-1">{badge.name}</h5>
                <p className="text-xs text-muted-foreground">
                  {categoryLabels[badge.category] || badge.category}
                </p>
              </div>
              <BadgeUI variant="outline" className="text-xs shrink-0">
                {badge.tier}
              </BadgeUI>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {progress} / {badge.requiredValue}
                </span>
                <span className="font-semibold">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BadgeShowcase
