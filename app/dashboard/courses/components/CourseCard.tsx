import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Book, Users, FileQuestion } from "lucide-react"

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

export const CourseCard = ({
  name,
  description,
  image,
  rating,
  slug,
  unitCount,
  lessonCount,
  quizCount,
}: CourseCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="p-0">
        <img src={image || "/placeholder.svg"} alt={name} className="w-full h-48 object-cover" />
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        <div className="flex justify-between items-center mb-4">
          <Badge variant="secondary">{rating?.toFixed(1)} ★</Badge>
          <div className="flex space-x-2 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Book className="w-4 h-4 mr-1" /> {unitCount}
            </span>
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" /> {lessonCount}
            </span>
            <span className="flex items-center">
              <FileQuestion className="w-4 h-4 mr-1" /> {quizCount}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link href={`/dashboard/course/${slug}`} passHref className="w-full">
          <Button className="w-full">View Course</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

