'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Book, Heart, ArrowRight } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Favorite } from "@/app/types/types"

interface FavoriteCoursesProps {
  favorites: Favorite[]
  }



export default function FavoriteCourses({ favorites }: FavoriteCoursesProps) {
  if (!favorites?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Favorite Courses</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <Heart className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No favorite courses yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Favorite Courses</span>
          <Badge variant="secondary">
            {favorites.length} Favorites
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {favorites.map(({ id, course }) => (
              <Link
                key={id}
                href={`/dashboard/course/${course.slug}`}
                className="group block"
              >
                <div className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted">
                  <div className="relative h-16 w-16 overflow-hidden rounded-md">
                    <Image
                      src={course.image || "/placeholder.svg"}
                      alt={course.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{course.name}</h3>
                      <ArrowRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Book className="mr-1 h-4 w-4" />
                        <span>{course.category.name}</span>
                      </div>
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {course.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

