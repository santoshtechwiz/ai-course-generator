/**
 * Continue Learning Widget
 * Shows in-progress courses and quizzes to encourage continuation
 */

"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  PlayCircle, 
  Clock, 
  TrendingUp,
  ChevronRight,
  BookOpen,
  Brain
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { fadeInUp, cardVariants, staggerContainerVariants, staggerItemVariants } from "@/utils/animation-utils"

export interface ContinueLearningItem {
  type: "course" | "quiz"
  id: string
  title: string
  slug: string
  progress: number
  lastAccessed?: Date | string
  estimatedTime?: number
  category?: string
  thumbnailUrl?: string
}

interface ContinueLearningWidgetProps {
  items: ContinueLearningItem[]
  maxItems?: number
  className?: string
  onItemClick?: (item: ContinueLearningItem) => void
}

export function ContinueLearningWidget({ 
  items, 
  maxItems = 3,
  className,
  onItemClick 
}: ContinueLearningWidgetProps) {
  if (items.length === 0) return null

  const displayItems = items.slice(0, maxItems)

  return (
    <motion.div
      {...fadeInUp(0.2)}
      className={cn("w-full", className)}
    >
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Continue Learning</CardTitle>
            </div>
            {items.length > maxItems && (
              <Link href="/dashboard/home?tab=courses">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pick up where you left off
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {displayItems.map((item, index) => (
              <ContinueLearningCard 
                key={item.id} 
                item={item} 
                index={index}
                onClick={() => onItemClick?.(item)}
              />
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface ContinueLearningCardProps {
  item: ContinueLearningItem
  index: number
  onClick?: () => void
}

function ContinueLearningCard({ item, index, onClick }: ContinueLearningCardProps) {
  const Icon = item.type === "course" ? BookOpen : Brain
  const href = item.type === "course" 
    ? `/dashboard/course/${item.slug}`
    : `/dashboard/quiz/${item.slug}`

  // Format last accessed time
  const getTimeAgo = (date: Date | string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <motion.div variants={staggerItemVariants}>
      <Link href={href} onClick={onClick}>
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Card className="border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Icon/Thumbnail */}
                <div className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
                  item.type === "course" 
                    ? "bg-gradient-to-br from-primary/10 to-primary/5 text-primary" 
                    : "bg-gradient-to-br from-purple-500/10 to-purple-500/5 text-purple-500"
                )}>
                  <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm line-clamp-1 text-foreground">
                        {item.title}
                      </h4>
                      <Badge variant="secondary" className="flex-shrink-0 text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    
                    {item.category && (
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        {Math.round(item.progress)}% complete
                      </span>
                      {item.lastAccessed && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(item.lastAccessed)}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Progress value={item.progress} className="h-2" />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                        className="absolute top-0 left-0 h-2 bg-gradient-to-r from-primary to-primary/80 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Metadata & CTA */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.estimatedTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.estimatedTime}h left
                        </span>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs px-3 group"
                    >
                      Continue
                      <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  )
}
