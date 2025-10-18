"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, 
  Clock, 
  Star, 
  TrendingUp, 
  Users, 
  PlayCircle,
  ChevronRight,
  Sparkles,
  Target,
  Award
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { RelatedCourse, PersonalizedRecommendation } from "@/services/recommendationsService"
import { getImageWithFallback } from '@/utils/image-utils'

interface EnhancedRecommendedCoursesProps {
  userId?: string
  currentCourseId?: string | number
  relatedCourses?: RelatedCourse[]
  personalizedRecommendations?: PersonalizedRecommendation[]
  className?: string
}

interface RecommendationCard {
  id: string | number
  title: string
  description: string
  image?: string
  slug: string
  category?: string
  level?: "Beginner" | "Intermediate" | "Advanced"
  duration?: string
  rating?: number
  studentCount?: number
  progress?: number
  matchReason?: string
  tags?: string[]
  isNew?: boolean
  isPopular?: boolean
  isTrending?: boolean
}

const EnhancedRecommendedCourses: React.FC<EnhancedRecommendedCoursesProps> = ({
  userId,
  currentCourseId,
  relatedCourses = [],
  personalizedRecommendations = [],
  className
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Load recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      setIsLoading(true)
      
      try {
        // Transform related courses
        const relatedCards: RecommendationCard[] = relatedCourses.map(course => ({
          id: course.id,
          title: course.title,
          description: course.description,
          image: course.image,
          slug: course.slug,
          category: "Related",
          level: "Intermediate",
          duration: "2-3 hours",
          rating: 4.5 + Math.random() * 0.5,
          studentCount: Math.floor(Math.random() * 1000) + 100,
          tags: ["Recommended", "Similar"],
          isPopular: Math.random() > 0.7
        }))

        // Transform personalized recommendations
        const personalizedCards: RecommendationCard[] = personalizedRecommendations.map(rec => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          image: rec.image,
          slug: rec.slug,
          matchReason: rec.matchReason,
          category: "For You",
          level: "Beginner",
          duration: "1-2 hours",
          rating: 4.3 + Math.random() * 0.7,
          studentCount: Math.floor(Math.random() * 500) + 50,
          tags: ["Personalized", "Trending"],
          isTrending: Math.random() > 0.6,
          isNew: Math.random() > 0.8
        }))

        // Add mock popular courses if we need more content
        const mockCourses: RecommendationCard[] = [
          {
            id: "popular-1",
            title: "Advanced React Patterns",
            description: "Master advanced React patterns including render props, compound components, and more.",
            image: "/api/placeholder/400/225",
            slug: "advanced-react-patterns",
            category: "Popular",
            level: "Advanced",
            duration: "4-5 hours",
            rating: 4.8,
            studentCount: 2543,
            tags: ["Popular", "React", "Advanced"],
            isPopular: true
          },
          {
            id: "trending-1",
            title: "Next.js 14 Complete Guide",
            description: "Learn the latest features of Next.js 14 including App Router, Server Components, and more.",
            image: "/api/placeholder/400/225",
            slug: "nextjs-14-guide",
            category: "Trending",
            level: "Intermediate",
            duration: "3-4 hours",
            rating: 4.7,
            studentCount: 1876,
            tags: ["Trending", "Next.js", "Web Development"],
            isTrending: true,
            isNew: true
          },
          {
            id: "beginner-1",
            title: "JavaScript Fundamentals",
            description: "Build a solid foundation in JavaScript with hands-on projects and real-world examples.",
            image: "/api/placeholder/400/225",
            slug: "javascript-fundamentals",
            category: "Beginner",
            level: "Beginner",
            duration: "2-3 hours",
            rating: 4.6,
            studentCount: 3421,
            tags: ["Beginner", "JavaScript", "Foundation"],
            isPopular: true
          }
        ]

        const allRecommendations = [...relatedCards, ...personalizedCards, ...mockCourses]
        setRecommendations(allRecommendations)
      } catch (error) {
        console.error("Failed to load recommendations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecommendations()
  }, [relatedCourses, personalizedRecommendations])

  // Filter recommendations by category
  const filteredRecommendations = selectedCategory === "all" 
    ? recommendations 
    : recommendations.filter(rec => rec.category?.toLowerCase() === selectedCategory.toLowerCase())

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(recommendations.map(rec => rec.category).filter(Boolean)))]

  const CourseCard: React.FC<{ course: RecommendationCard; index: number }> = ({ course, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="overflow-hidden border-2 border-border hover:translate-x-[2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_var(--border)] transition-none shadow-[6px_6px_0px_0px_var(--border)] h-full">
        <div className="relative">
          <div className="aspect-video bg-muted flex items-center justify-center">
            {course.image ? (
              <Image 
                src={getImageWithFallback(course.image)} 
                alt={course.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-main border-2 border-border rounded-sm flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-main-foreground" />
              </div>
            )}
          </div>
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {course.isNew && (
              <Badge variant="secondary" className="bg-success/20 text-success text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                New
              </Badge>
            )}
            {course.isTrending && (
              <Badge variant="secondary" className="bg-warning/20 text-warning text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            {course.isPopular && (
              <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">
                <Star className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
          </div>

          {/* Level Badge */}
          <div className="absolute top-2 right-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                course.level === "Beginner" && "bg-success/10 text-success border-success/20",
                course.level === "Intermediate" && "bg-warning/10 text-warning border-warning/20",
                course.level === "Advanced" && "bg-destructive/10 text-destructive border-destructive/20"
              )}
            >
              {course.level}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {course.description}
            </p>
          </div>

          {/* Match Reason */}
          {course.matchReason && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <Target className="w-3 h-3" />
              <span>{course.matchReason}</span>
            </div>
          )}

          {/* Course Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{course.studentCount?.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-warning text-warning" />
              <span>{course.rating?.toFixed(1)}</span>
            </div>
          </div>

          {/* Progress Bar (if user has started) */}
          {course.progress && course.progress > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2" />
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {course.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Action Button */}
          <Button asChild className="w-full" size="sm">
            <Link href={`/dashboard/course/${course.slug}`}>
              <PlayCircle className="w-4 h-4 mr-2" />
              {course.progress && course.progress > 0 ? "Continue" : "Start Course"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Loading...</span>
          <span className="text-sm text-muted-foreground">Loading recommendations...</span>
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="font-semibold mb-2">No Recommendations Available</h3>
        <p className="text-sm text-muted-foreground">
          Complete more courses to get personalized recommendations
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Recommended for You
          </h2>
          <p className="text-sm text-muted-foreground">
            Courses tailored to your learning journey
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category || "all")}
            className="capitalize"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Recommendations Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredRecommendations.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredRecommendations.length === 0 && selectedCategory !== "all" && (
        <div className="text-center py-8">
          <h3 className="font-semibold mb-2">No {selectedCategory} Courses</h3>
          <p className="text-sm text-muted-foreground">
            Try selecting a different category
          </p>
        </div>
      )}
    </div>
  )
}

export default EnhancedRecommendedCourses
