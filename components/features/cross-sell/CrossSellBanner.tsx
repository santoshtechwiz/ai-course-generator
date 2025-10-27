/**
 * Cross-Sell Banner Component
 * Smart, non-intrusive recommendations for related courses and quizzes
 */

"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import neo from "@/components/neo/tokens"
import { 
  ArrowRight, 
  BookOpen, 
  Brain, 
  TrendingUp, 
  Star,
  Sparkles,
  X
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { fadeInUp, cardVariants } from "@/utils/animation-utils"

interface CrossSellItem {
  type: "course" | "quiz"
  id: string
  title: string
  slug: string
  description?: string
  category?: string
  difficulty?: string
  confidence?: number
  reason?: string
}

interface CrossSellBannerProps {
  items: CrossSellItem[]
  context: "dashboard" | "course-completion" | "quiz-completion"
  onDismiss?: () => void
  onItemClick?: (item: CrossSellItem) => void
  className?: string
}

export function CrossSellBanner({ 
  items, 
  context, 
  onDismiss, 
  onItemClick,
  className 
}: CrossSellBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed || items.length === 0) return null

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const getContextTitle = () => {
    switch (context) {
      case "course-completion":
        return "🎉 Great Job! Keep Learning"
      case "quiz-completion":
        return "🎯 Ready for More?"
      default:
        return "✨ Recommended for You"
    }
  }

  const getContextDescription = () => {
    switch (context) {
      case "course-completion":
        return "Continue your learning journey with these related topics"
      case "quiz-completion":
        return "Challenge yourself with more quizzes or explore related courses"
      default:
        return "Personalized suggestions based on your learning path"
    }
  }

  return (
    <motion.div
      {...fadeInUp(0.3)}
      className={cn("w-full", className)}
    >
      <Card className="border-4 border-primary/20 bg-primary/5 shadow-[6px_6px_0px_0px_hsl(var(--border))] overflow-hidden">
        <CardContent className="p-6 relative">
          {/* Dismiss button */}
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-primary/10"
              onClick={handleDismiss}
              aria-label="Dismiss recommendations"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Header */}
          <div className="mb-6 pr-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                {getContextTitle()}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {getContextDescription()}
            </p>
          </div>

          {/* Items Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 3).map((item, index) => (
              <CrossSellItem
                key={item.id}
                item={item}
                index={index}
                onClick={() => onItemClick?.(item)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface CrossSellItemProps {
  item: CrossSellItem
  index: number
  onClick?: () => void
}

function CrossSellItem({ item, index, onClick }: CrossSellItemProps) {
  const Icon = item.type === "course" ? BookOpen : Brain
  const href = item.type === "course" 
    ? `/dashboard/course/${item.slug}`
    : `/dashboard/quiz/${item.slug}`

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      transition={{ delay: index * 0.1 }}
    >
      <Link href={href} onClick={onClick}>
        <Card className="h-full border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-none flex items-center justify-center",
                item.type === "course" 
                  ? "bg-primary/10 text-primary" 
                  : "bg-purple-500/10 text-purple-500"
              )}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm line-clamp-2 text-foreground">
                    {item.title}
                  </h4>
                  {item.confidence && item.confidence > 0.7 && (
                    <Badge variant="neutral" className={cn(neo.badge, "flex-shrink-0 bg-green-500/10 text-green-700 dark:text-green-400 text-xs")}>
                      <Star className="h-3 w-3 mr-1" />
                      {Math.round(item.confidence * 100)}%
                    </Badge>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}

                {item.reason && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <TrendingUp className="h-3 w-3" />
                    <span>{item.reason}</span>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-2 flex-wrap">
                  {item.category && (
                    <Badge variant="neutral" className={cn(neo.badge, "text-xs")}>
                      {item.category}
                    </Badge>
                  )}
                  {item.difficulty && (
                    <Badge 
                      variant="neutral" 
                      className={cn(
                        neo.badge,
                        "text-xs",
                        item.difficulty === "easy" && "bg-green-500/10 text-green-700 dark:text-green-400",
                        item.difficulty === "medium" && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
                        item.difficulty === "hard" && "bg-red-500/10 text-red-700 dark:text-red-400"
                      )}
                    >
                      {item.difficulty}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between text-xs group"
              >
                <span>{item.type === "course" ? "Start Course" : "Take Quiz"}</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}
