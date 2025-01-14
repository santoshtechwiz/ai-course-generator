"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Star, Book, FileQuestion } from 'lucide-react'
import Link from 'next/link'

interface CourseCardProps {
  id: string
  name: string
  image: string
  lessonCount: number
  quizCount: number
  rating: number
  slug: string
}

export default function CourseCard({ id, name, image, lessonCount, quizCount, rating, slug }: CourseCardProps) {
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
        className="overflow-hidden transition-shadow duration-300 hover:shadow-xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-video overflow-hidden">
          <img
            src={image}
            alt={name}
            className={`object-cover w-full h-full transition-transform duration-500 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
          />
        </div>
        <CardContent className="p-4">
          <h3 className="text-xl font-semibold mb-2">{name}</h3>
          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span className="flex items-center">
              <Book className="w-4 h-4 mr-1" />
              {lessonCount} Lessons
            </span>
            <span className="flex items-center">
              <FileQuestion className="w-4 h-4 mr-1" />
              {quizCount} Quizzes
            </span>
          </div>
          <div className="flex items-center">
            <Star className="w-5 h-5 text-yellow-400 mr-1 fill-current" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Link href={`/dashboard/course/${slug}`} className="w-full">
            <Button className="w-full">Learn More</Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
