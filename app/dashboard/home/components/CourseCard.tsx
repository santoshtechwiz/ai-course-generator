import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookIcon, UsersIcon, FileQuestionIcon, StarIcon, EyeIcon, TagIcon } from "lucide-react"
import type { CourseCardProps } from "@/app/types/types"
import React from "react"

export const CourseCard: React.FC<CourseCardProps> = React.memo(
  ({ name, description, image, rating, slug, unitCount, lessonCount, quizCount, viewCount,category }) => {
    const categoryName = typeof category === "object" ? category.name : category
    return (
     
        <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg w-full sm:max-w-md bg-card border border-border">
          {/* Image Section */}
          <div className="relative w-full pt-[56.25%]">
            <Image
              src={image || "/placeholder.svg"}
              alt={name}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
            {/* Badges (Rating, Views, Category) */}
            <div className="absolute top-2 left-2 flex gap-2">
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                <StarIcon className="w-4 h-4 mr-1 inline-block text-yellow-500" />
                <span className="font-medium">{rating?.toFixed(1)}</span>
              </Badge>
              <Badge variant="outline" className="bg-card text-card-foreground">
                <EyeIcon className="w-4 h-4 mr-1 inline-block" />
                {viewCount}
              </Badge>
              {categoryName && (
                <Badge variant="outline" className="bg-card text-card-foreground">
                  <TagIcon className="w-4 h-4 mr-1 inline-block" />
                  {categoryName}
                </Badge>
              )}
            </div>
          </div>
  
          {/* Content Section */}
          <CardContent className="flex-grow flex flex-col p-6">
            <h3 className="text-xl font-semibold mb-2 text-primary">{name}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">{description}</p>
  
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex flex-col items-center justify-center">
                <BookIcon className="w-5 h-5 mb-1 text-primary" />
                <span className="font-medium">{unitCount}</span>
                <span className="text-xs text-muted-foreground">Units</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <UsersIcon className="w-5 h-5 mb-1 text-primary" />
                <span className="font-medium">{lessonCount}</span>
                <span className="text-xs text-muted-foreground">Lessons</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <FileQuestionIcon className="w-5 h-5 mb-1 text-primary" />
                <span className="font-medium">{quizCount}</span>
                <span className="text-xs text-muted-foreground">Quizzes</span>
              </div>
            </div>
          </CardContent>
  
          {/* Footer Section */}
          <CardFooter className="p-6 pt-0">
            <Link href={`/dashboard/course/${slug}`} className="w-full">
              <Button variant="default" size="sm" className="w-full">
                View Course
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )
  },
)

CourseCard.displayName = "CourseCard"

