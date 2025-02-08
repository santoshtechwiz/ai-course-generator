import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Book, Users, FileQuestion, Star } from 'lucide-react'
import Image from "next/image"
import type React from "react"
import type { CourseCardProps } from "@/app/types/types"

export const CourseCard: React.FC<CourseCardProps> = ({
  name,
  description,
  image,
  rating,
  slug,
  unitCount,
  lessonCount,
  quizCount,
}) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative w-full pt-[56.25%]"> {/* 16:9 aspect ratio */}
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            layout="fill"
            objectFit="cover"
            className="absolute top-0 left-0 transition-transform duration-300 hover:scale-105"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{name}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">{description}</p>
        <div className="flex justify-between items-center">
          <Badge variant="secondary" className="px-2 py-1">
            <Star className="w-4 h-4 mr-1 inline-block text-yellow-500" />
            <span className="font-medium">{rating?.toFixed(1)}</span>
          </Badge>
          <div className="flex space-x-2 text-xs text-muted-foreground">
            <span className="flex items-center">
              <Book className="w-3 h-3 mr-1" /> {unitCount}
            </span>
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1" /> {lessonCount}
            </span>
            <span className="flex items-center">
              <FileQuestion className="w-3 h-3 mr-1" /> {quizCount}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4">
        <Link href={`/dashboard/course/${slug}`} passHref className="w-full">
          <Button className="w-full">View Course</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
