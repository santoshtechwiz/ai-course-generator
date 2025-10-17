/**
 * Completion Upsell Component
 * Shows after completing a course or quiz with next steps
 */

"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy,
  ArrowRight,
  BookOpen,
  Brain,
  Star,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Target
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { fadeInUp, scaleIn } from "@/utils/animation-utils"

interface CompletionUpsellProps {
  completedItem: {
    type: "course" | "quiz"
    title: string
    score?: number
  }
  recommendations: {
    type: "course" | "quiz"
    id: string
    title: string
    slug: string
    description?: string
    category?: string
    difficulty?: string
    reason: string
  }[]
  onRecommendationClick?: (id: string) => void
  className?: string
}

export function CompletionUpsell({ 
  completedItem, 
  recommendations,
  onRecommendationClick,
  className 
}: CompletionUpsellProps) {
  const isHighScore = completedItem.score !== undefined && completedItem.score >= 80

  return (
    <motion.div
      {...fadeInUp(0.4)}
      className={cn("w-full max-w-4xl mx-auto", className)}
    >
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          {/* Celebration Header */}
          <div className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-8 text-center overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 2, opacity: 0.1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary rounded-full blur-3xl"
              />
            </div>

            {/* Content */}
            <div className="relative z-10 space-y-4">
              <motion.div
                {...scaleIn(0.2)}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg"
              >
                {isHighScore ? (
                  <Trophy className="h-10 w-10 text-white" />
                ) : (
                  <CheckCircle2 className="h-10 w-10 text-white" />
                )}
              </motion.div>

              <div className="space-y-2">
                <motion.h2 
                  {...fadeInUp(0.3)}
                  className="text-2xl md:text-3xl font-bold text-foreground"
                >
                  {isHighScore ? "🎉 Excellent Work!" : "✅ Well Done!"}
                </motion.h2>
                <motion.p 
                  {...fadeInUp(0.4)}
                  className="text-muted-foreground"
                >
                  You've completed <span className="font-semibold text-foreground">{completedItem.title}</span>
                  {completedItem.score !== undefined && (
                    <span> with a score of <span className="font-semibold text-primary">{completedItem.score}%</span></span>
                  )}
                </motion.p>
              </div>

              {isHighScore && (
                <motion.div {...fadeInUp(0.5)}>
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-md">
                    <Star className="h-3 w-3 mr-1 fill-white" />
                    High Achiever
                  </Badge>
                </motion.div>
              )}
            </div>
          </div>

          {/* Recommendations Section */}
          <div className="p-8 space-y-6">
            <motion.div {...fadeInUp(0.6)} className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">
                  What's Next?
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Continue your learning journey with these personalized recommendations
              </p>
            </motion.div>

            {/* Recommendations Grid */}
            <motion.div 
              {...fadeInUp(0.7)}
              className="grid gap-4 md:grid-cols-2"
            >
              {recommendations.slice(0, 4).map((rec, index) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  index={index}
                  onClick={() => onRecommendationClick?.(rec.id)}
                />
              ))}
            </motion.div>

            {/* Additional CTA */}
            <motion.div 
              {...fadeInUp(0.8)}
              className="flex items-center justify-center gap-4 pt-4 border-t border-border/50"
            >
              <Link href="/dashboard/home">
                <Button variant="outline" size="lg">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse All Courses
                </Button>
              </Link>
              <Link href="/dashboard/home?tab=quizzes">
                <Button variant="outline" size="lg">
                  <Brain className="h-4 w-4 mr-2" />
                  Explore Quizzes
                </Button>
              </Link>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface RecommendationCardProps {
  recommendation: {
    type: "course" | "quiz"
    id: string
    title: string
    slug: string
    description?: string
    category?: string
    difficulty?: string
    reason: string
  }
  index: number
  onClick?: () => void
}

function RecommendationCard({ recommendation, index, onClick }: RecommendationCardProps) {
  const Icon = recommendation.type === "course" ? BookOpen : Brain
  const href = recommendation.type === "course" 
    ? `/dashboard/course/${recommendation.slug}`
    : `/dashboard/quiz/${recommendation.slug}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={href} onClick={onClick}>
        <Card className="h-full border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm group">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                recommendation.type === "course" 
                  ? "bg-primary/10 text-primary" 
                  : "bg-purple-500/10 text-purple-500"
              )}>
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                  {recommendation.title}
                </h4>
                {recommendation.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {recommendation.description}
                  </p>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="flex items-center gap-1 text-xs text-primary bg-primary/5 rounded-md px-2 py-1.5">
              <Target className="h-3 w-3" />
              <span className="font-medium">{recommendation.reason}</span>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {recommendation.category && (
                  <Badge variant="outline" className="text-xs">
                    {recommendation.category}
                  </Badge>
                )}
                {recommendation.difficulty && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs",
                      recommendation.difficulty === "easy" && "bg-green-500/10 text-green-700 dark:text-green-400",
                      recommendation.difficulty === "medium" && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
                      recommendation.difficulty === "hard" && "bg-red-500/10 text-red-700 dark:text-red-400"
                    )}
                  >
                    {recommendation.difficulty}
                  </Badge>
                )}
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}
