"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { calculateCompletionPercentage } from "../utils/videoUtils"
import { Clock, Award, Book } from "lucide-react"

interface CourseProgressHeaderProps {
  courseTitle: string
  completedChapters: string[] | number[]
  totalChapters: number
  estimatedTime?: string
  currentChapter?: string
}

const CourseProgressHeader: React.FC<CourseProgressHeaderProps> = ({
  courseTitle,
  completedChapters,
  totalChapters,
  estimatedTime,
  currentChapter
}) => {
  const progressPercentage = calculateCompletionPercentage(completedChapters, totalChapters)
  
  return (
    <div className="bg-muted/50 border-b p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold line-clamp-1">{courseTitle}</h1>
            {currentChapter && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center">
                <Book className="h-3.5 w-3.5 mr-1.5" />
                <span className="line-clamp-1">
                  Currently watching: {currentChapter}
                </span>
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {estimatedTime && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{estimatedTime}</span>
              </div>
            )}
            
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{progressPercentage}% Complete</span>
                <Badge variant="outline" className="ml-2">
                  {completedChapters.length}/{totalChapters}
                </Badge>
              </div>
              <Progress value={progressPercentage} className="h-2 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseProgressHeader
