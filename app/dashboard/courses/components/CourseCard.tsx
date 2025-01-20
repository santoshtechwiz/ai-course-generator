"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Book, FileQuestion, Star, Clock } from "lucide-react"
import Link from "next/link"

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
        className="overflow-hidden transition-shadow duration-300 hover:shadow-xl dark:bg-gray-800"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <div className="h-48 w-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <motion.svg
              className="w-32 h-32 text-blue-500 dark:text-blue-400"
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
                className="absolute inset-0 bg-blue-500/10 backdrop-blur-[2px] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-blue-600 dark:text-blue-400 text-lg font-medium">View Course</span>
              </motion.div>
            )}
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge variant="secondary" className="bg-blue-500 text-white font-medium">
              {unitCount} Unit{unitCount !== 1 && "s"}
            </Badge>
            <Badge variant="secondary" className="bg-white text-gray-600 flex items-center gap-1 shadow-sm">
              <Clock className="w-3 h-3" />
              New
            </Badge>
          </div>
        </div>
        <CardContent className="p-6">
          <motion.h3
            className="font-bold text-xl text-gray-800 dark:text-white mb-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {name}
          </motion.h3>
          <motion.p
            className="text-gray-600 dark:text-gray-300 text-sm mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {description}
          </motion.p>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center">
              <Book className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{lessonCount} lessons</span>
            </div>
            <div className="flex items-center">
              <FileQuestion className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{quizCount} quizzes</span>
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              <span className="text-gray-600 dark:text-gray-300">{rating.toFixed(1)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Link href={`/dashboard/course/${slug}`} className="w-full">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium" size="lg" variant="default">
              View Course
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

