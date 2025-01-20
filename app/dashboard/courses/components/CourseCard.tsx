"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Book, FileQuestion, Star, Clock } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CourseCardProps {
  id: string
  name: string
  description: string
  image: string
  rating: number
  slug: string
  unitCount: number
  lessonCount: number
  quizCount: number
  userId: string
}

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  name,
  description,
  rating,
  slug,
  unitCount,
  lessonCount,
  quizCount,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="overflow-hidden transition-shadow duration-300 hover:shadow-md"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <div className="h-48 w-full bg-muted flex items-center justify-center">
            <motion.svg
              className="w-32 h-32 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: isHovered ? 1 : 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </motion.svg>
            {isHovered && (
              <motion.div
                className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-primary text-lg font-medium">View Course</span>
              </motion.div>
            )}
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge variant="secondary" className="font-medium">
              {unitCount} Unit{unitCount !== 1 && "s"}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              New
            </Badge>
          </div>
        </div>
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-xl mb-2">{name}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <p className="text-muted-foreground text-sm mb-4">{description}</p>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center">
              <Book className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{lessonCount} lessons</span>
            </div>
            <div className="flex items-center">
              <FileQuestion className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{quizCount} quizzes</span>
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              <span className="text-muted-foreground">{rating.toFixed(1)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Button asChild className="w-full" size="lg">
            <Link href={`/dashboard/course/${slug}`}>View Course</Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

