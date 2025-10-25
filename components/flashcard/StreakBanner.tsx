"use client"

import { motion } from "framer-motion"
import { Flame } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"

interface StreakBannerProps {
  userId?: string
}

export function StreakBanner({ userId }: StreakBannerProps) {
  const { data: streak } = useQuery({
    queryKey: ['streak', userId],
    queryFn: async () => {
      const response = await fetch('/api/flashcards/streak')
      if (!response.ok) throw new Error('Failed to fetch streak')
      return response.json()
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable automatic refetching
  })

  if (!streak || streak.current === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4 bg-warning/20 border-l-6 border-warning">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Flame className="h-10 w-10 text-orange-500" />
            </motion.div>
            
            <div className="flex-1">
              <p className="text-2xl font-black text-foreground">
                {streak.current} Day Streak! 🔥
              </p>
              <p className="text-sm text-muted-foreground">
                {streak.inDanger ? (
                  <span className="text-orange-600 dark:text-orange-400 font-semibold">
                    ⚠️ {streak.hoursRemaining}h left to keep your streak alive!
                  </span>
                ) : (
                  `Best streak: ${streak.longest} days`
                )}
              </p>
            </div>

            {streak.longest > streak.current && (
              <div className="text-center px-4 border-l border-border/50">
                <p className="text-xs text-muted-foreground">Personal Best</p>
                <p className="text-xl font-bold text-primary">
                  {streak.longest}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
