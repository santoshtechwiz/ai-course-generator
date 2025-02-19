import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookIcon, UsersIcon, FileQuestionIcon, StarIcon, EyeIcon, TagIcon, BarChartIcon } from "lucide-react"
import type { CourseCardProps } from "@/app/types/types"
import React from "react"

const determineCourseLevel = (unitCount: number, lessonCount: number, quizCount: number): string => {
  const totalItems = unitCount + lessonCount + quizCount
  if (totalItems < 15) return "Beginner"
  if (totalItems < 30) return "Intermediate"
  return "Advanced"
}

const getLevelColor = (level: string): string => {
  switch (level) {
    case "Beginner":
      return "bg-green-100 text-green-700"
    case "Intermediate":
      return "bg-yellow-100 text-yellow-700"
    case "Advanced":
      return "bg-red-100 text-red-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

export const CourseCard: React.FC<CourseCardProps> = React.memo(
  ({ name, description, rating, slug, unitCount, lessonCount, quizCount, viewCount, category }) => {
    const categoryName = typeof category === "object" ? category.name : category
    const progress = Math.floor(Math.random() * 101) // Simulated progress, replace with actual data
    const courseLevel = determineCourseLevel(unitCount, lessonCount, quizCount)
    const levelColor = getLevelColor(courseLevel)

    return (
      <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full sm:max-w-md bg-gradient-to-br from-background to-primary/5 border border-border group">
        <CardContent className="flex-grow flex flex-col p-6">
          {/* Course Title and Level */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-2xl font-bold text-primary leading-tight">{name}</h3>
            <Badge variant="secondary" className={`${levelColor} font-medium px-2 py-1`}>
              <BarChartIcon className="w-3 h-3 mr-1 inline-block" />
              {courseLevel}
            </Badge>
          </div>

          {/* Rating, Views, and Category */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
              <StarIcon className="w-3 h-3 mr-1 inline-block fill-current" />
              <span className="font-medium">{rating?.toFixed(1)}</span>
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <EyeIcon className="w-3 h-3 mr-1 inline-block" />
              {viewCount}
            </Badge>
            {categoryName && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <TagIcon className="w-3 h-3 mr-1 inline-block" />
                {categoryName}
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

          {/* Progress Bar */}
          <div className="w-full bg-secondary h-2 rounded-full mb-4 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300 ease-in-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 text-sm mb-4">
            {[
              { icon: BookIcon, label: "Units", value: unitCount },
              { icon: UsersIcon, label: "Lessons", value: lessonCount },
              { icon: FileQuestionIcon, label: "Quizzes", value: quizCount },
            ].map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors duration-300"
              >
                <stat.icon className="w-5 h-5 mb-1 text-primary" />
                <span className="font-bold text-base">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </CardContent>

        {/* Footer Section */}
        <CardFooter className="p-6 pt-0">
          <Link href={`/dashboard/course/${slug}`} className="w-full">
            <Button
              variant="default"
              size="lg"
              className="w-full font-semibold group-hover:bg-primary/90 transition-colors duration-300"
            >
              Start Learning
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  },
)

CourseCard.displayName = "CourseCard"

